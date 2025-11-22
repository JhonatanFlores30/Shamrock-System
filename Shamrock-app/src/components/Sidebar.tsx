import { useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaUsers, FaChartBar, FaCog, FaSignOutAlt } from "react-icons/fa";

interface SidebarProps {
  user: string;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <>
      <aside className="sidebar">
        <img src="/sham.jpg" alt="Logo Shamrock" className="sidebar-logo2" />
        <h1 className="logo">Shamrock</h1>
        <p className="usuario">Hola, {user}</p>

        <div className="space-pusher"></div>
        <nav className="menu">
          <Link to="/" className="menu-item">
            <FaHome /> <span>Inicio</span>
          </Link>
          <Link to="/recompensas" className="menu-item">
            <FaUsers /> <span>Gestión de Recompensas</span>
          </Link>
          <Link to="/registrar" className="menu-item">
            <FaUsers /> <span>Gestión Empleados</span>
          </Link>
          <Link to="/gestionareas" className="menu-item">
            <FaUsers /> <span>Gestión de Áreas</span>
          </Link>
          <Link to="/solicitudesrecompensas" className="menu-item">
            <FaUsers /> <span>Solicitudes de Canjes</span>
          </Link>
        </nav>

        <button
          className="logout-btn"
          onClick={() => setConfirmLogout(true)}
        >
          <FaSignOutAlt /> <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* ===== Modal de Confirmación ===== */}
      {confirmLogout && (
        <div className="modal-overlay logout-modal-overlay">
          <div className="modal logout-modal">
            <h3>¿Deseas cerrar sesión?</h3>
            <p>Tu sesión actual se cerrará.</p>

            <div className="modal-buttons logout-buttons">
              <button
                className="confirm-btn"
                onClick={() => {
                  setConfirmLogout(false);
                  onLogout();
                }}
              >
                Sí, cerrar sesión
              </button>

              <button
                className="cancel-btn"
                onClick={() => setConfirmLogout(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
