import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

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

  // ⭐ Ensure user logged in
  const userId = auth.currentUser?.uid;

  // Load expenses only for THIS USER
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

  // Load bank accounts only for THIS USER
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

  // Load wallets only for THIS USER
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

  // Balances
  const bankBalance = bankAccounts.reduce((acc, b) => acc + Number(b.balance), 0);
  const cashBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);

  const filteredExpenses = expenses.filter((exp) => exp.date?.slice(0, 7) === selectedMonth);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Dashboard
      </Typography>

      <TextField select fullWidth value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
        {/* Month options... */}
      </TextField>

      <Button variant="contained" fullWidth onClick={() => setOpenForm(true)} style={{ marginTop: 16 }}>
        + Add Expense
      </Button>

      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">Current Balances</Typography>
          <Typography>Bank Balance: ₹{bankBalance}</Typography>
          <Typography>Cash Balance: ₹{cashBalance}</Typography>
        </CardContent>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">Total Spent</Typography>
          <Typography variant="h4">₹{totalExpense}</Typography>
        </CardContent>
      </Card>

      <ExpenseForm open={openForm} onClose={() => setOpenForm(false)} />
    </div>
  );
}
