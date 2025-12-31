import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  getDoc
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from "@mui/material";

export default function ExpenseForm({ open, onClose, expense }) {
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState("");

  const [bankAccounts, setBankAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]); // NEW

  const [selectedBank, setSelectedBank] = useState("");
  const [selectedCard, setSelectedCard] = useState("");

  const isEdit = Boolean(expense);

  // Load categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });
    return () => unsub();
  }, []);

  // Load bank accounts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });
    return () => unsub();
  }, []);

  // Load credit cards
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "creditCards"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCreditCards(arr);
    });
    return () => unsub();
  }, []);

  // Load custom payment modes (WALLET / UPI / Online services)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "paymentModes"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setPaymentModes(arr);
    });
    return () => unsub();
  }, []);

  // Prefill edit form
  useEffect(() => {
    if (expense) {
      setAmount(expense.amount);
      setCategory(expense.category);
      setDescription(expense.description || "");
      setDate(expense.date);
      setPaymentMode(expense.paymentMode);
      setSelectedBank(expense.bankId || "");
      setSelectedCard(expense.cardId || "");
    } else {
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(today);
      setPaymentMode("");
      setSelectedBank("");
      setSelectedCard("");
    }
  }, [expense]);

  const handleSave = async () => {
    if (!amount || !category || !date) return;

    let expenseData = {
      amount: Number(amount),
      category,
      description,
      date,
      paymentMode,
      bankId: selectedBank || null,
      cardId: selectedCard || null,
      createdAt: new Date()
    };

    // ⚡ 1️⃣ ADD NEW EXPENSE
    let expRef;

    if (isEdit) {
      expRef = doc(db, "expenses", expense.id);
      await updateDoc(expRef, expenseData);
    } else {
      expRef = await addDoc(collection(db, "expenses"), expenseData);
    }

    // ⚡ 2️⃣ UPDATE BALANCES (IMPORTANT)
    await handleBalanceDeduction(isEdit ? expense : expenseData, expenseData);

    onClose();
  };

  // ✨ Handle balance updates
  const handleBalanceDeduction = async (oldExp, newExp) => {
    // CASE A: Deduct from Bank
    if (newExp.paymentMode === "Bank" && newExp.bankId) {
      const bankRef = doc(db, "bankAccounts", newExp.bankId);
      const bankSnap = await getDoc(bankRef);
      const currentBal = bankSnap.data().balance;

      await updateDoc(bankRef, {
        balance: currentBal - Number(newExp.amount)
      });
    }

    // CASE B: Deduct from Credit Card
    if (newExp.paymentMode === "Credit Card" && newExp.cardId) {
      const cardRef = doc(db, "creditCards", newExp.cardId);
      const cardSnap = await getDoc(cardRef);
      const currentBal = cardSnap.data().currentBalance;

      await updateDoc(cardRef, {
        currentBalance: currentBal - Number(newExp.amount)
      });
    }

    // CASE C: Deduct from Custom Payment Modes
    if (
      newExp.paymentMode &&
      !["Cash", "Bank", "Credit Card"].includes(newExp.paymentMode)
    ) {
      const pmRef = doc(db, "paymentModes", newExp.paymentMode);
      const pmSnap = await getDoc(pmRef);

      const currentBal = pmSnap.data().balance;

      await updateDoc(pmRef, {
        balance: currentBal - Number(newExp.amount)
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>

      <DialogContent>

        {/* AMOUNT */}
        <TextField
          label="Amount"
          type="number"
          fullWidth
          margin="dense"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* CATEGORY */}
        <TextField
          label="Category"
          select
          fullWidth
          margin="dense"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.name}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

        {/* DESCRIPTION */}
        <TextField
          label="Description"
          fullWidth
          margin="dense"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* DATE */}
        <TextField
          label="Date"
          type="date"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* PAYMENT MODE */}
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
          <MenuItem value="Credit Card">Credit Card</MenuItem>

          {/* CUSTOM PAYMENT MODES */}
          {paymentModes.map((pm) => (
            <MenuItem key={pm.id} value={pm.id}>
              {pm.name} — ₹{pm.balance} ({pm.type})
            </MenuItem>
          ))}
        </TextField>

        {/* BANK LIST */}
        {paymentMode === "Bank" && (
          <TextField
            label="Select Bank"
            select
            fullWidth
            margin="dense"
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
          >
            {bankAccounts.map((bank) => (
              <MenuItem key={bank.id} value={bank.id}>
                {bank.name} — ₹{bank.balance}
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* CREDIT CARD LIST */}
        {paymentMode === "Credit Card" && (
          <TextField
            label="Select Credit Card"
            select
            fullWidth
            margin="dense"
            value={selectedCard}
            onChange={(e) => setSelectedCard(e.target.value)}
          >
            {creditCards.map((card) => (
              <MenuItem key={card.id} value={card.id}>
                {card.name} — Available ₹{card.currentBalance}
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
