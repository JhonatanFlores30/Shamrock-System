import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 
import supabase from "../utils/supabaseClient";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setLoading(true);

    console.log("🚀 Intentando iniciar sesión con:", usuario);

    try {
      // 1️⃣ Llamada a Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario.trim(),
        password,
      });

      console.log("📩 Respuesta de Supabase:", { data, error });

      if (error) {
        setError("❌ Usuario o contraseña incorrectos");
        console.error(error.message);
        setLoading(false);
        return;
      }

      // 2️⃣ Aquí agregas este bloque ↓↓↓
      //    Esto garantiza que Supabase ya guardó la sesión
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setMensaje("✅ Inicio de sesión exitoso");
        console.log("🎟 Sesión creada correctamente:", sessionData.session);

        // 🔥 Redirige al App principal (App.tsx detectará el rol y te enviará al lugar correcto)
        setTimeout(() => navigate("/"), 0);
      } else {
        console.warn("⚠️ No se detectó sesión activa aún");
      }
      // 2️⃣↑↑↑ Este bloque debe ir justo aquí, después de signInWithPassword

      setLoading(false);
    } catch (err) {
      console.error("💥 Error inesperado:", err);
      setError("Error al conectar con el servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box shadow-float">
        <img src="/sham.jpg" alt="Logo Shamrock" className="sidebar-logo2" />
        <h1 className="login-title">Bienvenido</h1>
        <p className="login-subtitle">Sistema Shamrock Supply Company</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-ingresar" disabled={loading}>
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </form>

        {mensaje && <p className="mensaje-exito">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}