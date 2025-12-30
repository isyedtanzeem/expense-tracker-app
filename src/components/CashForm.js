import React, { useState } from "react";
import {
  TextField,
  Button
} from "@mui/material";

import { db } from "../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function CashForm({ mode, cash, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSave = async () => {
    if (!amount) return;

    const value = Number(amount);

    let newBalance =
      mode === "deposit"
        ? cash.balance + value
        : cash.balance - value;

    await updateDoc(doc(db, "bankAccounts", cash.id), {
      balance: newBalance
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
