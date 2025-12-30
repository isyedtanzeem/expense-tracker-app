import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem
} from "@mui/material";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export default function IncomeForm({ open, onClose, income }) {
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(today);

  const [paymentMode, setPaymentMode] = useState("Cash"); // NEW
  const [bankAccounts, setBankAccounts] = useState([]); // NEW
  const [selectedBank, setSelectedBank] = useState(""); // NEW

  const isEdit = Boolean(income);

  // Load bank accounts (includes Cash Wallet)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });

    return () => unsub();
  }, []);

  // Pre-fill fields when editing
  useEffect(() => {
    if (income) {
      setAmount(income.amount);
      setSource(income.source || "");
      setDate(income.date || today);
      setPaymentMode(income.paymentMode || "Cash");
      setSelectedBank(income.bankId || "");
    } else {
      setAmount("");
      setSource("");
      setDate(today);
      setPaymentMode("Cash");
      setSelectedBank("");
    }
  }, [income]);

  // -----------------------------
  // Helpers - Balance Update
  // -----------------------------
  const updateCash = async (value) => {
    const cash = bankAccounts.find((b) => b.type === "cash");
    if (!cash) return;

    await updateDoc(doc(db, "bankAccounts", cash.id), {
      balance: cash.balance + value
    });
  };

  const updateBank = async (bankId, value) => {
    const bank = bankAccounts.find((b) => b.id === bankId);
    if (!bank) return;

    await updateDoc(doc(db, "bankAccounts", bankId), {
      balance: bank.balance + value
    });
  };

  // Reverse old income effects (only when editing)
  const reverseOldIncome = async () => {
    if (!isEdit) return;

    const old = income;

    if (old.paymentMode === "Cash") {
      await updateCash(-old.amount * -1);
    }

    if (old.paymentMode === "Bank" && old.bankId) {
      await updateBank(old.bankId, -old.amount);
    }
  };

  // Apply new income effects
  const applyNewIncome = async () => {
    const amt = Number(amount);

    if (paymentMode === "Cash") {
      await updateCash(amt);
    }

    if (paymentMode === "Bank" && selectedBank) {
      await updateBank(selectedBank, amt);
    }
  };

  const handleSave = async () => {
    if (!amount || !source || !date) return;

    if (isEdit) {
      // Reverse old effects
      await reverseOldIncome();

      // Apply updated effects
      await applyNewIncome();

      await updateDoc(doc(db, "incomes", income.id), {
        amount: Number(amount),
        source,
        date,
        paymentMode,
        bankId: selectedBank || null
      });
    } else {
      // New income entry
      await applyNewIncome();

      await addDoc(collection(db, "incomes"), {
        amount: Number(amount),
        source,
        date,
        paymentMode,
        bankId: selectedBank || null,
        createdAt: new Date()
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEdit ? "Edit Income" : "Add Income"}</DialogTitle>

      <DialogContent>

        <TextField
          label="Amount"
          type="number"
          fullWidth
          margin="dense"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <TextField
          label="Income Source"
          fullWidth
          margin="dense"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Salary, Freelancing, Bonus, Gift, Investment..."
        />

        <TextField
          label="Date"
          type="date"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* -------------------- */}
        {/* PAYMENT MODE         */}
        {/* -------------------- */}
        <TextField
          label="Payment Mode"
          select
          fullWidth
          margin="dense"
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
        >
          <MenuItem value="Cash">Cash</MenuItem>
          <MenuItem value="Bank">Bank</MenuItem>
        </TextField>

        {/* -------------------- */}
        {/* BANK SELECTION       */}
        {/* -------------------- */}
        {paymentMode === "Bank" && (
          <TextField
            label="Select Bank"
            select
            fullWidth
            margin="dense"
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
          >
            {bankAccounts
              .sort((a, b) => (a.type === "cash" ? -1 : 1))
              .map((bank) => (
                <MenuItem key={bank.id} value={bank.id}>
                  {bank.name} — ₹{bank.balance}
                </MenuItem>
              ))}
          </TextField>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          {isEdit ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
