import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";

import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where
} from "firebase/firestore";

import InvestmentForm from "../components/InvestmentForm";
import SellInvestmentForm from "../components/SellInvestmentForm";

export default function InvestmentPage() {
  const userId = auth.currentUser?.uid;

  const [investments, setInvestments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openSell, setOpenSell] = useState(false);

  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // ============================
  // LOAD USER INVESTMENTS ONLY
  // ============================
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "investments"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setInvestments(arr);
    });

    return () => unsub();
  }, [userId]);

  // ============================
  // LOAD USER BANK ACCOUNTS
  // ============================
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

  // ============================
  // DELETE INVESTMENT + RESTORE BALANCE
  // ============================
  const handleDelete = async (inv) => {
    if (!window.confirm("Delete this investment?")) return;

    const amt = inv.amount;

    // restore money
    if (inv.paymentMode === "Cash") {
      const cash = bankAccounts.find((b) => b.type === "cash");
      if (cash)
        await updateDoc(doc(db, "bankAccounts", cash.id), {
          balance: cash.balance + amt
        });
    }

    if (inv.paymentMode === "Bank" && inv.bankId) {
      const bank = bankAccounts.find((b) => b.id === inv.bankId);
      if (bank)
        await updateDoc(doc(db, "bankAccounts", inv.bankId), {
          balance: bank.balance + amt
        });
    }

    await deleteDoc(doc(db, "investments", inv.id));
  };

  const active = investments.filter((i) => !i.sold);
  const sold = investments.filter((i) => i.sold);

  return (
    <div>
      <Typography variant="h5">Investments</Typography>

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={() => setOpenAdd(true)}
      >
        Add Investment
      </Button>

      {/* ACTIVE */}
      <Typography variant="h6" style={{ marginTop: 20 }}>
        Active Investments
      </Typography>

      {active.map((inv) => (
        <Card key={inv.id} style={{ marginTop: 12 }}>
          <CardContent>
            <Typography variant="h6">{inv.name}</Typography>
            <Typography>Category: {inv.category}</Typography>
            <Typography>Amount: ₹{inv.amount}</Typography>
            <Typography>Date: {inv.date}</Typography>

            {inv.note && <Typography>Note: {inv.note}</Typography>}

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

            <Button
              color="error"
              style={{ marginLeft: 10 }}
              onClick={() => handleDelete(inv)}
            >
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* SOLD */}
      <Typography variant="h6" style={{ marginTop: 30 }}>
        Sold Investments
      </Typography>

      {sold.map((inv) => (
        <Card key={inv.id} style={{ marginTop: 12 }}>
          <CardContent>
            <Typography variant="h6">{inv.name}</Typography>
            <Typography>Category: {inv.category}</Typography>
            <Typography>Invested: ₹{inv.amount}</Typography>
            <Typography>
              Sold For: ₹{inv.sellAmount} on {inv.sellDate}
            </Typography>
            {inv.note && <Typography>Note: {inv.note}</Typography>}

            <Button
              color="error"
              onClick={() => handleDelete(inv)}
              style={{ marginTop: 10 }}
            >
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* ADD */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add Investment</DialogTitle>
        <DialogContent>
          <InvestmentForm onClose={() => setOpenAdd(false)} />
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
