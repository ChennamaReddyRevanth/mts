import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAdmin, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const adminLinks = [
    { to: "/dashboard",    label: "Dashboard",   icon: "📊" },
    { to: "/all-tickets",  label: "All Tickets",  icon: "🎫" },
    { to: "/rules",        label: "Rules",        icon: "⚙️"  },
    { to: "/submit-ticket",label: "New Ticket",   icon: "➕"  },
  ];

  const publicLinks = [
    { to: "/submit-ticket", label: "Submit Ticket", icon: "➕"  },
    { to: "/my-tickets",    label: "My Tickets",    icon: "📋" },
  ];

  const links = isLoggedIn && isAdmin ? adminLinks : publicLinks;

  return (
    <nav className="navbar">
      <NavLink to={isLoggedIn ? "/dashboard" : "/login"} className="navbar-brand">
        🎫 <span>Enterprise Ticket Router</span>{" "}
        <span className="brand-badge">MCP</span>
      </NavLink>

      <div className="navbar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            {l.icon} {l.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-right">
        {isLoggedIn ? (
          <>
            <div className="user-chip">
              <div className="avatar">{user.name?.[0]?.toUpperCase() || "U"}</div>
              <span>{user.name}</span>
              <span className="text-sm" style={{ color: "var(--primary)" }}>{user.role}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" className="btn btn-primary btn-sm">Admin Login</NavLink>
        )}
      </div>
    </nav>
  );
}
