import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Registro from "./components/Registro";
import Sidebar from "./components/Sidebar";
import Inicio from "./pages/Inicio";
import Usuarios from "./pages/Empleados";
import "./App.css";

function App() {
  const [logueado, setLogueado] = useState(false);
  const [usuario, setUsuario] = useState("");

  if (!logueado) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Login onLogin={(user) => { setUsuario(user); setLogueado(true); }} />} />
          <Route path="/registro" element={<Registro />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar user={usuario} onLogout={() => setLogueado(false)} />
        <main className="contenido">
          <Routes>
            <Route path="/Inicio" element={<Inicio />} />
            <Route path="/empleado" element={<Usuarios />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;