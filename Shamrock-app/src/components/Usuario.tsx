import { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";
import "./Usuarios.css";

type Empleado = {
  nombre: string;
  email: string;
  area?: string;
  puesto?: string;
};

export default function Usuario({ user, onLogout }: { user: string; onLogout: () => Promise<void> }) {
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [seleccion, setSeleccion] = useState("perfil");
  const [loading, setLoading] = useState(true);

  // 🔹 Obtener datos de sesión activa
  useEffect(() => {
    const cargarSesion = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error obteniendo sesión:", error.message);
      else setSessionUser(data.user);
    };
    cargarSesion();
  }, []);

  // Cargar datos del empleado con área y puesto
useEffect(() => {
  const cargarDatos = async () => {
    try {
      // Obtenemos empleado + área + puesto
      const { data: empData, error: empError } = await supabase
        .rpc("get_empleado_con_detalles", { email_param: user });

      if (empError) throw empError;
      if (empData && empData.length > 0) setEmpleado(empData[0]);

      // Recompensas disponibles
      const { data: recompensasData, error: recompensasError } = await supabase
        .from("recompensas")
        .select("*")
        .eq("activo", true)
        .order("puntos_requeridos", { ascending: true });

      if (recompensasError) throw recompensasError;
      setRecompensas(recompensasData || []);
    } catch (err: any) {
      console.error("Error cargando datos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  cargarDatos();
}, [user]);

  if (loading) return <div className="loader">Cargando datos...</div>;

  return (
    <div className="usuario-dashboard">
      {/* === SIDEBAR === */}
      <aside className="usuario-sidebar">
        <div className="usuario-info">
          <h3>{empleado?.nombre || sessionUser?.user_metadata?.nombre || "Usuario"}</h3>
          <p>{empleado?.puesto || "Sin puesto"}</p>
          <p className="puntos">⭐ {empleado?.puntos || 0} puntos</p>
        </div>

        <nav className="usuario-menu">
          <button
            className={seleccion === "perfil" ? "activo" : ""}
            onClick={() => setSeleccion("perfil")}
          >
            👤 Perfil
          </button>
          <button
            className={seleccion === "recompensas" ? "activo" : ""}
            onClick={() => setSeleccion("recompensas")}
          >
            🎁 Recompensas
          </button>
          <button
            className={seleccion === "historial" ? "activo" : ""}
            onClick={() => setSeleccion("historial")}
          >
            🕓 Historial
          </button>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
        Cerrar sesión
        </button>
      </aside>

      {/* === CONTENIDO PRINCIPAL === */}
      <main className="usuario-contenido">
        {seleccion === "perfil" && (
          <div className="perfil">
            <h2>👤 Mi perfil</h2>
            <div className="perfil-card">
              <p><strong>Nombre:</strong> {empleado?.nombre || sessionUser?.user_metadata?.nombre}</p>
              <p><strong>Email:</strong> {empleado?.email || sessionUser?.email}</p>
              <p><strong>Área:</strong> {empleado?.area || "—"}</p>
              <p><strong>Puesto:</strong> {empleado?.puesto || "—"}</p>
              <p><strong>Puntos actuales:</strong> ⭐ {empleado?.puntos || 0}</p>
            </div>
          </div>
        )}

        {seleccion === "recompensas" && (
          <div className="recompensas">
            <h2>🎁 Recompensas disponibles</h2>
            {recompensas.length === 0 ? (
              <p>No hay recompensas registradas.</p>
            ) : (
              <div className="recompensas-grid">
                {recompensas.map((r) => (
                  <div className="recompensa-card" key={r.id}>
                    <img src={r.imagen_url || "/gift.png"} alt={r.nombre} />
                    <h3>{r.nombre}</h3>
                    <p>{r.descripcion}</p>
                    <span className="puntos-req">⭐ {r.puntos_requeridos} pts</span>
                    <button
                      disabled={(empleado?.puntos || 0) < r.puntos_requeridos}
                      className="btn-canjear"
                    >
                      Canjear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {seleccion === "historial" && (
          <div className="historial">
            <h2>🕓 Historial de canjes</h2>
            <p>Próximamente...</p>
          </div>
        )}
      </main>
    </div>
  );
}