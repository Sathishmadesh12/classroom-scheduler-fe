import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  // Build nav items based on role
  const navItems = [
    { icon: "📊", label: "Dashboard", page: "dashboard", roles: ['admin', 'faculty', 'student'] },
    { icon: "👨‍🏫", label: "Faculty", page: "faculty", roles: ['admin'] },
    { icon: "🎓", label: "Students", page: "students", roles: ['admin'] },
    { icon: "🏫", label: "Classrooms", page: "classrooms", roles: ['admin'] },
    { icon: "📚", label: "Subjects", page: "subjects", roles: ['admin', 'faculty'] },
    { icon: "🗓️", label: "Timetable", page: "timetable", roles: ['admin'] },
    { icon: "📅", label: "My Timetable", page: "mytimetable", roles: ['faculty'] },
    { icon: "📅", label: "Faculty Timetables", page: "mytimetable", roles: ['admin'] },
    { icon: "📖", label: "Notes", page: "notes", roles: ['admin', 'faculty', 'student'] },
    { icon: "📋", label: "Attendance", page: "attendance", roles: ['admin', 'faculty'] },
  ].filter(item => item.roles.includes(user?.role));

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>🎓 ClassScheduler</h2>
        <p>Smart Timetable System</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.page + item.label}
            className={`nav-item ${activePage === item.page ? "active" : ""}`}
            onClick={() => setActivePage(item.page)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info" style={{ flex: 1 }}>
            <h4>{user?.name}</h4>
            <p>{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 10,
              color: "red",
            }}
          >
           Logout
          </button>
        </div>
      </div>
    </div>
  );
}
