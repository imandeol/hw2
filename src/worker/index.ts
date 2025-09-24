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

  //TODO: Fetch the list of expenses from the database
  const expenseList = [];
  return c.json({ expenseList: [] });
});

app.post("/api/addExpense", async (c) => {
  const db = drizzle(c.env.DB);

  //TODO: Define the expected structure of the incoming expense data
  const expense = await c.req.json<{}>();

  //TODO: Validate the inputs before adding the expense and send appropriate error messages
  if (expense) {
    return c.json({ error: "Invalid input" }, 400);
  }

  //TODO: Add the expense to the database and return the newly created expense

  return c.json({
    message: "Expense saved successfully",
    expense: {},
  });
});

app.delete("/api/expenses/:id", async (c) => {
  const db = drizzle(c.env.DB);

  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing expense id" }, 400);
  }

  try {
    //TODO: Delete the expense from the database by setting deleted flag

    //TODO: If no rows were affected, return a 404 error
    if (id) {
      return c.json({ error: "Expense not found" }, 404);
    }

    // TODO: If deletion was successful, return a success message
    return c.json({
      message: "Expense deleted successfully",
      expense: {},
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
    //TODO: Update the expense in the database

    //TODO: If no rows were affected, return a 404 error
    if (id) {
      return c.json({ error: "Expense not found" }, 200);
    }

    //TODO: If update was successful, return a success message and the updated expense
    return c.json({
      message: "Expense updated successfully",
      expense: {},
    });
  } catch (err) {
    console.error("Error updating expense:", err);
    return c.json({ error: "Server error while updating expense" }, 500);
  }
});

export default app;
