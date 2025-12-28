import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot
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

  // Load banks
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

  // Pre-fill fields when editing OR reset when adding
  useEffect(() => {
    if (expense) {
      // Edit Mode
      setAmount(expense.amount);
      setCategory(expense.category);
      setDescription(expense.description || "");
      setDate(expense.date);
      setPaymentMode(expense.paymentMode);
      setSelectedBank(expense.bankId || "");
      setSelectedCard(expense.cardId || "");
    } else {
      // Add Mode → set default values
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

    // ------------------------------
    // EDIT MODE
    // ------------------------------
    if (isEdit) {
      await updateDoc(doc(db, "expenses", expense.id), {
        amount: Number(amount),
        category,
        description,
        date,
        paymentMode,
        bankId: selectedBank || null,
        cardId: selectedCard || null
      });

      onClose();
      return;
    }

    // ------------------------------
    // ADD MODE
    // ------------------------------

    let bankBalanceBefore = null;
    let cardBalanceBefore = null;

    // BANK deduction
    if (paymentMode === "Bank" && selectedBank) {
      const bank = bankAccounts.find((b) => b.id === selectedBank);
      bankBalanceBefore = bank.balance;

      await updateDoc(doc(db, "bankAccounts", selectedBank), {
        balance: bank.balance - Number(amount)
      });
    }

    // CREDIT CARD deduction
    if (paymentMode === "Credit Card" && selectedCard) {
      const card = creditCards.find((c) => c.id === selectedCard);
      cardBalanceBefore = card.currentBalance;

      await updateDoc(doc(db, "creditCards", selectedCard), {
        currentBalance: card.currentBalance - Number(amount)
      });
    }

    // Create expense record (IMPORTANT: Store original balances)
    await addDoc(collection(db, "expenses"), {
      amount: Number(amount),
      category,
      description,
      date,
      paymentMode,
      bankId: selectedBank || null,
      cardId: selectedCard || null,
      bankBalanceBefore,
      cardBalanceBefore,
      createdAt: new Date()
    });

    onClose();
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
        </TextField>

        {/* BANK */}
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

        {/* CREDIT CARD */}
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
