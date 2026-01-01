import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import {
  Typography,
  Card,
  CardContent,
  Button,
  MenuItem,
  TextField
} from "@mui/material";

import ExpenseForm from "../components/ExpenseForm";

export default function DashboardPage() {
  const [expenses, setExpenses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [openForm, setOpenForm] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  // ------------------------
  // Load Expenses
  // ------------------------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setExpenses(arr);
    });
    return () => unsub();
  }, []);

  // ------------------------
  // Load Bank Accounts
  // ------------------------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });
    return () => unsub();
  }, []);

  // ------------------------
  // Load Wallets (Cash / Others)
  // ------------------------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "wallets"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setWallets(arr);
    });
    return () => unsub();
  }, []);

  // ------------------------
  // Calculations
  // ------------------------

  const bankBalance = bankAccounts.reduce(
    (acc, b) => acc + Number(b.balance || 0),
    0
  );

  const cashBalance = wallets.reduce(
    (acc, w) => acc + Number(w.balance || 0),
    0
  );

  // FILTER BY SELECTED MONTH
  const filteredExpenses = expenses.filter((exp) => {
    if (!exp.date) return false;
    const expMonth = exp.date.slice(0, 7); // YYYY-MM
    return expMonth === selectedMonth;
  });

  const totalExpenseThisMonth = filteredExpenses.reduce(
    (acc, exp) => acc + exp.amount,
    0
  );

  // Month options (last 24 months)
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
    monthOptions.push({ value, label });
  }

  return (
    <div>

      {/* TOP SECTION */}
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Dashboard
      </Typography>

      {/* MONTH FILTER */}
      <TextField
        select
        fullWidth
        label="Select Month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        style={{ marginBottom: 16 }}
      >
        {monthOptions.map((m) => (
          <MenuItem key={m.value} value={m.value}>
            {m.label}
          </MenuItem>
        ))}
      </TextField>

      {/* ADD EXPENSE BUTTON */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={() => setOpenForm(true)}
        style={{ marginBottom: 20 }}
      >
        + Add Expense
      </Button>

      {/* BALANCES */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Current Balances</Typography>
          <Typography>Bank Balance: ₹{bankBalance}</Typography>
          <Typography>Cash Balance: ₹{cashBalance}</Typography>
        </CardContent>
      </Card>

      {/* TOTAL EXPENSES THIS MONTH */}
      <Card>
        <CardContent>
          <Typography variant="h6">Total Spent in Selected Month</Typography>
          <Typography variant="h4" style={{ marginTop: 10 }}>
            ₹{totalExpenseThisMonth}
          </Typography>
        </CardContent>
      </Card>

      {/* FORM */}
      <ExpenseForm open={openForm} onClose={() => setOpenForm(false)} />
    </div>
  );
}
