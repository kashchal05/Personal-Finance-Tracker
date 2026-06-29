from sqlalchemy import Column, Integer, String, Float, Date
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, default="")
    date = Column(Date, nullable=False)


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    limit_amount = Column(Float, nullable=False)
    period = Column(String, nullable=False, server_default="monthly")
