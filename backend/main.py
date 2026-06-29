from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, text
from datetime import date
from typing import Optional
import models, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

# Migration: add 'period' column if not present (preserves existing data)
with engine.connect() as conn:
    try:
        conn.execute(text("SELECT period FROM budgets LIMIT 1"))
    except Exception:
        conn.execute(text("ALTER TABLE budgets ADD COLUMN period TEXT NOT NULL DEFAULT 'monthly'"))
        conn.commit()

app = FastAPI(title="Finance Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Transactions ---

@app.get("/transactions", response_model=list[schemas.TransactionOut])
def list_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None,
    categories: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Transaction)
    if type:
        q = q.filter(models.Transaction.type == type)
    if category:
        q = q.filter(models.Transaction.category == category)
    if categories:
        cat_list = [c.strip() for c in categories.split(",") if c.strip()]
        q = q.filter(models.Transaction.category.in_(cat_list))
    if month:
        q = q.filter(extract("month", models.Transaction.date) == month)
    if year:
        q = q.filter(extract("year", models.Transaction.date) == year)
    return q.order_by(models.Transaction.date.desc()).all()


@app.post("/transactions", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    if tx.type not in ("income", "expense"):
        raise HTTPException(400, "type must be 'income' or 'expense'")
    obj = models.Transaction(**tx.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/transactions/{tx_id}", response_model=schemas.TransactionOut)
def update_transaction(tx_id: int, tx: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    obj = db.get(models.Transaction, tx_id)
    if not obj:
        raise HTTPException(404, "Transaction not found")
    for field, value in tx.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    obj = db.get(models.Transaction, tx_id)
    if not obj:
        raise HTTPException(404, "Transaction not found")
    db.delete(obj)
    db.commit()


# --- Budgets ---

@app.get("/budgets", response_model=list[schemas.BudgetOut])
def list_budgets(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Budget)
    if month:
        q = q.filter(models.Budget.month == month)
    if year:
        q = q.filter(models.Budget.year == year)
    return q.all()


@app.post("/budgets", response_model=schemas.BudgetOut, status_code=201)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Budget).filter(
        models.Budget.category == budget.category,
        models.Budget.month == budget.month,
        models.Budget.year == budget.year,
        models.Budget.period == budget.period,
    ).first()
    if existing:
        raise HTTPException(400, "Budget already exists for this category/period")
    obj = models.Budget(**budget.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/budgets/{budget_id}", response_model=schemas.BudgetOut)
def update_budget(budget_id: int, budget: schemas.BudgetUpdate, db: Session = Depends(get_db)):
    obj = db.get(models.Budget, budget_id)
    if not obj:
        raise HTTPException(404, "Budget not found")
    for field, value in budget.model_dump(exclude_none=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/budgets/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    obj = db.get(models.Budget, budget_id)
    if not obj:
        raise HTTPException(404, "Budget not found")
    db.delete(obj)
    db.commit()


def _calc_budget_spent(db: Session, category: str, period: str, month: int, year: int) -> tuple[float, str]:
    """Returns (spent, period_label) for a budget based on its period type."""
    q = db.query(func.coalesce(func.sum(models.Transaction.amount), 0)).filter(
        models.Transaction.type == "expense",
        models.Transaction.category == category,
    )

    if period == "monthly":
        q = q.filter(
            extract("month", models.Transaction.date) == month,
            extract("year", models.Transaction.date) == year,
        )
        label = f"{year}-{month:02d}"
    elif period == "quarterly":
        quarter_start = ((month - 1) // 3) * 3 + 1
        q = q.filter(
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) >= quarter_start,
            extract("month", models.Transaction.date) < quarter_start + 3,
        )
        quarter_num = (quarter_start - 1) // 3 + 1
        label = f"Q{quarter_num} {year}"
    elif period == "yearly":
        q = q.filter(extract("year", models.Transaction.date) == year)
        label = str(year)
    elif period == "all_time":
        label = "All time"
    else:
        label = period

    return q.scalar(), label


@app.get("/budgets/progress", response_model=list[schemas.BudgetProgress])
def budget_progress(month: int, year: int, db: Session = Depends(get_db)):
    # Get monthly budgets for this month + non-monthly budgets for this year
    budgets = db.query(models.Budget).filter(
        ((models.Budget.period == "monthly") & (models.Budget.month == month) & (models.Budget.year == year)) |
        ((models.Budget.period == "quarterly") & (models.Budget.year == year) &
         (models.Budget.month >= (((month - 1) // 3) * 3 + 1)) &
         (models.Budget.month <= (((month - 1) // 3) * 3 + 1))) |
        ((models.Budget.period == "yearly") & (models.Budget.year == year)) |
        (models.Budget.period == "all_time")
    ).all()

    result = []
    for b in budgets:
        spent, label = _calc_budget_spent(db, b.category, b.period, month, year)
        pct = round((spent / b.limit_amount) * 100, 1) if b.limit_amount else 0
        result.append(schemas.BudgetProgress(
            id=b.id,
            category=b.category,
            month=b.month,
            year=b.year,
            limit_amount=b.limit_amount,
            period=b.period,
            spent=spent,
            percentage=pct,
            period_label=label,
        ))
    return result


# --- Dashboard ---

@app.get("/dashboard", response_model=schemas.DashboardSummary)
def dashboard(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db)):
    from dateutil.relativedelta import relativedelta

    q = db.query(models.Transaction)
    if month:
        q = q.filter(extract("month", models.Transaction.date) == month)
    if year:
        q = q.filter(extract("year", models.Transaction.date) == year)

    transactions = q.all()
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expenses = sum(t.amount for t in transactions if t.type == "expense")

    spending_by_category: dict[str, float] = {}
    for t in transactions:
        if t.type == "expense":
            spending_by_category[t.category] = spending_by_category.get(t.category, 0) + t.amount

    all_tx = db.query(models.Transaction).all()
    all_time_income = sum(t.amount for t in all_tx if t.type == "income")
    all_time_expenses = sum(t.amount for t in all_tx if t.type == "expense")
    all_time_tx_count = len(all_tx)

    cat_totals: dict[str, float] = {}
    for t in all_tx:
        if t.type == "expense":
            cat_totals[t.category] = cat_totals.get(t.category, 0) + t.amount
    top_expense_category = max(cat_totals, key=cat_totals.get) if cat_totals else None

    today = date.today()
    monthly_trend = []
    for i in range(5, -1, -1):
        d = today - relativedelta(months=i)
        m, y = d.month, d.year
        inc = db.query(func.coalesce(func.sum(models.Transaction.amount), 0)).filter(
            models.Transaction.type == "income",
            extract("month", models.Transaction.date) == m,
            extract("year", models.Transaction.date) == y,
        ).scalar()
        exp = db.query(func.coalesce(func.sum(models.Transaction.amount), 0)).filter(
            models.Transaction.type == "expense",
            extract("month", models.Transaction.date) == m,
            extract("year", models.Transaction.date) == y,
        ).scalar()
        monthly_trend.append({"month": f"{y}-{m:02d}", "income": inc, "expenses": exp})

    return schemas.DashboardSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        net=total_income - total_expenses,
        spending_by_category=spending_by_category,
        monthly_trend=monthly_trend,
        all_time_income=all_time_income,
        all_time_expenses=all_time_expenses,
        all_time_net=all_time_income - all_time_expenses,
        all_time_tx_count=all_time_tx_count,
        top_expense_category=top_expense_category,
    )
