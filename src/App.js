import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import BankAccounts from "./pages/BankAccounts";
import CreditCards from "./pages/CreditCards";
import ExpensesPage from "./pages/ExpensesPage";
import Dashboard from "./pages/Dashboard";
import BudgetPage from "./pages/BudgetPage";
import SettingsPage from "./pages/SettingsPage";
import IncomePage from "./pages/IncomePage";
import CalendarPage from "./pages/CalendarPage";
import LendBorrowPage from "./pages/LendBorrowPage";
import CashPage from "./pages/CashPage";
import InvestmentPage from "./pages/InvestmentPage";
import InvestmentCategoriesPage from "./pages/InvestmentCategoriesPage";


function App() {

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/accounts" element={<BankAccounts />} />
          <Route path="/cards" element={<CreditCards />} />
          <Route path="/cash" element={<CashPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/investments" element={<InvestmentPage />} />
          <Route path="/investment-categories" element={<InvestmentCategoriesPage />} />
          <Route path="/lendborrow" element={<LendBorrowPage />} />




        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
