import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ExpensesListPage from "./pages/ExpensesListPage";
import AddExpensePage from "./pages/AddExpensePage";
import TotalPage from "./pages/TotalPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="top-nav">
          <NavLink to="/" end className="nav-link" data-testid="expenses">
            Expenses
          </NavLink>
          <NavLink to="/add" className="nav-link" data-testid="add-expense">
            Add Expense
          </NavLink>
          <NavLink to="/total" className="nav-link" data-testid="total-link">
            Total
          </NavLink>
        </nav>

        <div className="app-inner">
          <Routes>
            <Route path="*" element={<ExpensesListPage />} />
            <Route path="/" element={<ExpensesListPage />} />
            <Route path="/add" element={<AddExpensePage />} />
            <Route path="/total" element={<TotalPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
