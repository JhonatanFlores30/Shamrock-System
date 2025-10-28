import { Link } from "react-router-dom";
import { FaHome, FaUsers, FaChartBar, FaCog, FaSignOutAlt } from "react-icons/fa";

interface SidebarProps {
  user: string;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
       <img src="/sham.jpg" alt="Logo Shamrock" className="sidebar-logo2" />
      <h1 className="logo">Shamrock</h1>
      <p className="usuario">Hola, {user}</p>

      <nav className="menu">
        <Link to="/" className="menu-item">
          <FaHome /> <span>Inicio</span>
        </Link>
        <Link to="/empleado" className="menu-item">
          <FaUsers /> <span>Empleados</span>
        </Link>
      </nav>

      <button className="logout-btn" onClick={onLogout}>
        <FaSignOutAlt /> <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}