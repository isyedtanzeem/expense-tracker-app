import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

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
import LoanPage from "./pages/LoanPage";

// Auth pages (create these)
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";

function App() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user login state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div>Loading...</div>;

  // 🔒 Auth Guard
  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Layout>
                <ExpensesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <Layout>
                <BankAccounts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cards"
          element={
            <ProtectedRoute>
              <Layout>
                <CreditCards />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cash"
          element={
            <ProtectedRoute>
              <Layout>
                <CashPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <Layout>
                <BudgetPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/income"
          element={
            <ProtectedRoute>
              <Layout>
                <IncomePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/investments"
          element={
            <ProtectedRoute>
              <Layout>
                <InvestmentPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <Layout>
                <LoanPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lendborrow"
          element={
            <ProtectedRoute>
              <Layout>
                <LendBorrowPage />
              </Layout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
