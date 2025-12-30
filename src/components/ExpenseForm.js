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
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
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

  // Pre-fill fields when editing
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
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentMode("");
      setSelectedBank("");
      setSelectedCard("");
    }
  }, [expense]);

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

  const updateCard = async (cardId, value) => {
    const card = creditCards.find((c) => c.id === cardId);
    if (!card) return;

    await updateDoc(doc(db, "creditCards", cardId), {
      currentBalance: card.currentBalance + value
    });
  };

  const reverseOldExpense = async () => {
    if (!isEdit) return;

    const old = expense;

    // Reverse bank
    if (old.paymentMode === "Bank" && old.bankId) {
      await updateBank(old.bankId, old.amount);
    }

    // Reverse cash
    if (old.paymentMode === "Cash") {
      await updateCash(old.amount);
    }

    // Reverse card
    if (old.paymentMode === "Credit Card" && old.cardId) {
      await updateCard(old.cardId, old.amount);
    }
  };

  const applyNewExpense = async () => {
    const newAmount = Number(amount);

    if (paymentMode === "Cash") {
      await updateCash(-newAmount);
    }

    if (paymentMode === "Bank" && selectedBank) {
      await updateBank(selectedBank, -newAmount);
    }

    if (paymentMode === "Credit Card" && selectedCard) {
      await updateCard(selectedCard, -newAmount);
    }
  };

  const handleSave = async () => {
    if (!amount || !category || !date) return;

    if (isEdit) {
      // Reverse old expense effect
      await reverseOldExpense();

      // Apply new expense logic
      await applyNewExpense();

      await updateDoc(doc(db, "expenses", expense.id), {
        amount: Number(amount),
        category,
        description,
        date,
        paymentMode,
        bankId: selectedBank || null,
        cardId: selectedCard || null,
      });
    } else {
      // Apply new expense effects
      await applyNewExpense();

      await addDoc(collection(db, "expenses"), {
        amount: Number(amount),
        category,
        description,
        date,
        paymentMode,
        bankId: selectedBank || null,
        cardId: selectedCard || null,
        createdAt: new Date()
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>

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

        <TextField
          label="Description"
          fullWidth
          margin="dense"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

        {/* BANK SELECTION */}
        {paymentMode === "Bank" && (
          <TextField
            label="Select Bank Account"
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

        {/* CARD SELECTION */}
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
