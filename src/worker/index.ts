import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { expenses } from "../../db/schema.ts";

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/expenses", async (c) => {
  const db = drizzle(c.env.DB);

  const expenseList = await db
    .select()
    .from(expenses)
    .where(eq(expenses.deleted, false))
    .orderBy(desc(expenses.id));
  return c.json({ expenseList });
});

app.post("/api/addExpense", async (c) => {
  const db = drizzle(c.env.DB);

  const expense = await c.req.json<{
    description: string;
    date: string;
    cost: number;
  }>();

  const { description, date, cost } = expense;

  if (!description || typeof description !== "string") {
    return c.json({ error: "Invalid description" }, 400);
  }
  if (!date || typeof date !== "string") {
    return c.json({ error: "Invalid date" }, 400);
  }
  if (typeof cost !== "number" || cost < 0) {
    return c.json({ error: "Invalid cost" }, 400);
  }

  const result = await db
    .insert(expenses)
    .values({ description, date, cost, deleted: false })
    .returning();
  return c.json({
    message: "Expense saved successfully",
    expense: result[0],
  });
});

app.delete("/api/expenses/:id", async (c) => {
  const db = drizzle(c.env.DB);

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing expense id" }, 400);
  }

  try {
    const result = await db
      .update(expenses)
      .set({ deleted: true })
      .where(eq(expenses.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Expense not found" }, 404);
    }

    return c.json({
      message: "Expense deleted successfully",
      expense: result[0],
    });
  } catch (err) {
    console.error("Error deleting expense:", err);
    return c.json({ error: "Server error while deleting expense" }, 500);
  }
});

app.put("/api/expenses/:id", async (c) => {
  const db = drizzle(c.env.DB);

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing expense id" }, 400);
  }

  const body = await c.req.json<{
    description: string;
    date: string;
    cost: number;
  }>();

  const { description, date, cost } = body;

  if (!description || typeof description !== "string") {
    return c.json({ error: "Invalid description" }, 400);
  }
  if (!date || typeof date !== "string") {
    return c.json({ error: "Invalid date" }, 400);
  }
  if (typeof cost !== "number" || cost < 0) {
    return c.json({ error: "Invalid cost" }, 400);
  }

  try {
    const result = await db
      .update(expenses)
      .set({
        description,
        date,
        cost,
      })
      .where(eq(expenses.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "Expense not found" }, 404);
    }

    return c.json({
      message: "Expense updated successfully",
      expense: result[0],
    });
  } catch (err) {
    console.error("Error updating expense:", err);
    return c.json({ error: "Server error while updating expense" }, 500);
  }
});

export default app;
