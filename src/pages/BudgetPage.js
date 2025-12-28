import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import { NEEDS_CATEGORIES, WANTS_CATEGORIES } from "../utils/categoryMap";

import {
  Typography,
  Card,
  CardContent,
  LinearProgress
} from "@mui/material";

export default function BudgetPage() {
  const [expenses, setExpenses] = useState([]);
  const [incomeList, setIncomeList] = useState([]);

  // Load expenses
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      let arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setExpenses(arr);
    });
    return () => unsub();
  }, []);

  // Load all incomes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incomes"), (snap) => {
      let arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setIncomeList(arr);
    });
    return () => unsub();
  }, []);

  // Total Income
  const income = incomeList.reduce((acc, cur) => acc + cur.amount, 0);

  // 50–30–20 Budget Limits
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

      {/* Total Income */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Total Income</Typography>
          <Typography variant="h4">₹{income}</Typography>
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
    </div>
  );
}
