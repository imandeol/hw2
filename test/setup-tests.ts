import "@testing-library/jest-dom";
import { vi, beforeAll, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// In-memory “backend”
type Row = { id: number; description: string; date: string; cost: number };
let store: Row[] = [];
let idSeq = 1;

// Keep a handle to the real fetch for any other URLs
const realFetch = globalThis.fetch;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Normalize path (handles absolute/relative)
function toPath(input: RequestInfo | URL) {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
  return raw.replace(/^https?:\/\/[^/]+/, "");
}

beforeAll(() => {
  // Stub global fetch once for the whole web test project
  vi.stubGlobal(
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const path = toPath(input);

      if (method === "GET" && path === "/api/expenses") {
        return json({ expenseList: store });
      }

      if (method === "POST" && path === "/api/addExpense") {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const row: Row = {
          id: idSeq++,
          description: body.description,
          date: body.date,
          cost: body.cost,
        };
        store.push(row);
        return json({ message: "Expense saved successfully", expense: row });
      }

      if (method === "PUT" && path.startsWith("/api/expenses/")) {
        const id = Number(path.split("/").pop());
        const patch = init?.body ? JSON.parse(String(init.body)) : {};
        const idx = store.findIndex((r) => r.id === id);
        if (idx === -1) return json({ error: "Expense not found" }, 404);
        store[idx] = { ...store[idx], ...patch };
        return json({
          message: "Expense updated successfully",
          expense: store[idx],
        });
      }

      if (method === "DELETE" && path.startsWith("/api/expenses/")) {
        const id = Number(path.split("/").pop());
        const idx = store.findIndex((r) => r.id === id);
        if (idx === -1) return json({ error: "Expense not found" }, 404);
        store.splice(idx, 1);
        return json({
          message: "Expense deleted successfully",
          expense: { id },
        });
      }

      // passthrough for anything else
      return realFetch(input as any, init);
    }
  );

  // Helper to seed data from tests
  vi.stubGlobal("__seedExpenses", (rows: Row[]) => {
    store = rows.map((r, i) => ({ ...r, id: r.id ?? i + 1 }));
    idSeq = Math.max(0, ...store.map((r) => r.id)) + 1;
  });
});

beforeEach(() => {
  // fresh store each test by default
  store = [];
  idSeq = 1;
});

afterEach(() => {
  cleanup();
  // clear call history but keep our stubs active
  vi.clearAllMocks();
});
