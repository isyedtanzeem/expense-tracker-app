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

export default function ExpenseForm({ open, onClose }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("");

  const [bankAccounts, setBankAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedCard, setSelectedCard] = useState("");

  // Load banks
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snapshot) => {
      let arr = [];
      snapshot.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setBankAccounts(arr);
    });
    return () => unsub();
  }, []);

  // Load credit cards
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "creditCards"), (snapshot) => {
      let arr = [];
      snapshot.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setCreditCards(arr);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!amount || !category || !date) return;

    // Save expense entry
    const expenseRef = await addDoc(collection(db, "expenses"), {
      amount: Number(amount),
      category,
      description,
      date,
      paymentMode,
      bankId: selectedBank || null,
      cardId: selectedCard || null,
      createdAt: new Date(),
    });

    // Auto-update BANK balance
    if (paymentMode === "Bank" && selectedBank) {
      const bankRef = doc(db, "bankAccounts", selectedBank);
      const bank = bankAccounts.find((b) => b.id === selectedBank);

      await updateDoc(bankRef, {
        balance: bank.balance - Number(amount),
      });
    }

    // Auto-update CREDIT CARD balance
    if (paymentMode === "Credit Card" && selectedCard) {
      const cardRef = doc(db, "creditCards", selectedCard);
      const card = creditCards.find((c) => c.id === selectedCard);

      await updateDoc(cardRef, {
        currentBalance: card.currentBalance - Number(amount),
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Expense</DialogTitle>
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
          fullWidth
          margin="dense"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

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

        {/* If Bank selected */}
        {paymentMode === "Bank" && (
          <TextField
            label="Select Bank Account"
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

        {/* If Credit Card selected */}
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
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
