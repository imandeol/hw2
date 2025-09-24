import { Expense } from "./types";

export const formatMoney = (n: string | number, currency = "USD") => {
  const val = Number(n || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
};

export const fetchExpenses = async (): Promise<Expense[]> => {
  const res = await fetch("/api/expenses");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.expenseList) ? data.expenseList : [];
};

export const addExpense = async (expense: Omit<Expense, "id">) => {
  await fetch("/api/addExpense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
};

export const updateExpense = async (
  id: string | number,
  next: Partial<Expense>
) => {
  await fetch(`/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next),
  });
};

export const deleteExpense = async (id: string | number) => {
  await fetch(`/api/expenses/${id}`, { method: "DELETE" });
};
