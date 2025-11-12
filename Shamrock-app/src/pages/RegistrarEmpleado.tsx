import { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";
import "./RegistrarEmpleado.css";

export default function GestionEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [areas, setAreas] = useState<{ id: string; nombre: string }[]>([]);
  const [puestos, setPuestos] = useState<{ id: string; nombre: string; area_id: string }[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "usuario">("usuario");
  const [areaId, setAreaId] = useState("");
  const [puestoId, setPuestoId] = useState("");
  const [cargando, setCargando] = useState(false);

  // === Cargar áreas, puestos y empleados ===
  useEffect(() => {
  const cargarEmpleados = async () => {
    // Obtener todos los empleados
    const { data: empleadosRaw, error } = await supabase
      .from("empleados")
      .select("*")
      .order("nombre");

    if (error) {
      console.error("Error cargando empleados:", error.message);
      return;
    }

    // Cargar todas las áreas y puestos
    const { data: dataAreas } = await supabase.from("areas").select("id, nombre");
    const { data: dataPuestos } = await supabase.from("puestos").select("id, nombre");

    // Combinar los datos manualmente
    const empleadosCompletos = empleadosRaw.map((e) => ({
      ...e,
      area: dataAreas?.find((a) => a.id === e.area_id)?.nombre || "—",
      puesto: dataPuestos?.find((p) => p.id === e.puesto_id)?.nombre || "—",
    }));

    setEmpleados(empleadosCompletos);
  };

  cargarEmpleados();
}, []);

  // === Registrar empleado ===
  const registrarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    try {
      // 1️⃣ Crear usuario Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      });
      if (signUpError) throw signUpError;

      const nuevoId = signUpData.user?.id;
      if (!nuevoId) throw new Error("No se obtuvo el ID del usuario creado.");

      // 2️⃣ Insertar empleado
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

      // 3️⃣ Insertar rol
      const { error: rolError } = await supabase
        .from("roles_app")
        .insert([{ empleado_id: empleadoData.id, rol }]);
      if (rolError) throw rolError;

      // 4️⃣ Refrescar lista
      const { data: nuevos } = await supabase
        .from("empleados")
        .select(`
          id, nombre, email, fecha_ingreso, activo, areas(nombre), puestos(nombre)
        `)
        .order("nombre");
      setEmpleados(nuevos || []);

      setMensaje("✅ Empleado agregado correctamente");
      setMostrarModal(false);
      setNombre("");
      setEmail("");
      setPassword("");
      setAreaId("");
      setPuestoId("");
      setRol("usuario");
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

  // === Filtrar puestos según área seleccionada ===
  const puestosFiltrados = puestos.filter((p) => p.area_id === areaId);

  return (
    <div className="empleados-container">
      <div className="empleados-header">
        <h2>👥 Gestión de Empleados</h2>
        <button className="btn-agregar" onClick={() => setMostrarModal(true)}>
          + Agregar empleado
        </button>
      </div>

      {mensaje && <p className="msg">{mensaje}</p>}

      {/* TABLA */}
      <div className="tabla-empleados">
        {empleados.length === 0 ? (
          <p>No hay empleados registrados.</p>
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
              {empleados.map((e) => (
                <tr key={e.id}>
                  <td>{e.nombre}</td>
                  <td>{e.email}</td>
                  <td>{e.area}</td>
                  <td>{e.puesto}</td>
                  <td>{new Date(e.fecha_ingreso).toLocaleDateString()}</td>
                  <td>{e.activo ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button className="btn-delete" onClick={() => eliminarEmpleado(e.id)}>
                      🗑️
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
            <h3>Registrar nuevo empleado</h3>
            <form onSubmit={registrarEmpleado}>
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
              <input
                type="password"
                placeholder="Contraseña temporal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

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
                  {cargando ? "Registrando..." : "Guardar"}
                </button>
                <button type="button" className="cancelar" onClick={() => setMostrarModal(false)}>
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