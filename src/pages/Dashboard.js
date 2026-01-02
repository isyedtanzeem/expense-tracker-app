import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import {
  Typography,
  Card,
  CardContent,
  Button
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";
import ExpenseForm from "../components/ExpenseForm";

export default function DashboardPage() {
  const userId = auth.currentUser?.uid;

  const [expenses, setExpenses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [wallets, setWallets] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // =========================
  // LOAD EXPENSES (USER ONLY)
  // =========================
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setExpenses(arr);
    });

    return () => unsub();
  }, [userId]);

  // =========================
  // AUTO-SELECT LATEST MONTH
  // =========================
  useEffect(() => {
    if (expenses.length === 0) return;

    const months = expenses
      .map((e) => e.date?.slice(0, 7)) // YYYY-MM
      .filter(Boolean)
      .sort((a, b) => (a > b ? -1 : 1));

    if (months.length > 0) {
      setSelectedDate(dayjs(months[0] + "-01"));
    }
  }, [expenses]);

  // =========================
  // LOAD BANK ACCOUNTS
  // =========================
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "bankAccounts"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });

    return () => unsub();
  }, [userId]);

  // =========================
  // LOAD WALLETS (CASH / UPI)
  // =========================
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "wallets"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setWallets(arr);
    });

    return () => unsub();
  }, [userId]);

  // =========================
  // CALCULATIONS
  // =========================
  const selectedMonth = selectedDate.format("YYYY-MM");

  const filteredExpenses = expenses.filter(
    (e) => e.date?.startsWith(selectedMonth)
  );

  const totalExpense = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const bankBalance = bankAccounts.reduce(
    (sum, b) => sum + Number(b.balance || 0),
    0
  );

  const cashBalance = wallets.reduce(
    (sum, w) => sum + Number(w.balance || 0),
    0
  );

  // =========================
  // UI
  // =========================
  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>

      {/* MONTH PICKER */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          views={["year", "month"]}
          label="Select Month"
          value={selectedDate}
          minDate={dayjs("2026-01-01")}
          maxDate={dayjs()}
          onChange={(newValue) => setSelectedDate(newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              margin: "normal"
            }
          }}
        />
      </LocalizationProvider>

      {/* ADD EXPENSE */}
      <Button
        variant="contained"
        fullWidth
        sx={{ mb: 2 }}
        onClick={() => setOpenForm(true)}
      >
        + Add Expense
      </Button>

      {/* BALANCES */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Current Balances</Typography>
          <Typography>Bank Balance: ₹{bankBalance}</Typography>
          <Typography>Cash / Wallet Balance: ₹{cashBalance}</Typography>
        </CardContent>
      </Card>

      {/* TOTAL EXPENSE */}
      <Card>
        <CardContent>
          <Typography variant="h6">
            Total Spent — {selectedDate.format("MMMM YYYY")}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>
            ₹{totalExpense}
          </Typography>
        </CardContent>
      </Card>

      {/* ADD EXPENSE FORM */}
      <ExpenseForm
        open={openForm}
        onClose={() => setOpenForm(false)}
      />
    </div>
  );
}
