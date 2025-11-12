import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import supabase from "./utils/supabaseClient";

import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Usuario from "./components/Usuario";
import Inicio from "./pages/Inicio";
import Empleados from "./pages/Empleados";
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

  // === 1️⃣ Verificar sesión inicial y cambios ===
  useEffect(() => {
    let mounted = true;

    const cargarSesion = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (session?.user?.email) {
          const email = session.user.email.trim();
          console.log("✅ Sesión detectada:", email);
          if (!mounted) return;
          setUsuario(email);
          setLogueado(true);
        } else {
          console.log("Sin sesión activa");
          setUsuario("");
          setLogueado(false);
          setRol("");
        }
      } catch (e) {
        console.error("Error verificando sesión:", e);
        setUsuario("");
        setLogueado(false);
        setRol("");
      } finally {
        if (mounted) setCargandoSesion(false);
      }
    };

    cargarSesion();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("📡 Evento de sesión:", event);
      if (session?.user?.email) {
        const email = session.user.email.trim();
        setUsuario(email);
        setLogueado(true);
      } else {
        console.log("Sesión cerrada");
        setUsuario("");
        setLogueado(false);
        setRol("");
      }
    });

    const sub = listener?.subscription;
    return () => {
      mounted = false;
      sub?.unsubscribe();
    };
  }, []);

  // Cargar rol real desde empleados + roles_app ===
  useEffect(() => {
    let mounted = true;
    const obtenerRol = async () => {
      if (!logueado) return;
      setCargandoRol(true);

      try {
        //Obtener usuario actual
        const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
        if (sessionError) throw sessionError;
        const userId = sessionData?.user?.id;

        if (!userId) {
          console.warn("⚠️ No se encontró ID de usuario en la sesión.");
          await supabase.auth.signOut();
          return;
        }

        // Buscar empleado asociado
        const { data: empleado, error: empError } = await supabase
          .from("empleados")
          .select("id, nombre, activo")
          .eq("auth_user_id", userId)
          .maybeSingle();

        if (empError) throw empError;

        if (!empleado) {
          console.warn("⚠️ No existe el empleado en la tabla 'empleados'");
          await supabase.auth.signOut();
          setLogueado(false);
          return;
        }

        if (!empleado.activo) {
          console.warn("Empleado inactivo");
          await supabase.auth.signOut();
          setLogueado(false);
          return;
        }

        //Buscar rol asociado
        const { data: rolData, error: rolError } = await supabase
          .from("roles_app")
          .select("rol")
          .eq("empleado_id", empleado.id)
          .maybeSingle();

        if (rolError) throw rolError;

        const rolEncontrado = (rolData?.rol as Rol) || "usuario";
        console.log("Rol encontrado:", rolEncontrado);
        if (mounted) setRol(rolEncontrado);
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

  // ===Redirección según rol ===
  useEffect(() => {
    if (!logueado || !rol) return;
    if (location.pathname === "/" || location.pathname === "/login") {
      if (rol === "admin") navigate("/Inicio", { replace: true });
      else navigate("/usuario", { replace: true });
    }
  }, [logueado, rol]);

  // === 4render ===

  if (cargandoSesion) {
    return (
      <div className="loader">
        <h2>Verificando sesión...</h2>
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
      <div className="loader">
        <h2>Cargando permisos...</h2>
      </div>
    );
  }

  // === Usuario normal ===
  if (rol === "usuario") {
    return (
      <Routes>
        <Route
          path="/usuario"
          element={
            <Usuario
              user={usuario}
              onLogout={async () => await supabase.auth.signOut()}
            />
          }
        />
        <Route path="*" element={<Navigate to="/Usuario" replace />} />
      </Routes>
    );
  }

  // === Administrador ===
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
            <Route path="/empleado" element={<Empleados />} />
            <Route path="/registrar" element={<RegistrarEmpleado />} />
            <Route path="/gestionareas" element={<Areas />} />
            <Route path="*" element={<Navigate to="/Inicio" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // === Si todo falla, forzar logout ===
  console.warn("⚠️ Rol no reconocido, cerrando sesión.");
  void supabase.auth.signOut();
  return <Navigate to="/" replace />;
}