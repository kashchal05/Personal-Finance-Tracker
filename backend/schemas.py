from __future__ import annotations
from pydantic import BaseModel
from datetime import date as Date
from typing import Optional


class TransactionCreate(BaseModel):
    amount: float
    type: str
    category: str
    description: Optional[str] = ""
    date: Date


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[Date] = None


class TransactionOut(BaseModel):
    id: int
    amount: float
    type: str
    category: str
    description: str
    date: Date

    class Config:
        from_attributes = True


class BudgetCreate(BaseModel):
    category: str
    month: int
    year: int
    limit_amount: float
    period: str = "monthly"


class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = None
    period: Optional[str] = None


class BudgetOut(BaseModel):
    id: int
    category: str
    month: int
    year: int
    limit_amount: float
    period: str

    class Config:
        from_attributes = True


class BudgetProgress(BaseModel):
    id: int
    category: str
    month: int
    year: int
    limit_amount: float
    period: str
    spent: float
    percentage: float
    period_label: str


class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    net: float
    spending_by_category: dict[str, float]
    monthly_trend: list[dict]
    all_time_income: float
    all_time_expenses: float
    all_time_net: float
    all_time_tx_count: int
    top_expense_category: Optional[str]
