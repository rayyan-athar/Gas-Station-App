import React from "react";

const navItems = [
  { name: "Products", id: "products" },
  { name: "Associates", id: "associates" },
  { name: "Stations", id: "stations" },
];

export default function SidebarNav({ currentPage, onNavigate }) {
  return (
    <nav style={{
      width: "240px",
      background: "white",
      color: "#111827",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      padding: "1rem",
      minHeight: "100vh",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      borderRight: "1px solid #e5e7eb",
    }}>
      <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.75rem", color: "#6b7280" }}>Gas Station Manager</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
        {navItems.map(item => {
          const isActive = currentPage === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                style={{
                  width: "100%",
                  display: "block",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  background: isActive ? "#f3f4f6" : "transparent",
                  color: "#111827",
                  border: "1px solid #e5e7eb",
                  textDecoration: "none",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                {item.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
