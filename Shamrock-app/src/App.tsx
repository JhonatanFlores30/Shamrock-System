import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { FaHome, FaUsers, FaChartBar, FaCog , FaSignOutAlt} from "react-icons/fa";
import "./App.css";

function Inicio() {
  return <h2>Bienvenido al sistema Shamrock Supply Company</h2>;
}

function Usuarios() {
  return <h2>Gestión de Usuarios</h2>;
}

function Reportes() {
  return <h2>Reportes y Análisis</h2>;
}

function Configuracion() {
  return <h2>Configuración del Sistema</h2>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Login simulado
    if (usuario === "admin" && password === "1234") {
      onLogin();
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Sistema Shamrock</h1>
        <form onSubmit={handleSubmit}>
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
          <button type="submit">Ingresar</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="hint">Usuario: admin | Contraseña: 1234</p>
      </div>
    </div>
  );
}

function App() {
  const [logueado, setLogueado] = useState(false);

  if (!logueado) {
    return <Login onLogin={() => setLogueado(true)} />;
  }

  return (
    <Router>
      <div className="app-container">
        {/* Barra lateral */}
        <aside className="sidebar">
          <h1 className="logo">Shamrock</h1>
          <nav className="menu">
            <Link to="/" className="menu-item">
              <FaHome /> <span>Inicio</span>
            </Link>
            <Link to="/usuarios" className="menu-item">
              <FaUsers /> <span>Usuarios</span>
            </Link>
            <Link to="/reportes" className="menu-item">
              <FaChartBar /> <span>Reportes</span>
            </Link>
            <Link to="/configuracion" className="menu-item">
              <FaCog /> <span>Configuración</span>
            </Link>
          </nav>
          {/* Botón de cerrar sesión */}
          <button className="logout-btn" onClick={() => setLogueado(false)}>
            <FaSignOutAlt /> <span>Cerrar sesión</span>
          </button>
        </aside>

        <main className="contenido">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
