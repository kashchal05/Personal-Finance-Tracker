import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import "./App.css";

function App() {
  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💰</div>
          <div>
            <div className="logo-text">Fintrack</div>
            <div className="logo-sub">Personal Finance</div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Overview</div>
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <div className="nav-label" style={{ marginTop: 16 }}>Money</div>
          <NavLink to="/transactions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">↕️</span> Transactions
          </NavLink>
          <NavLink to="/budgets" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">🎯</span> Budgets
          </NavLink>
        </div>
        <div className="sidebar-footer">SQLite · FastAPI · React</div>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
