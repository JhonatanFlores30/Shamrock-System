import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Registro() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario || !password) {
      setMensaje("Completa todos los campos");
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem("usuarios") || "[]");

    if (storedUsers.find((u: { user: string }) => u.user === usuario)) {
      setMensaje("El usuario ya existe");
      return;
    }

    storedUsers.push({ user: usuario, pass: password });
    localStorage.setItem("usuarios", JSON.stringify(storedUsers));

    setMensaje("Cuenta creada exitosamente ✅");
    setTimeout(() => navigate("/"), 1500);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Crear cuenta</h1>
        <form onSubmit={handleRegister}>
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
          <button type="submit">Registrar</button>
        </form>
        {mensaje && <p className="success">{mensaje}</p>}
        <p className="hint">
          ¿Ya tienes cuenta?{" "}
          <span className="link" onClick={() => navigate("/")}>
            Iniciar sesión
          </span>
        </p>
      </div>
    </div>
  );
}