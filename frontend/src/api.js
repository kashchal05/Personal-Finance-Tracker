import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

export const getTransactions = (params) => api.get("/transactions", { params });
export const createTransaction = (data) => api.post("/transactions", data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const getBudgets = (params) => api.get("/budgets", { params });
export const getBudgetProgress = (month, year) =>
  api.get("/budgets/progress", { params: { month, year } });
export const createBudget = (data) => api.post("/budgets", data);
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

export const getDashboard = (params) => api.get("/dashboard", { params });
