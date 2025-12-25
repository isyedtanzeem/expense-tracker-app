import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import BankAccounts from "./pages/BankAccounts";
import CreditCards from "./pages/CreditCards";
import ExpensesPage from "./pages/ExpensesPage";
import Dashboard from "./pages/Dashboard";
import BudgetPage from "./pages/BudgetPage";
import SettingsPage from "./pages/SettingsPage";


function App() {

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/accounts" element={<BankAccounts />} />
          <Route path="/cards" element={<CreditCards />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/budget" element={<BudgetPage />} />

        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
