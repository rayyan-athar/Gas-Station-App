import { useState } from "react";
import Products from "./pages/Products";
import Associates from "./pages/Associates";
import Stations from "./pages/Stations";
import DashboardLayout from "./components/DashboardLayout";
import SidebarNav from "./components/SidebarNav";
import Login from "./pages/Login";
import { loadToken } from './api';
import './App.css';

export default function App() {
  const [page, setPage] = useState("products");
  const [token, setToken] = useState(() => loadToken());

  if (!token) return <Login onAuth={(t) => setToken(t)} />;

  return (
    <DashboardLayout>
      <SidebarNav currentPage={page} onNavigate={setPage} />
      <main style={{ flex: 1, padding: "1.5rem", background: "#f9fafb", minHeight: "100vh" }}>
        {page === "products" && <Products />}
        {page === "associates" && <Associates />}
        {page === "stations" && <Stations />}
      </main>
    </DashboardLayout>
  );
}
