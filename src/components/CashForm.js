import React, { useState } from "react";
import { TextField, Button } from "@mui/material";

import { db, auth } from "../firebase/firebase";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";

export default function CashForm({ mode, cash, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const userId = auth.currentUser?.uid;

  const handleSave = async () => {
    if (!amount) return alert("Enter an amount");

    const value = Number(amount);

    let newBalance =
      mode === "deposit" ? cash.balance + value : cash.balance - value;

    if (newBalance < 0) {
      return alert("❌ Cash cannot go negative");
    }

    // 🟦 1️⃣ Update BALANCE
    await updateDoc(doc(db, "bankAccounts", cash.id), {
      balance: newBalance
    });

    // 🟦 2️⃣ Add TRANSACTION HISTORY
    await addDoc(collection(db, "cashTransactions"), {
      userId,
      type: mode, // deposit / withdraw
      amount: value,
      note: note || "",
      oldBalance: cash.balance,
      newBalance,
      date: new Date().toISOString()
    });

    onClose();
  };

  return (
    <div style={{ width: 300, paddingBottom: 20 }}>
      <TextField
        label="Amount"
        type="number"
        fullWidth
        margin="dense"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <TextField
        label="Note (optional)"
        fullWidth
        margin="dense"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={handleSave}
      >
        {mode === "deposit" ? "Deposit" : "Withdraw"}
      </Button>
    </div>
  );
}
