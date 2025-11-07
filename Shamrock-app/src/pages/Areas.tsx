import { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";
import "./Areas.css";

export default function Areas() {
  const [areas, setAreas] = useState<
    { id: string; nombre: string; descripcion: string | null; total_empleados: number }[]
  >([]);
  const [nuevaArea, setNuevaArea] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Estado para editar
  const [editando, setEditando] = useState<null | {
    id: string;
    nombre: string;
    descripcion: string | null;
  }>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [descripcionEditada, setDescripcionEditada] = useState("");

  // 🔹 Cargar áreas con conteo
  useEffect(() => {
    const obtenerAreas = async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from("areas_con_conteo") // usamos la vista
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("💥 Error al obtener áreas:", error.message);
        setMensaje("❌ No se pudieron cargar las áreas.");
      } else {
        setAreas(data || []);
      }
      setCargando(false);
    };

    obtenerAreas();
  }, []);

  // 🔍 Filtrado dinámico
  const areasFiltradas = areas.filter(
    (a) =>
      a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // 🔹 Agregar nueva área
  const agregarArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaArea.trim()) return;
    setMensaje("");
    setCargando(true);

    try {
      const { error } = await supabase
        .from("areas")
        .insert([{ nombre: nuevaArea.trim(), descripcion: descripcion || null }]);

      if (error) throw error;

      setMensaje("✅ Área registrada correctamente.");
      setNuevaArea("");
      setDescripcion("");

      // recargar lista
      const { data: nuevaLista } = await supabase.from("areas_con_conteo").select("*");
      setAreas(nuevaLista || []);
    } catch (err: any) {
      setMensaje("❌ No se pudo registrar el área: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  // 🔹 Editar área
  const abrirModalEditar = (area: { id: string; nombre: string; descripcion: string | null }) => {
    setEditando(area);
    setNombreEditado(area.nombre);
    setDescripcionEditada(area.descripcion || "");
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    try {
      const { error } = await supabase
        .from("areas")
        .update({ nombre: nombreEditado.trim(), descripcion: descripcionEditada || null })
        .eq("id", editando.id);

      if (error) throw error;

      setMensaje("✏️ Área actualizada correctamente.");
      cerrarModal();

      const { data: nuevaLista } = await supabase.from("areas_con_conteo").select("*");
      setAreas(nuevaLista || []);
    } catch (err: any) {
      setMensaje("❌ No se pudo editar el área: " + err.message);
    }
  };

  const cerrarModal = () => {
    setEditando(null);
    setNombreEditado("");
    setDescripcionEditada("");
  };

  const eliminarArea = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta área?")) return;
    try {
      const { error } = await supabase.from("areas").delete().eq("id", id);
      if (error) throw error;

      setMensaje("🗑️ Área eliminada correctamente.");
      const { data: nuevaLista } = await supabase.from("areas_con_conteo").select("*");
      setAreas(nuevaLista || []);
    } catch (err: any) {
      setMensaje("❌ No se pudo eliminar el área: " + err.message);
    }
  };

  return (
    <div className="areas-wrapper">
      <div className="areas-card-horizontal">
        <h2 className="areas-title">Gestión de Áreas</h2>

        <div className="areas-horizontal-layout">
          {/* 📋 Formulario */}
          <div className="areas-form-section">
            <h3 className="section-title">Agregar nueva área</h3>
            <form onSubmit={agregarArea} className="areas-form">
              <input
                type="text"
                placeholder="Nombre del área"
                value={nuevaArea}
                onChange={(e) => setNuevaArea(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <button type="submit" disabled={cargando}>
                {cargando ? "Guardando..." : "Agregar Área"}
              </button>
            </form>
          </div>

          {/* 📜 Lista con buscador */}
          <div className="areas-list-section">
            <h3 className="section-title">Áreas registradas</h3>

            <input
              type="text"
              className="areas-search"
              placeholder="Buscar área..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            {mensaje && <p className="areas-msg">{mensaje}</p>}

            {cargando && areas.length === 0 ? (
              <p>Cargando áreas...</p>
            ) : areasFiltradas.length === 0 ? (
              <p>No se encontraron áreas.</p>
            ) : (
              <ul className="areas-list">
                {areasFiltradas.map((a) => (
                  <li key={a.id} className="area-item">
                    <div>
                      <h4>{a.nombre}</h4>
                      {a.descripcion && <p>{a.descripcion}</p>}
                      <p className="area-count">
                        👥 {a.total_empleados} empleado{a.total_empleados === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="area-buttons">
                      <button
                        className="edit"
                        style={{ backgroundColor: "#1e88e5" }}
                        onClick={() => abrirModalEditar(a)}
                      >
                        Editar
                      </button>
                      <button
                        className="delete"
                        style={{ backgroundColor: "#e53935" }}
                        onClick={() => eliminarArea(a.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 🪟 Modal */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Editar área</h3>
            <input
              type="text"
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
              placeholder="Nuevo nombre"
            />
            <textarea
              value={descripcionEditada}
              onChange={(e) => setDescripcionEditada(e.target.value)}
              placeholder="Nueva descripción"
            />
            <div className="modal-actions">
              <button onClick={guardarEdicion}>Guardar cambios</button>
              <button onClick={cerrarModal} className="cancel">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}