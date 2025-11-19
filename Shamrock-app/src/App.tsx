import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import supabase from "./utils/supabaseClient";

import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Usuario from "./components/Usuario";
import Recompensas from "./pages/Recompensas";
import Inicio from "./pages/Inicio";
import Areas from "./pages/Areas";
import RegistrarEmpleado from "./pages/RegistrarEmpleado";
import "./App.css";

type Rol = "admin" | "usuario";

export default function App() {
  const [logueado, setLogueado] = useState(false);
  const [usuario, setUsuario] = useState<string>("");
  const [rol, setRol] = useState<Rol | "">("");

  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [cargandoRol, setCargandoRol] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {
    let mounted = true;

    const cargarSesion = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session?.user?.email) {
          if (!mounted) return;
          setUsuario(session.user.email.trim());
          setLogueado(true);
        } else {
          setUsuario("");
          setLogueado(false);
          setRol("");
        }
      } catch (e) {
        console.error("Error verificando sesión:", e);
        setUsuario("");
        setLogueado(false);
      } finally {
        if (mounted) setCargandoSesion(false);
      }
    };

    cargarSesion();


    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("📡 Evento de sesión:", event);

        if (session?.user?.email) {
          const email = session.user.email.trim();
          
          await new Promise((r) => setTimeout(r, 600));

          setUsuario(email);
          setLogueado(true);
        } else {
          setUsuario("");
          setLogueado(false);
          setRol("");
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (!logueado) return;

    let mounted = true;

    const obtenerRol = async () => {
      setCargandoRol(true);

      try {
        // Obtener usuario actual
        const { data: sessionData } = await supabase.auth.getUser();
        const userId = sessionData?.user?.id;

        if (!userId) {
          console.warn("No hay ID de usuario en sesión.");
          await supabase.auth.signOut();
          return;
        }

        // Buscar en empleados
        const { data: empleado } = await supabase
          .from("empleados")
          .select("id, activo")
          .eq("auth_user_id", userId)
          .maybeSingle();

        if (!empleado) {
          console.warn("Empleado no encontrado.");
          await supabase.auth.signOut();
          return;
        }

        if (!empleado.activo) {
          console.warn("⚠️ Empleado INACTIVO");
          await supabase.auth.signOut();
          return;
        }

        // Buscar rol
        const { data: rolData } = await supabase
          .from("roles_app")
          .select("rol")
          .eq("empleado_id", empleado.id)
          .maybeSingle();

        const rolEncontrado = (rolData?.rol as Rol) || "usuario";

        if (mounted) {
          setRol(rolEncontrado);
        }
      } catch (err: any) {
        console.error("💥 Error cargando rol:", err.message);
        if (mounted) setRol("");
      } finally {
        if (mounted) setCargandoRol(false);
      }
    };

    obtenerRol();

    return () => {
      mounted = false;
    };
  }, [logueado]);


  useEffect(() => {
    if (!logueado || !rol) return;

    if (location.pathname === "/" || location.pathname === "/login") {
      if (rol === "admin") navigate("/Inicio", { replace: true });
      else navigate("/usuario", { replace: true });
    }
  }, [rol, logueado]);


  if (cargandoSesion) {
    return (
      <div className="loader-center-screen">
        <img src="/sham.jpg" className="logo-spin" />
        <h2>Cargando...</h2>
      </div>
    );
  }

  if (!logueado) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (cargandoRol && !rol) {
    return (
      <div className="loader-center-screen">
        <img src="/sham.jpg" className="logo-spin" />
        <h2>Cargando....</h2>
      </div>
    );
  }

  if (rol === "usuario") {
    return (
      <Routes> 
        <Route
          path="/usuario"
          element={
            <Usuario
              user={usuario}
              onLogout={async () => void supabase.auth.signOut()}
            />
          }
        />
        <Route path="*" element={<Navigate to="/usuario" replace />} />
      </Routes>
    );
  }

  if (rol === "admin") {
    return (
      <div className="app-container">
        <Sidebar
          user={usuario}
          onLogout={async () => await supabase.auth.signOut()}
        />
        <main className="contenido">
          <Routes>
            <Route path="/Inicio" element={<Inicio />} />
            <Route path="/recompensas" element={<Recompensas/>} />
            <Route path="/registrar" element={<RegistrarEmpleado />} />
            <Route path="/gestionareas" element={<Areas />} />
            <Route path="*" element={<Navigate to="/Inicio" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  console.warn("⚠️ Rol no reconocido, cerrando sesión.");
  supabase.auth.signOut();
  return <Navigate to="/" replace />;
}
