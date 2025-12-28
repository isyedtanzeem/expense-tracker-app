import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from "@mui/material";
import {
  collection,
  addDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function IncomeForm({ open, onClose, income }) {
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(today);

  const isEdit = Boolean(income);

  useEffect(() => {
    if (income) {
      setAmount(income.amount);
      setSource(income.source || "");
      setDate(income.date || today);
    } else {
      setAmount("");
      setSource("");
      setDate(today);
    }
  }, [income]);

  const handleSave = async () => {
    if (!amount || !source || !date) return;

    if (isEdit) {
      await updateDoc(doc(db, "incomes", income.id), {
        amount: Number(amount),
        source,
        date
      });
    } else {
      await addDoc(collection(db, "incomes"), {
        amount: Number(amount),
        source,
        date,
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
