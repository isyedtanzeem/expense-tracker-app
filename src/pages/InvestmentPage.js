import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  MenuItem,
  TextField,
  Grid
} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import { db } from "../firebase/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";

import InvestmentForm from "../components/InvestmentForm";
import SellInvestmentForm from "../components/SellInvestmentForm";
import GoalForm from "../components/GoalForm";

import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";

export default function InvestmentPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [investments, setInvestments] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Goals
  const [goals, setGoals] = useState([]);
  const [openGoal, setOpenGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Dialogs
  const [openAdd, setOpenAdd] = useState(false);
  const [openSell, setOpenSell] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // Tabs
  const [tab, setTab] = useState(0);

  // ================================
  // Load Investments
  // ================================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investments"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setInvestments(arr);
    });
    return () => unsub();
  }, []);

  // ================================
  // Load Categories
  // ================================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investmentCategories"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });
    return () => unsub();
  }, []);

  // ================================
  // Load Goals
  // ================================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investmentGoals"), snap => {
      let arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setGoals(arr);
    });
    return () => unsub();
  }, []);

  // ================================
  // FILTERING LOGIC
  // ================================
  const filteredInvestments = investments.filter(inv => {
    const yearMatch =
      selectedYear === "All" || inv.date.startsWith(selectedYear);

    const catMatch =
      selectedCategory === "All" || inv.category === selectedCategory;

    return yearMatch && catMatch;
  });

  const active = filteredInvestments.filter(i => !i.sold);
  const sold = filteredInvestments.filter(i => i.sold);

  // ================================
  // SUMMARY CALCULATIONS
  // ================================
  const totalInvested = filteredInvestments.reduce(
    (sum, inv) => sum + inv.amount,
    0
  );

  const activeInvested = active.reduce((sum, i) => sum + i.amount, 0);

  const totalReturned = sold.reduce(
    (sum, i) => sum + (i.sellAmount || 0),
    0
  );

  const netProfit = totalReturned - totalInvested;

  // ================================
  // PIE CHART DATA (CATEGORY SPLIT)
  // ================================
  const categoryTotals = {};
  active.forEach(inv => {
    categoryTotals[inv.category] =
      (categoryTotals[inv.category] || 0) + inv.amount;
  });

  const pieData = Object.entries(categoryTotals).map(([category, value]) => ({
    name: category,
    value
  }));

  // ================================
  // MONTHLY TREND BAR CHART
  // ================================
  const monthTotals = {};
  filteredInvestments.forEach(inv => {
    const [yyyy, mm] = inv.date.split("-");
    const key = `${mm}-${yyyy}`;
    monthTotals[key] = (monthTotals[key] || 0) + inv.amount;
  });

  const monthlyData = Object.entries(monthTotals).map(([month, amount]) => ({
    month,
    amount
  }));

  // ================================
  // P/L TREND LINE CHART
  // ================================
  const plTotals = {};
  sold.forEach(inv => {
    const [yyyy, mm] = inv.sellDate.split("-");
    const key = `${mm}-${yyyy}`;
    const profit = (inv.sellAmount || 0) - inv.amount;
    plTotals[key] = (plTotals[key] || 0) + profit;
  });

  const plData = Object.entries(plTotals).map(([month, profit]) => ({
    month,
    profit
  }));

  // ================================
  // Dynamic Colors (Dark Mode Safe)
  // ================================
  const colors = [
    isDark ? "#90caf9" : "#1976d2",
    isDark ? "#ffb74d" : "#ff9800",
    isDark ? "#ce93d8" : "#9c27b0",
    isDark ? "#80cbc4" : "#009688",
    isDark ? "#ef9a9a" : "#e53935"
  ];
  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Investments Overview
      </Typography>

      {/* ============================ */}
      {/* 📊 SUMMARY DASHBOARD CARDS   */}
      {/* ============================ */}
      <Card style={{ marginBottom: 20 }}>
        <CardContent>
          <Typography variant="h6">Summary</Typography>

          <Grid container spacing={2} style={{ marginTop: 10 }}>
            <Grid item xs={6}>
              <Typography>Total Invested</Typography>
              <Typography variant="h6">₹{totalInvested}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Active Investment</Typography>
              <Typography variant="h6">₹{activeInvested}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Total Returned</Typography>
              <Typography variant="h6">₹{totalReturned}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Net P/L</Typography>
              <Typography
                variant="h6"
                style={{ color: netProfit >= 0 ? "lightgreen" : "red" }}
              >
                ₹{netProfit}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ============================ */}
      {/* 🔵 FILTER SECTION            */}
      {/* ============================ */}
      <Card style={{ marginBottom: 20 }}>
        <CardContent>
          <Typography variant="h6">Filters</Typography>

          <Grid container spacing={2} style={{ marginTop: 10 }}>
            {/* YEAR FILTER */}
            <Grid item xs={6}>
              <TextField
                label="Year"
                select
                fullWidth
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {[...new Set(investments.map(i => i.date.substring(0, 4)))]
                  .sort()
                  .map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
              </TextField>
            </Grid>

            {/* CATEGORY FILTER */}
            <Grid item xs={6}>
              <TextField
                label="Category"
                select
                fullWidth
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ============================ */}
      {/* 📈 PORTFOLIO CHARTS          */}
      {/* ============================ */}
      <Typography variant="h6" style={{ marginBottom: 10 }}>
        Portfolio Analytics
      </Typography>

      {/* --- PIE CHART (Category Split) --- */}
      <Typography style={{ fontWeight: "bold" }}>Category Allocation</Typography>
      <PieChart width={330} height={260}>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={90}
          dataKey="value"
          nameKey="name"
          label
        >
          {pieData.map((entry, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>

      {/* --- MONTHLY TREND BAR CHART --- */}
      <Typography style={{ marginTop: 20, fontWeight: "bold" }}>
        Monthly Investment Trend
      </Typography>
      <BarChart width={330} height={260} data={monthlyData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill={isDark ? "#90caf9" : "#1976d2"} />
      </BarChart>

      {/* --- PROFIT/LOSS LINE CHART --- */}
      <Typography style={{ marginTop: 20, fontWeight: "bold" }}>
        Profit / Loss Trend
      </Typography>
      <LineChart width={330} height={260} data={plData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="profit"
          stroke={isDark ? "#ffb74d" : "#ff9800"}
          strokeWidth={3}
        />
      </LineChart>

      {/* ============================ */}
      {/* 🎯 GOALS SECTION            */}
      {/* ============================ */}
      <Typography variant="h6" style={{ marginTop: 30 }}>
        Investment Goals
      </Typography>

      <Button
        variant="contained"
        style={{ marginTop: 10 }}
        onClick={() => {
          setSelectedGoal(null);
          setOpenGoal(true);
        }}
      >
        Add Goal
      </Button>

      {/* GOALS LIST */}
      {goals.map(goal => {
        const progress = Math.min(
          (totalInvested / goal.targetAmount) * 100,
          100
        ).toFixed(1);

        return (
          <Card key={goal.id} style={{ marginTop: 16 }}>
            <CardContent>
              <Typography variant="h6">{goal.name}</Typography>
              <Typography>Target: ₹{goal.targetAmount}</Typography>
              <Typography>
                Progress: {progress}% (₹{totalInvested} / ₹{goal.targetAmount})
              </Typography>

              <Button
                variant="text"
                onClick={() => {
                  setSelectedGoal(goal);
                  setOpenGoal(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="text"
                color="error"
                onClick={async () => {
                  await deleteDoc(doc(db, "investmentGoals", goal.id));
                }}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* ============================ */}
      {/* 📁 ADD INVESTMENT BUTTON     */}
      {/* ============================ */}

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 20 }}
        onClick={() => setOpenAdd(true)}
      >
        Add Investment
      </Button>

      {/* ============================ */}
      {/* 🟦 ACTIVE / SOLD TABS        */}
      {/* ============================ */}

      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
        centered
        style={{ marginTop: 20 }}
      >
        <Tab label="Active" />
        <Tab label="Sold" />
      </Tabs>

      {(tab === 0 ? active : sold).map(inv => (
        <Card key={inv.id} style={{ marginTop: 16 }}>
          <CardContent>
            <Typography variant="h6">{inv.name}</Typography>
            <Typography>Category: {inv.category}</Typography>
            <Typography>Invested: ₹{inv.amount}</Typography>
            <Typography>Date: {inv.date}</Typography>
            {inv.note && <Typography>Note: {inv.note}</Typography>}

            {!inv.sold ? (
              <Button
                variant="outlined"
                style={{ marginTop: 10 }}
                onClick={() => {
                  setSelectedInvestment(inv);
                  setOpenSell(true);
                }}
              >
                Sell
              </Button>
            ) : (
              <Typography style={{ marginTop: 10, color: "lightgreen" }}>
                Sold for ₹{inv.sellAmount} on {inv.sellDate}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}

      {/* ============================ */}
      {/* 📌 DIALOGS                  */}
      {/* ============================ */}

      {/* Add Investment */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add Investment</DialogTitle>
        <DialogContent>
          <InvestmentForm onClose={() => setOpenAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Sell Investment */}
      <Dialog open={openSell} onClose={() => setOpenSell(false)}>
        <DialogTitle>Sell Investment</DialogTitle>
        <DialogContent>
          <SellInvestmentForm
            investment={selectedInvestment}
            onClose={() => setOpenSell(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={openGoal} onClose={() => setOpenGoal(false)}>
        <DialogTitle>
          {selectedGoal ? "Edit Goal" : "Add Goal"}
        </DialogTitle>
        <DialogContent>
          <GoalForm
            goal={selectedGoal}
            onClose={() => setOpenGoal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
