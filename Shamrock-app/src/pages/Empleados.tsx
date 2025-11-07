import { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";
import "./Empleados.css";

export default function Usuarios() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // 🔹 Cargar lista de empleados
  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const { data, error } = await supabase
          .from("empleados")
          .select(`
            id,
            nombre,
            email,
            activo,
            fecha_ingreso,
            areas:area_id(nombre),
            puestos:puesto_id(nombre)
          `)
          .order("nombre", { ascending: true });

        if (error) throw error;
        setEmpleados(data || []);
      } catch (err: any) {
        console.error("💥 Error al cargar empleados:", err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarEmpleados();
  }, []);

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h2>Gestión de Recompensa</h2>
      </div>

      {cargando ? (
        <p className="cargando">Cargando empleados...</p>
      ) : empleados.length === 0 ? (
        <p>No hay recompensas registradas.</p>
      ) : (
        <table className="tabla-empleados">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Área</th>
              <th>Puesto</th>
              <th>Fecha ingreso</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((e) => (
              <tr key={e.id}>
                <td>{e.nombre}</td>
                <td>{e.email}</td>
                <td>{e.areas?.nombre || "—"}</td>
                <td>{e.puestos?.nombre || "—"}</td>
                <td>{new Date(e.fecha_ingreso).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`estado ${e.activo ? "activo" : "inactivo"}`}
                  >
                    {e.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}