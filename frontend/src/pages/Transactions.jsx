import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "../api";

const CATEGORIES = ["Food", "Housing", "Transport", "Entertainment", "Healthcare", "Shopping", "Utilities", "Salary", "Freelance", "Investment", "Other"];

const CAT_ICONS = {
  Food: "🍔", Housing: "🏠", Transport: "🚗", Entertainment: "🎬",
  Healthcare: "🏥", Shopping: "🛍️", Utilities: "⚡", Salary: "💼",
  Freelance: "💻", Investment: "📈", Other: "📦",
};

const empty = {
  amount: "",
  type: "expense",
  category: "Food",
  description: "",
  date: format(new Date(), "yyyy-MM-dd"),
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ type: "", month: "", year: "" });
  const [selectedCats, setSelectedCats] = useState(new Set(CATEGORIES));
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef(null);
  const catDropdownRef = useRef(null);

  const allSelected = selectedCats.size === CATEGORIES.length;

  const load = () => {
    const params = {};
    if (filter.type) params.type = filter.type;
    if (filter.month) params.month = filter.month;
    if (filter.year) params.year = filter.year;
    if (!allSelected && selectedCats.size > 0) {
      params.categories = [...selectedCats].join(",");
    }
    setLoading(true);
    getTransactions(params)
      .then((r) => { setTransactions(r.data); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, selectedCats]);

  useEffect(() => {
    if (modal) setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [modal]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCat = (cat) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const resetCats = () => setSelectedCats(new Set(CATEGORIES));

  const openCreate = () => { setForm(empty); setModal("create"); };
  const openEdit = (tx) => {
    setForm({ ...tx, date: format(new Date(tx.date + "T00:00:00"), "yyyy-MM-dd") });
    setModal(tx);
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    setSaving(true);
    try {
      const { id: _id, ...rest } = form;
      const payload = { ...rest, amount: parseFloat(form.amount) };
      if (modal === "create") {
        await createTransaction(payload);
      } else {
        await updateTransaction(modal.id, payload);
      }
      closeModal();
      load();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
    load();
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const catFilterLabel = allSelected
    ? "All Categories"
    : selectedCats.size === 0
      ? "None selected"
      : `${selectedCats.size} of ${CATEGORIES.length}`;

  return (
    <div>
      {/* Balance summary bar */}
      <div className="tx-balance-bar">
        <div className="tx-bal-item">
          <span className="tx-bal-label">Income</span>
          <span className="tx-bal-val income">+${totalIncome.toFixed(2)}</span>
        </div>
        <div className="tx-bal-item">
          <span className="tx-bal-label">Expenses</span>
          <span className="tx-bal-val expense">−${totalExpense.toFixed(2)}</span>
        </div>
        <div className="tx-bal-item">
          <span className="tx-bal-label">Net</span>
          <span className={`tx-bal-val ${netBalance >= 0 ? "positive" : "expense"}`}>
            {netBalance >= 0 ? "+" : "−"}${Math.abs(netBalance).toFixed(2)}
          </span>
        </div>
        <div className="tx-bal-item">
          <span className="tx-bal-label">Count</span>
          <span className="tx-bal-val">{transactions.length}</span>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: 20 }}>
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Transaction</button>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="filter-row">
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} style={{ width: "auto" }}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        {/* Category checkbox dropdown */}
        <div className="cat-dropdown" ref={catDropdownRef}>
          <button
            type="button"
            className="cat-dropdown-trigger"
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
          >
            <span>{catFilterLabel}</span>
            <span className="cat-dropdown-chevron">{catDropdownOpen ? "▲" : "▼"}</span>
          </button>
          {catDropdownOpen && (
            <div className="cat-dropdown-menu">
              <div className="cat-dropdown-header">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Filter Categories</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetCats}>Reset All</button>
              </div>
              {CATEGORIES.map((cat) => (
                <label key={cat} className="cat-checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedCats.has(cat)}
                    onChange={() => toggleCat(cat)}
                  />
                  <span className="cat-checkbox-icon">{CAT_ICONS[cat]}</span>
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <select value={filter.month} onChange={(e) => setFilter({ ...filter, month: e.target.value })} style={{ width: "auto" }}>
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), "MMMM")}</option>
          ))}
        </select>
        <select value={filter.year} onChange={(e) => setFilter({ ...filter, year: e.target.value })} style={{ width: "auto" }}>
          <option value="">All Years</option>
          {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading transactions…</span></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">💸</div>
                      <p>{selectedCats.size === 0 ? "No categories selected." : "No transactions found."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="td-muted">{format(new Date(tx.date + "T00:00:00"), "MMM d, yyyy")}</td>
                    <td>
                      <span style={{ marginRight: 6 }}>{CAT_ICONS[tx.category] || "•"}</span>
                      {tx.category}
                    </td>
                    <td className="td-muted">{tx.description || <span style={{ opacity: 0.4 }}>—</span>}</td>
                    <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                    <td className={tx.type === "income" ? "td-amount-income" : "td-amount-expense"} style={{ textAlign: "right" }}>
                      {tx.type === "income" ? "+" : "−"}${tx.amount.toFixed(2)}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(tx)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot>
                <tr className="totals-row">
                  <td colSpan={3} style={{ fontWeight: 700, color: "#94a3b8" }}>
                    TOTALS ({transactions.length} transactions)
                  </td>
                  <td></td>
                  <td style={{ textAlign: "right" }}>
                    <div className="totals-cell">
                      <span className="td-amount-income">+${totalIncome.toFixed(2)}</span>
                      <span className="td-amount-expense">−${totalExpense.toFixed(2)}</span>
                      <span style={{ fontWeight: 800, color: netBalance >= 0 ? "#4f46e5" : "#ef4444", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 4, marginTop: 2 }}>
                        {netBalance >= 0 ? "+" : "−"}${Math.abs(netBalance).toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === "create" ? "Add Transaction" : "Edit Transaction"}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>✕</button>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Type</label>
              <div className="type-toggle">
                <button type="button" className={form.type === "income" ? "active-income" : ""} onClick={() => setForm({ ...form, type: "income" })}>↑ Income</button>
                <button type="button" className={form.type === "expense" ? "active-expense" : ""} onClick={() => setForm({ ...form, type: "expense" })}>↓ Expense</button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input ref={firstInputRef} type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span></label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Grocery run" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
