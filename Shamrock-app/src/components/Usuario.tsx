import { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";
import "./Usuarios.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type Empleado = {
  id: string;         
  nombre: string;
  email: string;
  area?: string;
  puesto?: string;
  puntos?: number;
};

type PerfilStats = {
  balanceActual: number;
  puntosGanados: number;
  puntosGastados: number;
  canjes: number;
  rachaActual: number;
  rachaMaxima: number;
  nivel: "Bronce" | "Plata" | "Oro" | "Diamante";
  progresoNivel: number;
  logros: string[];
};

type UsuarioProps = {
  user: string;
  onLogout: () => Promise<void>;
};

export default function Usuario({ user, onLogout }: UsuarioProps) {
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [seleccion, setSeleccion] = useState("perfil");
  const [loading, setLoading] = useState(true);
  const [historialCanjes, setHistorialCanjes] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  const [perfilStats, setPerfilStats] = useState<PerfilStats | null>(null);
  const [modalCanje, setModalCanje] = useState(false);
  const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<any>(null);

  const abrirModalCanje = (recompensa: any) => {
  setRecompensaSeleccionada(recompensa);
  setModalCanje(true);
  };
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [verPass1, setVerPass1] = useState(false);
  const [verPass2, setVerPass2] = useState(false);
  const [errorPass, setErrorPass] = useState("");

  const [toast, setToast] = useState("");

  const canjearRecompensa = async (recompensaId: string) => {
    if (!empleado?.id) return;

    const { data, error } = await supabase.rpc("realizar_canje", {
      p_empleado_id: empleado.id,
      p_recompensa_id: recompensaId,
    });

    if (error) {
      console.error("Error:", error);
      setToast("Error al canjear ❌");
      return;
    }

    if (data !== "OK") {
      setToast(data);
      return;
    }

    setToast("¡Canje realizado correctamente! 🎁");

    setTimeout(() => window.location.reload(), 1200);
  };

  const confirmarCanje = async () => {
    if (!empleado?.id || !recompensaSeleccionada) return;

    const { data, error } = await supabase.rpc("realizar_canje", {
      p_empleado_id: empleado.id,
      p_recompensa_id: recompensaSeleccionada.id,
    });

    if (error) {
      console.error(error);
      setToast("Error al procesar canje ❌");
      setModalCanje(false);
      return;
    }

    if (data !== "OK") {
      setToast(data); // Ej: Sin stock, puntos insuficientes
      setModalCanje(false);
      return;
    }

    setToast("¡Canje realizado correctamente! 🎁");
    setModalCanje(false);

    // O refrescas sólo los stats, pero por ahora hacemos reload simple:
    setTimeout(() => window.location.reload(), 1200);
  };

  const calcularNivel = (balance: number) => {
    if (balance >= 600) return { nivel: "Diamante", min: 600, max: 1000 };
    if (balance >= 300) return { nivel: "Oro", min: 300, max: 600 };
    if (balance >= 100) return { nivel: "Plata", min: 100, max: 300 };
    return { nivel: "Bronce", min: 0, max: 100 };
  };

  const calcularProgresoNivel = (balance: number) => {
    const { min, max } = calcularNivel(balance);
    return Math.min(100, Math.max(0, ((balance - min) / (max - min)) * 100));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSessionUser(data.user);
    });
  }, []);


  useEffect(() => {
      const cargarHistorial = async () => {
        try {
          const { data, error } = await supabase
            .from("recompensas_canjes")
            .select(`
              id,
              puntos_usados,
              estado,
              solicitado_en,
              recompensas (
                titulo,
                imagen_url
              )
            `)
            .eq("empleado_id", empleado?.id)
            .order("solicitado_en", { ascending: false });

          if (error) throw error;

          setHistorialCanjes(data || []);
        } catch (err: any) {
          console.error("Error cargando historial:", err.message);
        } finally {
          setLoadingHistorial(false);
        }
      };

      if (empleado?.id) cargarHistorial();
    }, [empleado]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Info del empleado
        const { data: empData } = await supabase.rpc(
          "get_empleado_con_detalles",
          { email_param: user }
        );

        if (empData?.length > 0) setEmpleado(empData[0]);

        const { data: recompensasData } = await supabase
          .from("recompensas")
          .select("*")
          .eq("activo", true);

        setRecompensas(recompensasData || []);

        const { data: empRow } = await supabase
          .from("empleados")
          .select("id")
          .eq("email", user)
          .single();

        if (!empRow) return;

        const empleadoId = empRow.id;

        const { data: eventos } = await supabase
          .from("puntos_eventos")
          .select("puntos, origen, registrado_en")
          .eq("empleado_id", empleadoId)
          .order("registrado_en", { ascending: true });

        const { data: asistencias } = await supabase
          .from("asistencias")
          .select("fecha, presente")
          .eq("empleado_id", empleadoId)
          .order("fecha", { ascending: true });

        let balance = 0;
        let ganados = 0;
        let gastados = 0;
        let canjes = 0;

        (eventos || []).forEach((ev) => {
          balance += ev.puntos;
          if (ev.puntos > 0) ganados += ev.puntos;
          if (ev.puntos < 0) gastados += Math.abs(ev.puntos);
          if (ev.origen === "canje") canjes++;
        });

        let rachaActual = 0;
        let rachaMaxima = 0;

        if (asistencias?.length) {
          const asist = asistencias
            .filter((a) => a.presente)
            .map((a) => new Date(a.fecha));

          let racha = 1;

          for (let i = 1; i < asist.length; i++) {
            const diff =
              (asist[i].getTime() - asist[i - 1].getTime()) /
              (1000 * 60 * 60 * 24);

            if (diff === 1) racha++;
            else racha = 1;

            rachaMaxima = Math.max(rachaMaxima, racha);
          }

          rachaActual = racha;
        }

        const lvl = calcularNivel(balance);

        const logros: string[] = [];
        if (ganados >= 100) logros.push("100+ puntos ganados");
        if (ganados >= 300) logros.push("300+ puntos ganados");
        if (canjes >= 1) logros.push("Primer canje realizado");
        if (rachaMaxima >= 5) logros.push("Racha de 5 días");
        if (lvl.nivel === "Oro") logros.push("Nivel Oro alcanzado");

        setPerfilStats({
          balanceActual: balance,
          puntosGanados: ganados,
          puntosGastados: gastados,
          canjes,
          rachaActual,
          rachaMaxima,
          nivel: lvl.nivel,
          progresoNivel: calcularProgresoNivel(balance),
          logros,
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user]);


  const uploadFotoPerfil = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `${sessionUser.id}_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("empleados_fotos")
      .upload(fileName, file, { upsert: true });

    if (error) return console.error(error);

    const publicURL = supabase.storage
      .from("empleados_fotos")
      .getPublicUrl(fileName).data.publicUrl;

    await supabase.auth.updateUser({
      data: { avatar: publicURL },
    });

    setSessionUser({
      ...sessionUser,
      user_metadata: { ...sessionUser.user_metadata, avatar: publicURL },
    });

    setToast("Foto actualizada 📸");
    setTimeout(() => setToast(""), 3000);
  };

  const cambiarPassword = async () => {
    setErrorPass("");

    if (password1.length < 6)
      return setErrorPass("Debe tener al menos 6 caracteres.");

    if (password1 !== password2)
      return setErrorPass("Las contraseñas no coinciden.");

    const { error } = await supabase.auth.updateUser({ password: password1 });
    if (error) return setErrorPass("Error al actualizar.");

    setToast("Contraseña actualizada 🔐");
    setTimeout(() => setToast(""), 3000);

    setMostrarCambioPassword(false);
    setPassword1("");
    setPassword2("");
  };

  if (loading) return <div className="loader">Cargando...</div>;

  return (
    <div className="usuario-dashboard">

      {/* =========================== SIDEBAR ============================= */}
      <aside className="usuario-sidebar">
        <div className="usuario-info">
          <h3>{empleado?.nombre}</h3>
          <p>{empleado?.puesto}</p>
          <p className="puntos">⭐ {perfilStats?.balanceActual || 0}</p>
        </div>

        <div className="space-pusher"></div>

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

        <button className="logout-btn" onClick={() => setConfirmarLogout(true)}>
          Cerrar sesión
        </button>
      </aside>

      {/* =========================== CONTENIDO ============================= */}
      <main className="usuario-contenido">

        {/* ======================== PERFIL ============================ */}
        {seleccion === "perfil" && perfilStats && (
          <div className="perfil">

            <h2 className="perfil-titulo-grande">👤 Perfil</h2>

            <div className="perfil-grid-2col">

              {/* ----------------- Columna Izquierda ----------------- */}
              <div className="perfil-col">

                <div className="perfil-card-xl">
                  <div className="perfil-avatar-container">
                    <img
                      src={
                        sessionUser?.user_metadata?.avatar ||
                        "/avatar_default.png"
                      }
                      className="perfil-avatar-img"
                    />

                    <label className="btn-upload-avatar">
                      Cambiar foto
                      <input type="file" accept="image/*" hidden onChange={uploadFotoPerfil} />
                    </label>
                  </div>

                  <h3 className="perfil-nombre-text">{empleado?.nombre}</h3>
                  <p className="perfil-email-text">{empleado?.email}</p>

                  <div className="perfil-info-xl">
                    <div className="perfil-item-xl">
                      <span>Área</span>
                      <strong>{empleado?.area}</strong>
                    </div>
                    <div className="perfil-item-xl">
                      <span>Puesto</span>
                      <strong>{empleado?.puesto}</strong>
                    </div>
                  </div>

                  <button
                    className="btn-password"
                    onClick={() => setMostrarCambioPassword(true)}
                  >
                    Cambiar contraseña 🔑
                  </button>
                </div>
              </div>

              {/* ----------------- Columna Derecha ----------------- */}
              <div className="perfil-col">

                {/* Nivel */}
                <div className="perfil-card-xl">
                  <h3>🏅 Nivel: {perfilStats.nivel}</h3>
                  <div className="barra-progreso">
                    <div
                      className="barra-progreso-fill"
                      style={{ width: `${perfilStats.progresoNivel}%` }}
                    ></div>
                  </div>
                  <p className="progreso-texto">
                    {perfilStats.progresoNivel.toFixed(0)}% al siguiente nivel
                  </p>
                </div>

                {/* Stats */}
                <div className="perfil-card-xl stats-grid">
                  <div className="stat-box">
                    <h4>🟢 Ganados</h4>
                    <p>{perfilStats.puntosGanados}</p>
                  </div>
                  <div className="stat-box">
                    <h4>🔴 Gastados</h4>
                    <p>{perfilStats.puntosGastados}</p>
                  </div>
                  <div className="stat-box">
                    <h4>🎁 Canjes</h4>
                    <p>{perfilStats.canjes}</p>
                  </div>
                </div>

                {/* Rachas */}
                <div className="perfil-card-xl">
                  <h3>🔥 Rachas</h3>
                  <p>Actual: {perfilStats.rachaActual} días</p>
                  <p>Máxima: {perfilStats.rachaMaxima} días</p>
                </div>

                {/* Logros */}
                <div className="perfil-card-xl">
                  <h3>🏆 Logros</h3>
                  {perfilStats.logros.length === 0 ? (
                    <p>Aún sin logros.</p>
                  ) : (
                    <ul className="logros-list">
                      {perfilStats.logros.map((l, i) => (
                        <li key={i} className="logro-item">⭐ {l}</li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ======================== RECOMPENSAS ============================ */}
        {seleccion === "recompensas" && (
          <div className="recompensas">
            <h2>🎁 Recompensas disponibles</h2>

            <div className="recompensas-grid">
              {recompensas.map((r) => (
                <div className="recompensa-card" key={r.id}>
                  <img src={r.imagen_url} alt={r.titulo} />
                  <h3>{r.titulo}</h3>
                  <p>{r.descripcion}</p>
                  <span className="puntos-req">⭐ {r.puntos_costo}</span>
                  <button
                    className="btn-canjear"
                    disabled={(perfilStats.balanceActual || 0) < r.puntos_costo}
                    onClick={() => abrirModalCanje(r)}
                  >
                    Canjear
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================== HISTORIAL ============================ */}
        {seleccion === "historial" && (
          <div className="historial-container">

            <h2 className="historial-titulo">🕓 Historial de Canjes</h2>

            {loadingHistorial ? (
              <p>Cargando historial...</p>
            ) : historialCanjes.length === 0 ? (
              <p>No has realizado ningún canje todavía.</p>
            ) : (
              <div className="historial-grid">
                {historialCanjes.map((item) => (
                  <div className={`historial-card estado-${item.estado}`} key={item.id}>

                    <img
                      src={item.recompensas?.imagen_url || "/gift.png"}
                      className="historial-img"
                      alt="recompensa"
                    />

                    <div className="historial-info">
                      <h3>{item.recompensas?.titulo}</h3>

                      <p className="historial-fecha">
                        📅 {new Date(item.solicitado_en).toLocaleDateString("es-MX")}
                      </p>

                      <p className="historial-puntos">
                        ⭐ {item.puntos_usados} puntos
                      </p>

                      <span className={`estado-tag estado-${item.estado}`}>
                        {item.estado.toUpperCase()}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ======================== MODAL LOGOUT ============================ */}
      {confirmarLogout && (
        <div className="modal-overlay">
          <div className="modal-logout">
            <h3>¿Deseas cerrar sesión?</h3>
            <div className="modal-buttons">
              <button className="btn-confirmar" onClick={onLogout}>Sí</button>
              <button className="btn-cancelar" onClick={() => setConfirmarLogout(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL CONTRASEÑA ============================ */}
      {mostrarCambioPassword && (
        <div className="modal-overlay">
          <div className="modal-password">
            <h3>Cambiar contraseña</h3>

            <div className="input-pass-wrapper">
              <input
                type={verPass1 ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
              />
              <span className="toggle-pass" onClick={() => setVerPass1(!verPass1)}>
                {verPass1 ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="input-pass-wrapper">
              <input
                type={verPass2 ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
              <span className="toggle-pass" onClick={() => setVerPass2(!verPass2)}>
                {verPass2 ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {errorPass && <p className="error-pass">{errorPass}</p>}

            <div className="modal-buttons">
              <button className="btn-confirmar" onClick={cambiarPassword}>
                Guardar
              </button>
              <button className="btn-cancelar" onClick={() => setMostrarCambioPassword(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== TOAST ============================ */}
      {toast && <div className="toast-success">{toast}</div>}

      {modalCanje && recompensaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-canje">
            <h3>Confirmar Canje</h3>

            <img
              src={recompensaSeleccionada.imagen_url}
              alt="recompensa"
              className="modal-canje-img"
            />

            <p className="modal-canje-titulo">{recompensaSeleccionada.titulo}</p>

            <p className="modal-canje-puntos">
              ⭐ {recompensaSeleccionada.puntos_costo} puntos
            </p>

            <p>¿Deseas realizar este canje?</p>

            <div className="modal-buttons">
              <button className="btn-confirmar" onClick={confirmarCanje}>
                Sí, canjear
              </button>

              <button className="btn-cancelar" onClick={() => setModalCanje(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
