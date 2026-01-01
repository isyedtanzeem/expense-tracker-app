import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  getDoc
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

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
  const [paymentModes, setPaymentModes] = useState([]);

  const [selectedBank, setSelectedBank] = useState("");
  const [selectedCard, setSelectedCard] = useState("");

  const isEdit = Boolean(expense);
  const userId = auth.currentUser?.uid;

  // Load categories (filtered by user)
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(
      collection(db, "categories"),
      (snap) => {
        let arr = [];
        snap.forEach((d) => {
          if (d.data().userId === userId) {
            arr.push({ id: d.id, ...d.data() });
          }
        });
        setCategories(arr);
      }
    );
    return () => unsub();
  }, [userId]);

  // Load banks for user
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) arr.push({ id: d.id, ...d.data() });
      });
      setBankAccounts(arr);
    });
    return () => unsub();
  }, [userId]);

  // Load credit cards for user
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "creditCards"), (snap) => {
      let arr = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) arr.push({ id: d.id, ...d.data() });
      });
      setCreditCards(arr);
    });
    return () => unsub();
  }, [userId]);

  // Load custom payment modes
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "paymentModes"), (snap) => {
      let arr = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) arr.push({ id: d.id, ...d.data() });
      });
      setPaymentModes(arr);
    });
    return () => unsub();
  }, [userId]);

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
  }, [expense, today]);

  // SAVE Expense
  const handleSave = async () => {
    if (!amount || !category || !date || !userId) return;

    const newExpense = {
      amount: Number(amount),
      category,
      description,
      date,
      paymentMode,
      bankId: selectedBank || null,
      cardId: selectedCard || null,
      userId, /// NEW — user ownership
      createdAt: new Date()
    };

    let expenseRef;

    if (isEdit) {
      expenseRef = doc(db, "expenses", expense.id);
      await updateDoc(expenseRef, newExpense);
    } else {
      expenseRef = await addDoc(collection(db, "expenses"), newExpense);
    }

    await updateBalances(isEdit ? expense : null, newExpense);

    onClose();
  };

  // BALANCE DEDUCTION
  const updateBalances = async (oldExpense, newExpense) => {
    const amt = Number(newExpense.amount);

    // BANK
    if (newExpense.paymentMode === "Bank" && newExpense.bankId) {
      const ref = doc(db, "bankAccounts", newExpense.bankId);
      const snap = await getDoc(ref);
      const bal = snap.data().balance;

      await updateDoc(ref, { balance: bal - amt });
    }

    // CREDIT CARD
    if (newExpense.paymentMode === "Credit Card" && newExpense.cardId) {
      const ref = doc(db, "creditCards", newExpense.cardId);
      const snap = await getDoc(ref);
      const bal = snap.data().currentBalance;

      await updateDoc(ref, { currentBalance: bal - amt });
    }

    // CUSTOM PAYMENT MODES (wallets, UPI, Amazon Pay etc)
    if (
      newExpense.paymentMode &&
      !["Cash", "Bank", "Credit Card"].includes(newExpense.paymentMode)
    ) {
      const ref = doc(db, "paymentModes", newExpense.paymentMode);
      const snap = await getDoc(ref);
      const bal = snap.data().balance;

      await updateDoc(ref, { balance: bal - amt });
    }
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

        {/* PAYMENT MODES */}
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

          {paymentModes.map((pm) => (
            <MenuItem key={pm.id} value={pm.id}>
              {pm.name} — ₹{pm.balance} ({pm.type})
            </MenuItem>
          ))}
        </TextField>

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
