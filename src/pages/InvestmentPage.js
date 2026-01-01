import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  MenuItem,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc
} from "firebase/firestore";

import InvestmentForm from "../components/InvestmentForm";
import SellInvestmentForm from "../components/SellInvestmentForm";

export default function InvestmentPage() {
  const [investments, setInvestments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openSell, setOpenSell] = useState(false);

  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const [tab, setTab] = useState(0);

  // ===========================
  // Load Investments
  // ===========================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investments"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setInvestments(arr);
    });
    return () => unsub();
  }, []);

  // ===========================
  // Load Investment Categories
  // ===========================
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investmentCategories"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });
    return () => unsub();
  }, []);

  // ===========================
  // Filter Logic
  // ===========================
  const filteredInvestments = investments.filter((inv) => {
    const yearMatch =
      selectedYear === "All" || inv.date.startsWith(selectedYear);
    const catMatch =
      selectedCategory === "All" || inv.category === selectedCategory;
    return yearMatch && catMatch;
  });

  const active = filteredInvestments.filter((i) => !i.sold);
  const sold = filteredInvestments.filter((i) => i.sold);

  // ===========================
  // Summary Calculations
  // ===========================
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

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Investments
      </Typography>

      {/* ===========================
          SUMMARY CARDS
      ============================ */}
      <Card style={{ marginBottom: 20 }}>
        <CardContent>
          <Typography variant="h6">Summary</Typography>

          <Grid container spacing={2} style={{ marginTop: 10 }}>
            <Grid item xs={6}>
              <Typography>Total Invested</Typography>
              <Typography variant="h6">₹{totalInvested}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Active Value</Typography>
              <Typography variant="h6">₹{activeInvested}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Total Returned</Typography>
              <Typography variant="h6">₹{totalReturned}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography>Net Profit/Loss</Typography>
              <Typography
                variant="h6"
                style={{ color: netProfit >= 0 ? "green" : "red" }}
              >
                ₹{netProfit}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ===========================
          FILTERS
      ============================ */}
      <Card style={{ marginBottom: 20 }}>
        <CardContent>
          <Typography variant="h6">Filters</Typography>

          <Grid container spacing={2} style={{ marginTop: 10 }}>
            {/* YEAR FILTER */}
            <Grid item xs={6}>
              <TextField
                label="Year"
                fullWidth
                select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {[...new Set(investments.map((i) => i.date.substring(0, 4)))]
                  .sort()
                  .map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>

            {/* CATEGORY FILTER */}
            <Grid item xs={6}>
              <TextField
                label="Category"
                fullWidth
                select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.name}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ===========================
          ADD INVESTMENT
      ============================ */}
      <Button
        variant="contained"
        fullWidth
        onClick={() => {
          setSelectedInvestment(null);
          setOpenAdd(true);
        }}
      >
        Add Investment
      </Button>

      {/* ===========================
          ACTIVE / SOLD TABS
      ============================ */}
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        centered
        style={{ marginTop: 20 }}
      >
        <Tab label="Active" />
        <Tab label="Sold" />
      </Tabs>

      {/* ===========================
          LIST OF INVESTMENTS
      ============================ */}
      {(tab === 0 ? active : sold).map((inv) => (
        <Card key={inv.id} style={{ marginTop: 16 }}>
          <CardContent>
            <Typography variant="h6">{inv.name}</Typography>
            <Typography>Category: {inv.category}</Typography>
            <Typography>Invested: ₹{inv.amount}</Typography>
            <Typography>Invested On: {inv.date}</Typography>

            {inv.note && <Typography>Note: {inv.note}</Typography>}

            {inv.sold && (
              <Typography style={{ marginTop: 10, color: "green" }}>
                Sold for ₹{inv.sellAmount} on {inv.sellDate}
              </Typography>
            )}

            {/* EDIT */}
            <Button
              variant="text"
              onClick={() => {
                setSelectedInvestment(inv);
                setOpenEdit(true);
              }}
            >
              Edit
            </Button>

            {/* DELETE */}
            <Button
              variant="text"
              color="error"
              onClick={async () => {
                if (window.confirm("Delete this investment?")) {
                  await deleteDoc(doc(db, "investments", inv.id));
                }
              }}
            >
              Delete
            </Button>

            {/* SELL (Only if Active) */}
            {!inv.sold && (
              <Button
                variant="outlined"
                style={{ marginLeft: 10 }}
                onClick={() => {
                  setSelectedInvestment(inv);
                  setOpenSell(true);
                }}
              >
                Sell
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {/* ===========================
          DIALOGS
      ============================ */}

      {/* ADD */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add Investment</DialogTitle>
        <DialogContent>
          <InvestmentForm onClose={() => setOpenAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Investment</DialogTitle>
        <DialogContent>
          <InvestmentForm
            investment={selectedInvestment}
            onClose={() => setOpenEdit(false)}
          />
        </DialogContent>
      </Dialog>

      {/* SELL */}
      <Dialog open={openSell} onClose={() => setOpenSell(false)}>
        <DialogTitle>Sell Investment</DialogTitle>
        <DialogContent>
          <SellInvestmentForm
            investment={selectedInvestment}
            onClose={() => setOpenSell(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
