import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, addDoc } from "firebase/firestore";

import { NEEDS_CATEGORIES, WANTS_CATEGORIES } from "../utils/categoryMap";

import {
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress
} from "@mui/material";

export default function BudgetPage() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(0);

  const [open, setOpen] = useState(false);
  const [newIncome, setNewIncome] = useState("");

  // Load expenses
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      let arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setExpenses(arr);
    });
    return () => unsub();
  }, []);

  // Load income (only latest)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incomes"), (snap) => {
      let arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));

      if (arr.length > 0) {
        const latest = arr[arr.length - 1];
        setIncome(latest.amount);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveIncome = async () => {
    if (!newIncome) return;

    await addDoc(collection(db, "incomes"), {
      amount: Number(newIncome),
      createdAt: new Date(),
    });

    setOpen(false);
  };

  // Calculate 50–30–20 limits
  const needsLimit = income * 0.5;
  const wantsLimit = income * 0.3;
  const savingsLimit = income * 0.2;

  // Calculate spending
  let needsSpent = 0;
  let wantsSpent = 0;

  expenses.forEach((exp) => {
    if (NEEDS_CATEGORIES.includes(exp.category)) needsSpent += exp.amount;
    else if (WANTS_CATEGORIES.includes(exp.category)) wantsSpent += exp.amount;
  });

  // Savings = income - (needs + wants)
  const savingsActual = income - (needsSpent + wantsSpent);

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        50–30–20 Budget
      </Typography>

      {/* INCOME Card */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Monthly Income</Typography>
          <Typography variant="h4">₹{income}</Typography>
          <Button variant="contained" onClick={() => setOpen(true)} style={{ marginTop: 10 }}>
            Update Income
          </Button>
        </CardContent>
      </Card>

      {/* NEEDS */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Needs (50%) – Limit: ₹{needsLimit}
          </Typography>
          <Typography>Spent: ₹{needsSpent}</Typography>
          <LinearProgress
            variant="determinate"
            value={(needsSpent / needsLimit) * 100}
            color={needsSpent > needsLimit ? "error" : "primary"}
            style={{ marginTop: 10 }}
          />
        </CardContent>
      </Card>

      {/* WANTS */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Wants (30%) – Limit: ₹{wantsLimit}
          </Typography>
          <Typography>Spent: ₹{wantsSpent}</Typography>
          <LinearProgress
            variant="determinate"
            value={(wantsSpent / wantsLimit) * 100}
            color={wantsSpent > wantsLimit ? "error" : "primary"}
            style={{ marginTop: 10 }}
          />
        </CardContent>
      </Card>

      {/* SAVINGS */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Savings (20%) – Target: ₹{savingsLimit}
          </Typography>
          <Typography>Achieved: ₹{savingsActual}</Typography>
          <LinearProgress
            variant="determinate"
            value={(savingsActual / savingsLimit) * 100}
            color={savingsActual < 0 ? "error" : "primary"}
            style={{ marginTop: 10 }}
          />
        </CardContent>
      </Card>

      {/* Update Income Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Update Monthly Income</DialogTitle>
        <DialogContent>
          <TextField
            label="Income Amount"
            type="number"
            fullWidth
            margin="dense"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveIncome}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
