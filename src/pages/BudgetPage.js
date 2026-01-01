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
  LinearProgress
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";
import { NEEDS_CATEGORIES, WANTS_CATEGORIES } from "../utils/categoryMap";

export default function BudgetPage() {
  const userId = auth.currentUser?.uid;

  const [expenses, setExpenses] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const selectedYear = selectedDate.year();
  const selectedMonth = selectedDate.month();

  // Load user-specific expenses
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setExpenses(list);
    });

    return () => unsub();
  }, [userId]);

  // Load user-specific incomes
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "incomes"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setIncomeList(list);
    });

    return () => unsub();
  }, [userId]);

  const filterByMonthYear = (arr) =>
    arr.filter((item) => {
      const d = new Date(item.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });

  const filteredIncome = filterByMonthYear(incomeList);
  const filteredExpenses = filterByMonthYear(expenses);

  const income = filteredIncome.reduce((a, b) => a + b.amount, 0);

  const needsLimit = income * 0.5;
  const wantsLimit = income * 0.3;
  const savingsLimit = income * 0.2;

  let needsSpent = 0;
  let wantsSpent = 0;

  filteredExpenses.forEach((exp) => {
    if (NEEDS_CATEGORIES.includes(exp.category)) needsSpent += exp.amount;
    else if (WANTS_CATEGORIES.includes(exp.category)) wantsSpent += exp.amount;
  });

  const savingsActual = income - (needsSpent + wantsSpent);

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        50–30–20 Budget
      </Typography>

      {/* Month Selector */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          views={["year", "month"]}
          label="Select Month"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              margin: "normal"
            }
          }}
        />
      </LocalizationProvider>

      {/* Income */}
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Income ({selectedDate.format("MMMM YYYY")})
          </Typography>
          <Typography variant="h4">₹{income}</Typography>
        </CardContent>
      </Card>

      {/* Needs */}
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Needs (50%) – Limit: ₹{needsLimit}
          </Typography>
          <Typography>Spent: ₹{needsSpent}</Typography>

          <LinearProgress
            variant="determinate"
            value={needsLimit === 0 ? 0 : (needsSpent / needsLimit) * 100}
            color={needsSpent > needsLimit ? "error" : "primary"}
            style={{ marginTop: 10 }}
          />
        </CardContent>
      </Card>

      {/* Wants */}
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Wants (30%) – Limit: ₹{wantsLimit}
          </Typography>
          <Typography>Spent: ₹{wantsSpent}</Typography>

          <LinearProgress
            variant="determinate"
            value={wantsLimit === 0 ? 0 : (wantsSpent / wantsLimit) * 100}
            color={wantsSpent > wantsLimit ? "error" : "primary"}
            style={{ marginTop: 10 }}
          />
        </CardContent>
      </Card>

      {/* Savings */}
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Savings (20%) – Target: ₹{savingsLimit}
          </Typography>
          <Typography>Achieved: ₹{savingsActual}</Typography>

          <LinearProgress
            variant="determinate"
            value={savingsLimit === 0 ? 0 : (savingsActual / savingsLimit) * 100}
            color={savingsActual < 0 ? "error" : "primary"}
            style={{ marginTop: 10 }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
