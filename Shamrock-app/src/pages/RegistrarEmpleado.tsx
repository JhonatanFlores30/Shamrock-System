import { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from "react-icons/fa";
import "./RegistrarEmpleado.css";

export default function GestionEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [areas, setAreas] = useState<{ id: string; nombre: string }[]>([]);
  const [puestos, setPuestos] = useState<{ id: string; nombre: string; area_id: string }[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "usuario">("usuario");
  const [areaId, setAreaId] = useState("");
  const [puestoId, setPuestoId] = useState("");
  const [empleadoIdEditando, setEmpleadoIdEditando] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // === Cargar datos ===
  useEffect(() => {
    const cargarDatos = async () => {
      const { data: empleadosRaw } = await supabase.from("empleados").select("*").order("nombre");
      const { data: dataAreas } = await supabase.from("areas").select("id, nombre");
      const { data: dataPuestos } = await supabase.from("puestos").select("id, nombre, area_id");

      const empleadosCompletos = empleadosRaw?.map((e) => ({
        ...e,
        area: dataAreas?.find((a) => a.id === e.area_id)?.nombre || "—",
        puesto: dataPuestos?.find((p) => p.id === e.puesto_id)?.nombre || "—",
      }));

      setAreas(dataAreas || []);
      setPuestos(dataPuestos || []);
      setEmpleados(empleadosCompletos || []);
    };

    cargarDatos();
  }, []);

  // === Filtrar puestos según el área seleccionada ===
  const puestosFiltrados = puestos.filter((p) => p.area_id === areaId);

  // === Registrar o editar empleado ===
  const guardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    try {
      if (modoEdicion && empleadoIdEditando) {
        // ✏️ Actualizar empleado existente
        const { error } = await supabase
          .from("empleados")
          .update({
            nombre,
            email,
            area_id: areaId,
            puesto_id: puestoId,
          })
          .eq("id", empleadoIdEditando);

        if (error) throw error;

        setMensaje("✏️ Empleado actualizado correctamente.");
      } else {
        // ➕ Registrar nuevo empleado
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre } },
        });
        if (signUpError) throw signUpError;

        const nuevoId = signUpData.user?.id;
        if (!nuevoId) throw new Error("No se obtuvo el ID del usuario creado.");

        const { data: empleadoData, error: empleadoError } = await supabase
          .from("empleados")
          .insert([
            {
              auth_user_id: nuevoId,
              email,
              nombre,
              area_id: areaId,
              puesto_id: puestoId,
              activo: true,
              fecha_ingreso: new Date().toISOString().split("T")[0],
            },
          ])
          .select("id")
          .single();
        if (empleadoError) throw empleadoError;

        const { error: rolError } = await supabase
          .from("roles_app")
          .insert([{ empleado_id: empleadoData.id, rol }]);
        if (rolError) throw rolError;

        setMensaje("✅ Empleado agregado correctamente.");
      }

      // 🔄 Refrescar lista
      const { data: nuevos } = await supabase
        .from("empleados")
        .select("*")
        .order("nombre");
      setEmpleados(nuevos || []);

      cerrarModal();
    } catch (err: any) {
      setMensaje("❌ Error: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  // === Eliminar empleado ===
  const eliminarEmpleado = async (id: string) => {
    if (!confirm("¿Deseas eliminar este empleado?")) return;
    const { error } = await supabase.from("empleados").delete().eq("id", id);
    if (!error) setEmpleados((prev) => prev.filter((e) => e.id !== id));
  };

  // === Abrir modal en modo edición ===
  const abrirModalEdicion = (empleado: any) => {
    setModoEdicion(true);
    setEmpleadoIdEditando(empleado.id);
    setNombre(empleado.nombre);
    setEmail(empleado.email);
    setAreaId(empleado.area_id);
    setPuestoId(empleado.puesto_id);
    setRol("usuario"); // o podrías cargar el rol real desde la tabla roles_app
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setModoEdicion(false);
    setEmpleadoIdEditando(null);
    setNombre("");
    setEmail("");
    setPassword("");
    setAreaId("");
    setPuestoId("");
    setRol("usuario");
  };
    const [busqueda, setBusqueda] = useState("");

    const empleadosFiltrados = empleados.filter((e) =>
      [e.nombre, e.email, e.area, e.puesto]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  return (
    <div className="empleados-container">
    <div className="empleados-header">
      <h2>👥 Gestión de Empleados</h2>
      <div className="acciones-header">
        <input
          type="text"
          placeholder="🔍 Buscar empleado..."
          className="buscador-empleados"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button className="btn-agregar" onClick={() => setMostrarModal(true)}>
          + Agregar empleado
        </button>
      </div>
    </div>

    {mensaje && <p className="msg">{mensaje}</p>}
    
    <div className="tabla-empleados-scroll">
      {empleadosFiltrados.length === 0 ? (
        <p>No se encontraron empleados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Área</th>
              <th>Puesto</th>
              <th>Ingreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosFiltrados.map((e) => (
              <tr key={e.id}>
                <td>{e.nombre}</td>
                <td>{e.email}</td>
                <td>{e.area}</td>
                <td>{e.puesto}</td>
                <td>{new Date(e.fecha_ingreso).toLocaleDateString()}</td>
                <td>{e.activo ? "Activo" : "Inactivo"}</td>
                <td className="acciones">
                  <button className="btn-edit" onClick={() => abrirModalEdicion(e)}>
                    <FaEdit />
                  </button>
                  <button className="btn-delete" onClick={() => eliminarEmpleado(e.id)}>
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

      {/* MODAL FORMULARIO */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{modoEdicion ? "Editar empleado" : "Registrar nuevo empleado"}</h3>
            <form onSubmit={guardarEmpleado}>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {!modoEdicion && (
                <input
                  type="password"
                  placeholder="Contraseña temporal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}

              <select value={areaId} onChange={(e) => setAreaId(e.target.value)} required>
                <option value="">Selecciona un área</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>

              <select
                value={puestoId}
                onChange={(e) => setPuestoId(e.target.value)}
                required
                disabled={!puestosFiltrados.length}
              >
                <option value="">
                  {puestosFiltrados.length ? "Selecciona un puesto" : "Primero elige un área"}
                </option>
                {puestosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              <select value={rol} onChange={(e) => setRol(e.target.value as "admin" | "usuario")}>
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>

              <div className="modal-buttons">
                <button type="submit" disabled={cargando}>
                  {cargando
                    ? "Guardando..."
                    : modoEdicion
                    ? "Guardar cambios"
                    : "Registrar empleado"}
                </button>
                <button type="button" className="btn-delete" onClick={cerrarModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
