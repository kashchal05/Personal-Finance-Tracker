import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { getBudgetProgress, createBudget, updateBudget, deleteBudget } from "../api";

const CATEGORIES = ["Food", "Housing", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Salary", "Freelance", "Investment", "Other"];
const CAT_ICONS = {
  Food: "🍔", Housing: "🏠", Transport: "🚗", Entertainment: "🎬",
  Healthcare: "🏥", Shopping: "🛍️", Utilities: "⚡", Salary: "💼",
  Freelance: "💻", Investment: "📈", Other: "📦",
};

const PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "all_time", label: "All-Time (Ongoing)" },
];

const today = new Date();

const barColor = (pct) => {
  if (pct >= 100) return "#f87171";
  if (pct >= 80) return "#fbbf24";
  return "#34d399";
};

export default function Budgets() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ category: "Food", limit_amount: "", period: "monthly" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    getBudgetProgress(month, year)
      .then((r) => { setBudgets(r.data); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, year]);
  useEffect(() => { if (modal) setTimeout(() => firstInputRef.current?.focus(), 80); }, [modal]);

  const openCreate = () => { setForm({ category: "Food", limit_amount: "", period: "monthly" }); setEditingId(null); setModal(true); };
  const openEdit = (b) => { setForm({ category: b.category, limit_amount: String(b.limit_amount), period: b.period }); setEditingId(b.id); setModal(true); };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.limit_amount || isNaN(parseFloat(form.limit_amount))) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateBudget(editingId, { limit_amount: parseFloat(form.limit_amount), period: form.period });
      } else {
        await createBudget({ ...form, limit_amount: parseFloat(form.limit_amount), month, year });
      }
      closeModal();
      load();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this budget?")) return;
    await deleteBudget(id);
    load();
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const periodLabel = (p) => PERIODS.find((x) => x.value === p)?.label || p;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Budgets</h1>
          <div className="subtitle">
            {loading ? "Loading…" : `${budgets.length} budgets · $${totalSpent.toFixed(2)} of $${totalBudget.toFixed(2)} spent`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: "auto" }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), "MMMM")}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: "auto" }}>
            {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Budget</button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading budgets…</span></div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>No budgets active for this period.</p>
            <p style={{ marginTop: 8 }}>Create monthly, quarterly, yearly, or all-time budgets.</p>
          </div>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map((b) => {
            const pct = b.percentage;
            const color = barColor(pct);
            const isOver = pct >= 100;
            const remaining = Math.max(b.limit_amount - b.spent, 0);
            return (
              <div className={`budget-card${isOver ? " over" : ""}`} key={b.id}>
                <div className="budget-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="budget-cat-icon" style={{ background: isOver ? "var(--red-dim)" : "var(--accent-dim)" }}>
                      {CAT_ICONS[b.category] || "📦"}
                    </div>
                    <div>
                      <div className="budget-cat-name">{b.category}</div>
                      <div className="budget-cat-period">
                        <span className="budget-period-badge">{periodLabel(b.period)}</span>
                        {" "}{b.period_label}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>✕</button>
                  </div>
                </div>

                <div className="budget-amounts">
                  <span>Spent: <span className="spent">${b.spent.toFixed(2)}</span></span>
                  <span>Limit: ${b.limit_amount.toFixed(2)}</span>
                </div>

                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                </div>

                <div className="budget-footer">
                  <span>${remaining.toFixed(2)} remaining</span>
                  <span className={`budget-pct ${isOver ? "danger" : pct >= 80 ? "warn" : "safe"}`}>
                    {pct.toFixed(0)}%{isOver && " — OVER!"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Edit Budget" : "New Budget"}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    disabled={!!editingId}
                    ref={editingId ? null : firstInputRef}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Limit ($)</label>
                  <input
                    ref={editingId ? firstInputRef : null}
                    type="number" min="1" step="0.01" placeholder="500.00"
                    value={form.limit_amount}
                    onChange={(e) => setForm({ ...form, limit_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Budget Period</label>
                  <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                    {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <span style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {form.period === "monthly" && "Tracks spending for a single month."}
                    {form.period === "quarterly" && "Tracks spending across the 3-month quarter."}
                    {form.period === "yearly" && "Tracks spending for the entire year."}
                    {form.period === "all_time" && "Tracks total spending since you started — never resets."}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Budget"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
