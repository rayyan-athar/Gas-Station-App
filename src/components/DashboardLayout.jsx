import React from "react";

export default function DashboardLayout({ children }) {
  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#f9fafb"
    }}>
      {children}
    </div>
  );
}


