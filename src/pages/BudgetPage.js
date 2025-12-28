import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import {
  Typography,
  Card,
  CardContent,
  LinearProgress,
  TextField
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";
import { NEEDS_CATEGORIES, WANTS_CATEGORIES } from "../utils/categoryMap";

export default function BudgetPage() {
  const [expenses, setExpenses] = useState([]);
  const [incomeList, setIncomeList] = useState([]);

  // Month-Year Picker
  const [selectedDate, setSelectedDate] = useState(dayjs()); // default = current month

  const selectedYear = selectedDate.year();
  const selectedMonth = selectedDate.month(); // 0–11

  // Load expenses
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      let arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setExpenses(arr);
    });
    return () => unsub();
  }, []);

  // Load incomes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incomes"), (snap) => {
      let arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setIncomeList(arr);
    });
    return () => unsub();
  }, []);

  // ------------------------------
  // FILTERING LOGIC (selected month + year)
  // ------------------------------
  const filterByMonthYear = (arr) => {
    return arr.filter((item) => {
      const d = new Date(item.date);
      return (
        d.getFullYear() === selectedYear &&
        d.getMonth() === selectedMonth
      );
    });
  };

  const filteredIncome = filterByMonthYear(incomeList);
  const filteredExpenses = filterByMonthYear(expenses);

  // Total income for selected month
  const income = filteredIncome.reduce((a, b) => a + b.amount, 0);

  // 50–30–20
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

      {/* MONTH–YEAR PICKER */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          views={["year", "month"]} // ONLY year + month
          label="Select Month"
          minDate={dayjs("1990-01-01")}
          maxDate={dayjs("2050-12-31")}
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

      {/* INCOME */}
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">
            Income ({selectedDate.format("MMMM YYYY")})
          </Typography>
          <Typography variant="h4">₹{income}</Typography>
        </CardContent>
      </Card>

      {/* NEEDS */}
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

      {/* WANTS */}
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

      {/* SAVINGS */}
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
