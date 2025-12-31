import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import {
  Typography,
  Card,
  CardContent
} from "@mui/material";

// ======================
// GOLD GRADIENT CARD STYLE
// ======================
const goldCard = {
  background: "linear-gradient(145deg, #045d32ff, #185942ff, #088636ff)",
  borderRadius: "16px",
  color: "white",
  boxShadow: "0 15px 25px rgba(0,0,0,0.4)",
  marginBottom: 16
};

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [banks, setBanks] = useState([]);
  const [cards, setCards] = useState([]);
  const [wallets, setWallets] = useState([]);

  // ======================
  // LOAD FIREBASE DATA
  // ======================
  useEffect(() => {
    onSnapshot(collection(db, "expenses"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setExpenses(arr);
    });

    onSnapshot(collection(db, "incomes"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setIncome(arr);
    });

    onSnapshot(collection(db, "bankAccounts"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBanks(arr);
    });

    onSnapshot(collection(db, "creditCards"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCards(arr);
    });

    onSnapshot(collection(db, "paymentModes"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setWallets(arr);
    });
  }, []);

  // ======================
  // MONTHLY CALCULATIONS
  // ======================
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyExpenses = expenses
    .filter((e) => e.date?.startsWith(currentMonth))
    .reduce((a, b) => a + Number(b.amount), 0);

  const monthlyIncome = income
    .filter((i) => i.date?.startsWith(currentMonth))
    .reduce((a, b) => a + Number(b.amount), 0);

  const savings = monthlyIncome - monthlyExpenses;

  // ======================
  // NET WORTH (CURRENT)
  // ======================
  const bankTotal = banks.reduce((acc, b) => acc + Number(b.balance || 0), 0);
  const walletTotal = wallets.reduce((a, b) => a + Number(b.balance || 0), 0);
  const creditUsed = cards.reduce(
    (a, b) => a + (b.limit - b.currentBalance),
    0
  );

  const netWorth = bankTotal + walletTotal - creditUsed;

  // ======================
  // RENDER UI
  // ======================
  return (
    <div
      style={{
        background: "#8e8282ff",
        minHeight: "100vh",
        padding: 12,
        color: "white"
      }}
    >
      <Typography variant="h5" style={{ marginBottom: 12 }}>
        Dashboard
      </Typography>

      {/* ====================== */}
      {/* TOP SUMMARY CARDS */}
      {/* ====================== */}

      <Card style={goldCard}>
        <CardContent>
          <Typography>Total Monthly Spend</Typography>
          <Typography variant="h4">₹{monthlyExpenses}</Typography>
        </CardContent>
      </Card>

      <Card style={goldCard}>
        <CardContent>
          <Typography>Monthly Income</Typography>
          <Typography variant="h4">₹{monthlyIncome}</Typography>
        </CardContent>
      </Card>

      <Card style={goldCard}>
        <CardContent>
          <Typography>Savings</Typography>
          <Typography variant="h4">₹{savings}</Typography>
        </CardContent>
      </Card>

      <Card style={goldCard}>
        <CardContent>
          <Typography>Net Worth</Typography>
          <Typography variant="h4">₹{netWorth}</Typography>
        </CardContent>
      </Card>

      {/* ====================== */}
      {/* BALANCE OVERVIEW */}
      {/* ====================== */}
      <Typography style={{ marginTop: 10 }}>Balance Overview</Typography>

      <Card style={{ background: "#fbfafaff", marginBottom: 16 }}>
        <CardContent>
          <Typography>Bank: ₹{bankTotal}</Typography>
          <Typography>Wallets: ₹{walletTotal}</Typography>
          <Typography>Credit Used: ₹{creditUsed}</Typography>
        </CardContent>
      </Card>
    </div>
  );
}
