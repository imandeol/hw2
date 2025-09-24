import { SELF, env } from "cloudflare:test";
import { AnyD1Database } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";

const BASE = "http://example.com";

async function getExpenses() {
  const resp = await SELF.fetch(`${BASE}/api/expenses`);
  const body = await resp.json();
  return { resp, body };
}

async function postExpense(e: {
  description: string;
  date: string;
  cost: number;
}) {
  return await SELF.fetch(`${BASE}/api/addExpense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e),
  });
}

async function putExpense(
  id: number,
  e: { description: string; date: string; cost: number }
) {
  return await SELF.fetch(`${BASE}/api/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e),
  });
}

async function deleteExpense(id: number) {
  return await SELF.fetch(`${BASE}/api/expenses/${id}`, {
    method: "DELETE",
  });
}

beforeEach(async () => {
  await (env as AnyD1Database).DB.exec("DELETE FROM expenses;");
});

describe("Homework 2 Tests (Backend Server Tests)", () => {
  it("(10 pts) Adding an expense: rejects invalid input", async () => {
    let r = await postExpense({
      description: "",
      date: "2025-09-01",
      cost: 10,
    });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Invalid description" });

    r = await SELF.fetch(`${BASE}/api/addExpense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Coffee", date: 1234, cost: 3.5 }),
    });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Invalid date" });

    r = await SELF.fetch(`${BASE}/api/addExpense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Tea",
        date: "2025-09-02",
        cost: "2.5",
      }),
    });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Invalid cost" });

    r = await postExpense({
      description: "Lunch",
      date: "2025-09-02",
      cost: -1,
    });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Invalid cost" });
  });

  it("(10 pts) Adding an expense: succeeds and returns the created row", async () => {
    const r = await postExpense({
      description: "Coffee",
      date: "2025-09-01",
      cost: 3.5,
    });
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.message).toBe("Expense saved successfully");
    expect(b.expense).toMatchObject({
      description: "Coffee",
      date: "2025-09-01",
      cost: 3.5,
      deleted: false,
    });
    expect(typeof b.expense.id).toBe("number");
  });

  it("(10 pts) Getting expenses: returns only non-deleted items, sorted newest first", async () => {
    const r1 = await postExpense({
      description: "Coffee",
      date: "2025-09-01",
      cost: 3.5,
    });
    const e1 = (await r1.json()).expense;

    const r2 = await postExpense({
      description: "Lunch",
      date: "2025-09-02",
      cost: 12.25,
    });
    const e2 = (await r2.json()).expense;

    const { resp, body } = await getExpenses();
    expect(resp.status).toBe(200);
    expect(Array.isArray(body.expenseList)).toBe(true);
    expect(body.expenseList.length).toBe(2);
    expect(body.expenseList[0].id).toBe(e2.id);
    expect(body.expenseList[1].id).toBe(e1.id);
  });

  it("(10 pts) Updating an expense: updates the record and returns it", async () => {
    const created = await postExpense({
      description: "Snack",
      date: "2025-09-03",
      cost: 5.75,
    });
    const e = (await created.json()).expense as { id: number };

    const upd = await putExpense(e.id, {
      description: "Snack (updated)",
      date: "2025-09-04",
      cost: 6.0,
    });
    expect(upd.status).toBe(200);
    const ub = await upd.json();
    expect(ub.message).toBe("Expense updated successfully");
    expect(ub.expense).toMatchObject({
      id: e.id,
      description: "Snack (updated)",
      date: "2025-09-04",
      cost: 6.0,
    });

    const { body } = await getExpenses();
    const found = body.expenseList.find((x: any) => x.id === e.id);
    expect(found).toMatchObject({
      description: "Snack (updated)",
      date: "2025-09-04",
      cost: 6.0,
    });
  });

  it("(10 pts) Updating an expense: returns error 404 if the record doesn't exist", async () => {
    const r = await putExpense(999999, {
      description: "Nothing",
      date: "2025-09-01",
      cost: 1,
    });
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ error: "Expense not found" });
  });

  it("(10 pts) Deleting an expense: soft-deletes the record and returns success", async () => {
    const r1 = await postExpense({
      description: "Coffee",
      date: "2025-09-01",
      cost: 3.5,
    });
    const e1 = (await r1.json()).expense as { id: number };

    const r2 = await postExpense({
      description: "Lunch",
      date: "2025-09-02",
      cost: 12.25,
    });
    const e2 = (await r2.json()).expense as { id: number };

    const del = await deleteExpense(e2.id);
    expect(del.status).toBe(200);
    const db = await del.json();
    expect(db.message).toBe("Expense deleted successfully");
    expect(Boolean(db.expense.deleted)).toBe(true);

    const { body } = await getExpenses();
    expect(body.expenseList.length).toBe(1);
    expect(body.expenseList[0].id).toBe(e1.id);
  });
});
