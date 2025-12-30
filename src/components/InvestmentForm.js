import React, { useEffect, useState } from "react";
import { TextField, Button, MenuItem } from "@mui/material";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";

export default function InvestmentForm({ onClose }) {
  const today = new Date().toISOString().split("T")[0];

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");

  // NEW: Investment Categories
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");

  // Load categories from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investmentCategories"), snap => {
      let arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });
    return () => unsub();
  }, []);

  // Load bank accounts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), snap => {
      let arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });
    return () => unsub();
  }, []);

  const updateCash = async val => {
    const cash = bankAccounts.find(b => b.type === "cash");
    await updateDoc(doc(db, "bankAccounts", cash.id), {
      balance: cash.balance + val
    });
  };

  const updateBank = async (bankId, val) => {
    const bank = bankAccounts.find(b => b.id === bankId);
    await updateDoc(doc(db, "bankAccounts", bankId), {
      balance: bank.balance + val
    });
  };

  const handleSave = async () => {
    if (!name || !amount || !category) return;

    const amt = Number(amount);

    // Deduct money from payment source
    if (paymentMode === "Cash") await updateCash(-amt);
    if (paymentMode === "Bank" && selectedBank)
      await updateBank(selectedBank, -amt);

    // Save new investment
    await addDoc(collection(db, "investments"), {
      name,
      category,
      amount: amt,
      date,
      note,
      paymentMode,
      bankId: selectedBank || null,
      sold: false,
      createdAt: new Date()
    });

    onClose();
  };

  return (
    <div style={{ width: 300, paddingBottom: 20 }}>
      <TextField
        label="Investment Name"
        fullWidth
        margin="dense"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <TextField
        label="Category"
        select
        fullWidth
        margin="dense"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        {categories.map(c => (
          <MenuItem key={c.id} value={c.name}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Amount"
        type="number"
        fullWidth
        margin="dense"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <TextField
        label="Date"
        type="date"
        fullWidth
        margin="dense"
        value={date}
        InputLabelProps={{ shrink: true }}
        onChange={e => setDate(e.target.value)}
      />

      <TextField
        label="Note (optional)"
        fullWidth
        margin="dense"
        value={note}
        onChange={e => setNote(e.target.value)}
      />

      <TextField
        label="Payment Mode"
        select
        fullWidth
        margin="dense"
        value={paymentMode}
        onChange={e => setPaymentMode(e.target.value)}
      >
        <MenuItem value="Cash">Cash</MenuItem>
        <MenuItem value="Bank">Bank</MenuItem>
      </TextField>

      {paymentMode === "Bank" && (
        <TextField
          label="Select Bank"
          select
          fullWidth
          margin="dense"
          value={selectedBank}
          onChange={e => setSelectedBank(e.target.value)}
        >
          {bankAccounts.map(b => (
            <MenuItem key={b.id} value={b.id}>
              {b.name} — ₹{b.balance}
            </MenuItem>
          ))}
        </TextField>
      )}

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={handleSave}
      >
        Save Investment
      </Button>
    </div>
  );
}
