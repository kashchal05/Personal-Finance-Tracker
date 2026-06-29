# 💰 Fintrack — Personal Finance Tracker

A full-stack personal finance app with a **FastAPI + SQLite** backend and **React + Vite + Recharts** frontend. Designed like a bank app — your total balance is front and center, with monthly breakdowns available when you need them.

---

## Features

### Dashboard (Bank-Style)
- **Large total balance** at the top — shows your all-time net worth (income minus expenses)
- All-time income, all-time spending, and total transaction count below
- Monthly income/expenses/net for the selected period
- Area chart showing 6-month balance trend
- Donut chart of spending by category
- Bar chart of income vs. expenses over time
- Period selector (month/year) changes only the period cards — total balance always shows the full picture

### Transactions
- Log income and expense transactions with category, amount, date, and description
- **Totals row** at the bottom of the table — shows total income, total expenses, and net for the current filter
- **Balance summary bar** at the top showing quick totals
- **Category checkbox filter** — dropdown with checkboxes for every category. All are checked by default. Uncheck any you want to exclude. "Reset All" button restores all checkboxes.
- Filter by type (income/expense), month, year
- Full edit and delete support. Press **Enter** to save.

### Budgets (Multi-Period)
- Set spending limits with flexible time periods:
  - **Monthly** — tracks one month
  - **Quarterly** — tracks a 3-month quarter
  - **Yearly** — tracks the full year
  - **All-Time** — ongoing total, never resets (great for long-term savings goals)
- Live progress bars — green when safe, amber at 80%, red when over
- All budget types appear on the same page for the relevant period
- Existing monthly budgets continue to work exactly as before

### Data
- Everything stored in `backend/finance.db` (SQLite file)
- Data survives restarts — nothing is lost when you Ctrl+C
- Schema migrations run automatically — existing data is always preserved

---

## Requirements

- **Python 3.9+** — `python3 --version`
- **Node.js 18+** — `node --version`

---

## First-Time Setup

```bash
# Backend
cd backend
pip3 install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

---

## Running the App

```bash
bash start.sh
```

Opens at **http://localhost:5173**. API docs at **http://localhost:8000/docs**.

Or manually in two terminals:

```bash
# Terminal 1
cd backend && python3 -m uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

---

## Project Structure

```
finance-tracker/
├── start.sh
├── backend/
│   ├── main.py              ← Routes + budget period logic + DB migration
│   ├── models.py            ← Transaction + Budget tables
│   ├── schemas.py           ← Pydantic types
│   ├── database.py          ← SQLite setup
│   ├── requirements.txt
│   └── finance.db           ← Your data (auto-created)
└── frontend/src/
    ├── App.jsx              ← Sidebar + routing
    ├── App.css              ← All styles
    ├── api.js               ← Backend API client
    └── pages/
        ├── Dashboard.jsx    ← Balance hero + charts
        ├── Transactions.jsx ← Table + category groups + totals
        └── Budgets.jsx      ← Multi-period budget cards
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Save transaction/budget | **Enter** |
| Close modal | Click outside or **✕** |

---

## Troubleshooting

### Dashboard stuck loading

Backend isn't running. Start it:
```bash
cd backend && python3 -m uvicorn main:app --reload --port 8000
```
Check http://localhost:8000/docs loads.

### Can't add/edit transactions

Same fix — backend must be running. If it returns a 422 error, check browser DevTools Network tab for details.

### `uvicorn: command not found`

Always use: `python3 -m uvicorn main:app --reload --port 8000`

### Port in use

```bash
lsof -i :8000  # or :5173
kill -9 <PID>
```

### Data seems missing

Check your month/year filter — the Transactions and Dashboard pages filter by period. Select "All Months" / "All Years" to see everything.

### Back up your data

```bash
cp backend/finance.db ~/Desktop/finance-backup.db
```

---

## API

Full interactive docs at http://localhost:8000/docs when running.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/transactions?type=&category=&categories=&month=&year=` | List (supports multi-category via comma-separated `categories`) |
| POST | `/transactions` | Create |
| PUT | `/transactions/{id}` | Update |
| DELETE | `/transactions/{id}` | Delete |
| GET | `/budgets?month=&year=` | List budgets |
| POST | `/budgets` | Create (include `period`: monthly/quarterly/yearly/all_time) |
| PUT | `/budgets/{id}` | Update limit or period |
| DELETE | `/budgets/{id}` | Delete |
| GET | `/budgets/progress?month=&year=` | All active budgets with spending progress |
| GET | `/dashboard?month=&year=` | Period + all-time stats |
