import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import App from "../src/react-app/App";
import React from "react";

declare global {
  var __seedExpenses: (
    rows: Array<{
      id?: number;
      description: string;
      date: string;
      cost: number;
    }>
  ) => void;
}

describe("Homework 2 Tests (React Frontend)", () => {
  it("(10 pts) Navigates between Expenses, Add Expense and Total from the navbar", async () => {
    render(<App />);

    const expensesLink = await screen.findByTestId("expenses");
    const addLink = screen.getByTestId("add-expense");
    const totalLink = screen.getByTestId("total-link");

    expect(await screen.findByTestId("page-expenses")).toBeInTheDocument();
    expect(expensesLink).toHaveAttribute("aria-current", "page");
    expect(addLink).not.toHaveAttribute("aria-current", "page");
    expect(totalLink).not.toHaveAttribute("aria-current", "page");

    fireEvent.click(addLink);
    expect(await screen.findByTestId("page-add")).toBeInTheDocument();
    expect(screen.getByTestId("add-expense")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByTestId("expenses")).not.toHaveAttribute(
      "aria-current",
      "page"
    );

    fireEvent.click(totalLink);
    expect(await screen.findByTestId("page-total")).toBeInTheDocument();
    expect(
      await screen.findByTestId("total-value").then((el) => el.textContent)
    ).toMatch(/\$0\.00/);
    expect(screen.getByTestId("total-link")).toHaveAttribute(
      "aria-current",
      "page"
    );

    fireEvent.click(expensesLink);
    expect(await screen.findByTestId("page-expenses")).toBeInTheDocument();
    expect(screen.getByTestId("expenses")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("(10 pts) Shows expenses by Date (newest first) as default, and toggles Cost ascending/descending", async () => {
    globalThis.__seedExpenses([
      { description: "Alpha", date: "2025-09-10", cost: 10 },
      { description: "Bravo", date: "2025-09-12", cost: 5 },
      { description: "Charlie", date: "2025-09-11", cost: 20 },
    ]);

    render(<App />);

    const rows = await screen.findAllByTestId("expense-row");
    const orderByDateDesc = rows.map(
      (r) => within(r).getByTestId("cell-desc").textContent
    );
    expect(orderByDateDesc).toEqual(["Bravo", "Charlie", "Alpha"]);

    fireEvent.click(screen.getByTestId("sort-cost"));
    const rowsAsc = await screen.findAllByTestId("expense-row");
    const orderAsc = rowsAsc.map(
      (r) => within(r).getByTestId("cell-desc").textContent
    );
    expect(orderAsc).toEqual(["Bravo", "Alpha", "Charlie"]);

    fireEvent.click(screen.getByTestId("sort-cost"));
    const rowsDesc = await screen.findAllByTestId("expense-row");
    const orderDesc = rowsDesc.map(
      (r) => within(r).getByTestId("cell-desc").textContent
    );
    expect(orderDesc).toEqual(["Charlie", "Alpha", "Bravo"]);
  });

  it("(10 pts) Split the expenses 20 per page; enable or disable Prev/Next buttons appropriately", async () => {
    const rows = Array.from({ length: 45 }, (_, i) => {
      const d = new Date(Date.UTC(2025, 0, 1 + i));
      return {
        description: `Item ${i + 1}`,
        date: d.toISOString().slice(0, 10),
        cost: i + 1,
      };
    });
    globalThis.__seedExpenses(rows);

    render(<App />);

    expect(await screen.findByTestId("pager-indicator")).toHaveTextContent(
      "Page 1 of 3"
    );
    let pageRows = await screen.findAllByTestId("expense-row");
    expect(pageRows).toHaveLength(20);
    expect(within(pageRows[0]).getByTestId("cell-serial").textContent).toBe(
      "1"
    );
    expect(within(pageRows[19]).getByTestId("cell-serial").textContent).toBe(
      "20"
    );
    expect(screen.getByTestId("pager-prev")).toBeDisabled();
    expect(screen.getByTestId("pager-next")).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("pager-next"));
    expect(await screen.findByTestId("pager-indicator")).toHaveTextContent(
      "Page 2 of 3"
    );
    pageRows = await screen.findAllByTestId("expense-row");
    expect(pageRows).toHaveLength(20);
    expect(within(pageRows[0]).getByTestId("cell-serial").textContent).toBe(
      "21"
    );
    expect(within(pageRows[19]).getByTestId("cell-serial").textContent).toBe(
      "40"
    );

    fireEvent.click(screen.getByTestId("pager-next"));
    expect(await screen.findByTestId("pager-indicator")).toHaveTextContent(
      "Page 3 of 3"
    );
    pageRows = await screen.findAllByTestId("expense-row");
    expect(pageRows).toHaveLength(5);
    expect(within(pageRows[0]).getByTestId("cell-serial").textContent).toBe(
      "41"
    );
    expect(within(pageRows[4]).getByTestId("cell-serial").textContent).toBe(
      "45"
    );
    expect(screen.getByTestId("pager-next")).toBeDisabled();

    fireEvent.click(screen.getByTestId("pager-prev"));
    expect(await screen.findByTestId("pager-indicator")).toHaveTextContent(
      "Page 2 of 3"
    );
    expect(screen.getByTestId("pager-next")).not.toBeDisabled();
  });

  it("(10 pts) Creates a new expense and returns to the list", async () => {
    window.history.pushState({}, "", "/add");
    render(<App />);

    expect(await screen.findByTestId("page-add")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("desc-input"), {
      target: { value: "Coffee" },
    });
    fireEvent.change(screen.getByTestId("date-input"), {
      target: { value: "2025-09-15" },
    });
    fireEvent.change(screen.getByTestId("cost-input"), {
      target: { value: "3.50" },
    });

    fireEvent.click(screen.getByTestId("submit-btn"));

    expect(await screen.findByTestId("page-expenses")).toBeInTheDocument();
    const rows = await screen.findAllByTestId("expense-row");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByTestId("cell-desc")).toHaveTextContent(
      "Coffee"
    );
  });

  it("(10 pts) Updates an existing expense, then deletes it", async () => {
    globalThis.__seedExpenses([
      { description: "Snack", date: "2025-09-14", cost: 6.25 },
    ]);

    render(<App />);

    let rows = await screen.findAllByTestId("expense-row");
    const row = rows[0];

    fireEvent.click(within(row).getByTestId("edit-btn"));

    const descInput = within(row).getByDisplayValue(
      "Snack"
    ) as HTMLInputElement;
    fireEvent.change(descInput, { target: { value: "Snack (updated)" } });

    const costInput = within(row).getByDisplayValue("6.25") as HTMLInputElement;
    fireEvent.change(costInput, { target: { value: "7.00" } });

    fireEvent.click(within(row).getByTestId("save-btn"));

    const updatedRows = await screen.findAllByTestId("expense-row");
    const updated = updatedRows[0];
    expect(within(updated).getByTestId("cell-desc")).toHaveTextContent(
      "Snack (updated)"
    );
    expect(within(updated).getByTestId("cell-cost").textContent).toMatch(
      /\$7\.00/
    );

    fireEvent.click(within(updated).getByTestId("delete-btn"));
    expect(await screen.findByTestId("empty-state")).toBeInTheDocument();
  });

  it("(10 pts) Compute and display the correct total on Total Page", async () => {
    globalThis.__seedExpenses([
      { description: "A", date: "2025-09-10", cost: 5 },
      { description: "B", date: "2025-09-11", cost: 7.25 },
    ]);

    window.history.pushState({}, "", "/total");
    render(<App />);

    expect(await screen.findByTestId("page-total")).toBeDefined();
    expect(
      await screen.findByTestId("total-value").then((el) => el.textContent)
    ).toMatch(/\$12\.25/);
  });
});
