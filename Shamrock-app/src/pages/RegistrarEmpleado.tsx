import { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";
import "./RegistrarEmpleado.css";

export default function RegistrarEmpleado() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "usuario">("usuario");
  const [areaId, setAreaId] = useState("");
  const [areas, setAreas] = useState<{ id: string; nombre: string }[]>([]);
  const [puestoId, setPuestoId] = useState("");
  const [puestos, setPuestos] = useState<{ id: string; nombre: string }[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // 🔹 Cargar áreas
  useEffect(() => {
    const cargarAreas = async () => {
      try {
        const { data, error } = await supabase
          .from("areas")
          .select("id, nombre")
          .order("nombre");
        if (error) throw error;
        setAreas(data || []);
      } catch (err: any) {
        console.error("💥 Error cargando áreas:", err.message);
        setMensaje("❌ No se pudieron cargar las áreas.");
      }
    };
    cargarAreas();
  }, []);

  // 🔹 Cargar puestos según área seleccionada
  useEffect(() => {
    const cargarPuestos = async () => {
      if (!areaId) {
        setPuestos([]);
        setPuestoId("");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("puestos")
          .select("id, nombre")
          .eq("area_id", areaId)
          .order("nombre");
        if (error) throw error;
        setPuestos(data || []);
        setPuestoId("");
      } catch (err: any) {
        console.error("💥 Error cargando puestos:", err.message);
        setMensaje("❌ No se pudieron cargar los puestos de esta área.");
      }
    };
    cargarPuestos();
  }, [areaId]);

  // 🔹 Registrar empleado
  const registrarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setCargando(true);

    try {
      // ✅ Crear usuario con signUp (permite usar desde frontend)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      });
      if (signUpError) throw signUpError;

      const nuevoId = signUpData.user?.id;
      if (!nuevoId) throw new Error("No se obtuvo el ID del usuario creado.");

      // ✅ Insertar en empleados
      const { data: empleadoData, error: empleadoError } = await supabase
        .from("empleados")
        .insert([
          {
            auth_user_id: nuevoId,
            email,
            nombre,
            area_id: areaId,
            puesto_id: puestoId || null,
            activo: true,
            fecha_ingreso: new Date().toISOString().split("T")[0],
          },
        ])
        .select("id")
        .single();
      if (empleadoError) throw empleadoError;

      // ✅ Insertar rol
      const { error: rolError } = await supabase.from("roles_app").insert([
        { empleado_id: empleadoData.id, rol },
      ]);
      if (rolError) throw rolError;

      setMensaje("✅ Empleado registrado correctamente.");
      setNombre("");
      setEmail("");
      setPassword("");
      setAreaId("");
      setPuestoId("");
      setRol("usuario");
      setPuestos([]);
    } catch (err: any) {
      console.error("💥 Error al registrar empleado:", err.message);
      setMensaje("❌ Error al registrar empleado: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h2 className="registro-title">Gestión de Empleados</h2>

        <form onSubmit={registrarEmpleado} className="registro-form-horizontal">
          <div className="form-grid">
            <div className="columna">
              <input
                type="text"
                placeholder="Nombre del empleado"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Correo del empleado"
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
            </div>

            <div className="columna">
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                required
              >
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
                disabled={!puestos.length}
                required
              >
                <option value="">
                  {puestos.length
                    ? "Selecciona un puesto"
                    : "Primero selecciona un área"}
                </option>
                {puestos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as "admin" | "usuario")}
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>

              <button type="submit" disabled={cargando}>
                {cargando ? "Registrando..." : "Registrar empleado"}
              </button>
            </div>
          </div>
        </form>

        {mensaje && <p className="registro-msg">{mensaje}</p>}
      </div>
    </div>
  );
}