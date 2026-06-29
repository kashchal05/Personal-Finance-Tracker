import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { getDashboard } from "../api";
import { format } from "date-fns";

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4"];
const CAT_ICONS = {
  Food: "🍔", Housing: "🏠", Transport: "🚗", Entertainment: "🎬",
  Healthcare: "🏥", Shopping: "🛍️", Utilities: "⚡", Salary: "💼",
  Freelance: "💻", Investment: "📈", Other: "📦",
};

const today = new Date();

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      {label && <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: ${Number(p.value).toFixed(2)}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getDashboard({ month, year })
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [month, year]);

  const pieData = data ? Object.entries(data.spending_by_category).map(([name, value]) => ({ name, value })) : [];

  return (
    <div>
      {error && <div className="error-banner">⚠️ {error} — make sure the backend is running.</div>}

      {loading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading…</span></div>
      ) : data && (
        <>
          {/* ── Hero: Total Balance (bank-style) ── */}
          <div className="balance-hero">
            <div className="balance-label">Total Balance</div>
            <div className={`balance-amount${data.all_time_net < 0 ? " negative" : ""}`}>
              {data.all_time_net >= 0 ? "" : "−"}${Math.abs(data.all_time_net).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="balance-sub">
              <span className="bal-income">↑ ${data.all_time_income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} earned</span>
              <span className="bal-divider">·</span>
              <span className="bal-expense">↓ ${data.all_time_expenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent</span>
              <span className="bal-divider">·</span>
              <span className="bal-count">{data.all_time_tx_count} transactions</span>
            </div>
          </div>

          {/* ── Quick stats row ── */}
          <div className="stat-grid" style={{ marginTop: 20 }}>
            <div className="stat-card income">
              <div className="stat-icon">↑</div>
              <div className="stat-label">{format(new Date(year, month - 1, 1), "MMM yyyy")} Income</div>
              <div className="stat-value">${data.total_income.toFixed(2)}</div>
            </div>
            <div className="stat-card expense">
              <div className="stat-icon">↓</div>
              <div className="stat-label">{format(new Date(year, month - 1, 1), "MMM yyyy")} Expenses</div>
              <div className="stat-value">${data.total_expenses.toFixed(2)}</div>
            </div>
            <div className="stat-card net">
              <div className="stat-icon">{data.net >= 0 ? "▲" : "▼"}</div>
              <div className="stat-label">{format(new Date(year, month - 1, 1), "MMM yyyy")} Net</div>
              <div className={`stat-value${data.net < 0 ? " negative" : ""}`}>
                {data.net >= 0 ? "+" : ""}${data.net.toFixed(2)}
              </div>
            </div>
          </div>

          {/* ── Period selector (secondary) ── */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "20px 0 14px" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Period:</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: "auto" }}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), "MMMM")}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: "auto" }}>
              {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>

          {/* ── Charts ── */}
          <div className="charts-grid">
            <div className="card">
              <div className="card-title">Balance Trend — 6 Months</div>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={data.monthly_trend.map((m) => ({ ...m, net: m.income - m.expenses }))}>
                  <defs>
                    <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="net" stroke="#4f46e5" strokeWidth={2.5} fill="url(#gradNet)" name="Net" dot={{ r: 3, fill: "#4f46e5" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-title">Spending by Category</div>
              {pieData.length === 0 ? (
                <div style={{ color: "#94a3b8", textAlign: "center", padding: "60px 0", fontSize: 13 }}>No expenses this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend formatter={(v) => `${CAT_ICONS[v] || "•"} ${v}`} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-title">Income vs Expenses</div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={data.monthly_trend} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }} />
                <Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── All-time summary ── */}
          {data.top_expense_category && (
            <div style={{ marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
              Top expense category all-time: <strong style={{ color: "#e2e8f0" }}>{CAT_ICONS[data.top_expense_category]} {data.top_expense_category}</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}
