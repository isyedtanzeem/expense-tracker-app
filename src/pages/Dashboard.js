import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import {
  Card,
  CardContent,
  Typography,
  Grid
} from "@mui/material";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Legend,
  Cell
} from "recharts";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);

  // Load expenses realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snapshot) => {
      let data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    });
    return () => unsub();
  }, []);

  // ---------- DAILY EXPENSE (BAR CHART) ----------
  const dailyData = {};
  expenses.forEach((exp) => {
    dailyData[exp.date] = (dailyData[exp.date] || 0) + exp.amount;
  });

  const dailyChart = Object.entries(dailyData).map(([date, amount]) => ({
    date,
    amount,
  }));

  // ---------- MONTHLY CATEGORY PIE CHART ----------
  const categoryData = {};
  expenses.forEach((exp) => {
    categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
  });

  const pieChartData = Object.entries(categoryData).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // ---------- YEARLY EXPENSE (LINE CHART) ----------
  const yearData = {};
  expenses.forEach((exp) => {
    const year = exp.date?.split("-")[0];
    yearData[year] = (yearData[year] || 0) + exp.amount;
  });

  const lineChartData = Object.entries(yearData).map(([year, amount]) => ({
    year,
    amount,
  }));

  // ---------- TOTAL SUMMARY ----------
  const totalSpent = expenses.reduce((acc, cur) => acc + cur.amount, 0);

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Dashboard
      </Typography>

      {/* Summary Card */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Total Spent</Typography>
          <Typography variant="h4">₹{totalSpent}</Typography>
        </CardContent>
      </Card>

      {/* DAILY BAR CHART */}
      <Typography variant="h6">Daily Expenses</Typography>
      <BarChart width={330} height={250} data={dailyChart}>
        <XAxis dataKey="date" fontSize={10} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill="#1976d2" />
      </BarChart>

      {/* MONTHLY CATEGORY PIE CHART */}
      <Typography variant="h6" style={{ marginTop: 20 }}>
        Monthly Category Breakdown
      </Typography>
      <PieChart width={350} height={300}>
        <Pie
          data={pieChartData}
          cx={180}
          cy={150}
          labelLine={false}
          outerRadius={110}
          fill="#8884d8"
          dataKey="value"
          label
        >
          {pieChartData.map((entry, index) => (
            <Cell key={index} fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042"][index % 4]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>

      {/* YEARLY LINE CHART */}
      <Typography variant="h6" style={{ marginTop: 20 }}>
        Yearly Spending Trend
      </Typography>
      <LineChart width={330} height={250} data={lineChartData}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="amount" stroke="#d32f2f" strokeWidth={3} />
      </LineChart>
    </div>
  );
}
