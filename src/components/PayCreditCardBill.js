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

export default function PayCreditCardBill({ open, onClose }) {
  const [cards, setCards] = useState([]);
  const [banks, setBanks] = useState([]);

  const [selectedCard, setSelectedCard] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // Load cards
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "creditCards"), (snapshot) => {
      let arr = [];
      snapshot.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setCards(arr);
    });
    return () => unsub();
  }, []);

  // Load banks
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snapshot) => {
      let arr = [];
      snapshot.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setBanks(arr);
    });
    return () => unsub();
  }, []);

  const handlePay = async () => {
    if (!amount || !selectedCard || !selectedBank || !paymentDate) return;

    const card = cards.find((c) => c.id === selectedCard);
    const bank = banks.find((b) => b.id === selectedBank);

    // 1. Deduct from bank
    await updateDoc(doc(db, "bankAccounts", selectedBank), {
      balance: bank.balance - Number(amount),
    });

    // 2. Restore credit card balance
    let updatedBalance = card.currentBalance + Number(amount);

    // Cannot exceed card limit
    if (updatedBalance > card.limit) {
      updatedBalance = card.limit;
    }

    await updateDoc(doc(db, "creditCards", selectedCard), {
      currentBalance: updatedBalance,
    });

    // 3. Add history entry to ccPayments
    await addDoc(collection(db, "ccPayments"), {
      amount: Number(amount),
      date: paymentDate,
      cardId: selectedCard,
      bankId: selectedBank,
      createdAt: new Date(),
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Pay Credit Card Bill</DialogTitle>

      <DialogContent>

        <TextField
          label="Select Credit Card"
          select
          fullWidth
          margin="dense"
          value={selectedCard}
          onChange={(e) => setSelectedCard(e.target.value)}
        >
          {cards.map((card) => (
            <MenuItem key={card.id} value={card.id}>
              {card.name} — Available ₹{card.currentBalance}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Select Bank Account"
          select
          fullWidth
          margin="dense"
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
        >
          {banks.map((bank) => (
            <MenuItem key={bank.id} value={bank.id}>
              {bank.name} — ₹{bank.balance}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Payment Amount"
          type="number"
          fullWidth
          margin="dense"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <TextField
          label="Date"
          type="date"
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handlePay}>
          Pay
        </Button>
      </DialogActions>
    </Dialog>
  );
}
