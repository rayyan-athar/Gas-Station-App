export default function NavBar({ currentPage, onNavigate, onLogout }) {
  return (
    <header style={{
      width: "100%",
      background: "white",
      color: "#111827",
      borderBottom: "1px solid #e5e7eb",
      padding: "0.75rem 1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#6b7280" }}>Gas Station Manager</div>
      <nav style={{ display: "flex", gap: "0.5rem" }}>
        {[
          { id: "products", label: "Products" },
          { id: "associates", label: "Associates" },
          { id: "stations", label: "Stations" },
        ].map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: 500,
                background: isActive ? "#f3f4f6" : "transparent",
                border: "1px solid #e5e7eb",
                color: "#111827",
              }}
            >
              {item.label}
            </button>
          );
        })}
        {onLogout && (
          <button onClick={onLogout} style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 500, background: "#ef4444", color: "white", border: "none" }}>Logout</button>
        )}
      </nav>
    </header>
  );
}
  