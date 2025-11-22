import { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";
import "./AdminCanjes.css";

export default function AdminCanjes() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarSolicitudes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("recompensas_canjes")
      .select(`
        id,
        puntos_usados,
        estado,
        solicitado_en,
        empleado:empleado_id (
          id,
          nombre,
          email
        ),
        recompensa:recompensa_id (
          titulo,
          imagen_url,
          puntos_costo
        )
      `)
      .order("solicitado_en", { ascending: false });

    if (error) console.error(error);
    else setSolicitudes(data);

    setLoading(false);
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const aprobarCanje = async (id: string) => {
    const { error } = await supabase
      .from("recompensas_canjes")
      .update({
        estado: "aprobado",
        actualizado_en: new Date(),
      })
      .eq("id", id);

    if (!error) cargarSolicitudes();
  };

  const rechazarCanje = async (id: string) => {
    const { error } = await supabase
      .from("recompensas_canjes")
      .update({
        estado: "rechazado",
        actualizado_en: new Date(),
      })
      .eq("id", id);

    if (!error) cargarSolicitudes();
  };

  return (
    <div className="admin-canjes-container">
      <h1>📦 Solicitudes de Canjes</h1>

      {loading ? (
        <p>Cargando solicitudes...</p>
      ) : solicitudes.length === 0 ? (
        <p>No hay solicitudes registradas.</p>
      ) : (
        <div className="canjes-scroll-wrapper">
            <div className="canjes-grid">
            {solicitudes.map((s) => (
                <div className={`canje-card estado-${s.estado}`} key={s.id}>
                
                <img
                    src={s.recompensa?.imagen_url}
                    className="canje-img"
                    alt="recompensa"
                />

                <div className="canje-info">
                    <h3>{s.recompensa?.titulo}</h3>

                    <p>
                    <strong>Empleado:</strong> {s.empleado?.nombre}
                    </p>

                    <p>
                    <strong>Email:</strong> {s.empleado?.email}
                    </p>

                    <p className="canje-fecha">
                    📅 {new Date(s.solicitado_en).toLocaleString("es-MX")}
                    </p>

                    <p className="canje-puntos">
                    ⭐ {s.puntos_usados} puntos usados
                    </p>

                    <span className={`estado-tag estado-${s.estado}`}>
                    {s.estado.toUpperCase()}
                    </span>

                    {s.estado === "pendiente" && (
                    <div className="admin-buttons">
                        <button
                        className="btn-aprobar"
                        onClick={() => aprobarCanje(s.id)}
                        >
                        Aprobar
                        </button>

                        <button
                        className="btn-rechazar"
                        onClick={() => rechazarCanje(s.id)}
                        >
                        Rechazar
                        </button>
                    </div>
                    )}
                </div>

                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
}
