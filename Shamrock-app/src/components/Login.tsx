import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onLogin: (user: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUsers = JSON.parse(localStorage.getItem("usuarios") || "[]");

    const user = storedUsers.find(
      (u: { user: string; pass: string }) => u.user === usuario && u.pass === password
    );

    if (user) {
      onLogin(usuario);
    } else {
      setError("Usuario o contraseña incorrectos");
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
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-ingresar">
            Ingresar
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <p className="hint">
          ¿No tienes cuenta?{" "}
          <span className="link" onClick={() => navigate("/registro")}>
            Crear cuenta
          </span>
        </p>
      </div>
    </div>
  );
}