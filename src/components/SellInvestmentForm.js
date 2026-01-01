import React, { useEffect, useState } from "react";
import { TextField, Button, MenuItem } from "@mui/material";
import { db, auth } from "../firebase/firebase";
import {
  updateDoc,
  doc,
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

export default function SellInvestmentForm({ investment, onClose }) {
  const userId = auth.currentUser?.uid;

  const today = new Date().toISOString().split("T")[0];

  const [sellAmount, setSellAmount] = useState("");
  const [sellDate, setSellDate] = useState(today);

  const [mode, setMode] = useState("Cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");

  // ================================
  // LOAD ONLY USER'S BANK ACCOUNTS
  // ================================
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "bankAccounts"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, snap => {
      let list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setBankAccounts(list);
    });

    return () => unsub();
  }, [userId]);

  // ================================
  // BALANCE UPDATES
  // ================================
  const updateCash = async (val) => {
    const cash = bankAccounts.find(b => b.type === "cash");
    if (!cash) return;

    await updateDoc(doc(db, "bankAccounts", cash.id), {
      balance: cash.balance + val
    });
  };

  const updateBank = async (bankId, val) => {
    const bank = bankAccounts.find(b => b.id === bankId);
    if (!bank) return;

    await updateDoc(doc(db, "bankAccounts", bankId), {
      balance: bank.balance + val
    });
  };

  // ================================
  // SELL HANDLER
  // ================================
  const handleSell = async () => {
    const amt = Number(sellAmount);

    if (mode === "Cash") await updateCash(amt);
    if (mode === "Bank" && selectedBank) await updateBank(selectedBank, amt);

    await updateDoc(doc(db, "investments", investment.id), {
      sold: true,
      sellAmount: amt,
      sellDate,
      sellMode: mode,
      sellBankId: selectedBank || null,
      userId // keep ownership
    });

    onClose();
  };

  return (
    <div style={{ width: 300, paddingBottom: 20 }}>
      <TextField
        label="Sell Amount"
        type="number"
        fullWidth
        margin="dense"
        value={sellAmount}
        onChange={e => setSellAmount(e.target.value)}
      />

      <TextField
        label="Sell Date"
        type="date"
        fullWidth
        margin="dense"
        value={sellDate}
        InputLabelProps={{ shrink: true }}
        onChange={e => setSellDate(e.target.value)}
      />

      <TextField
        label="Receive Money In"
        select
        fullWidth
        margin="dense"
        value={mode}
        onChange={e => setMode(e.target.value)}
      >
        <MenuItem value="Cash">Cash</MenuItem>
        <MenuItem value="Bank">Bank</MenuItem>
      </TextField>

      {mode === "Bank" && (
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
        onClick={handleSell}
      >
        Confirm Sell
      </Button>
    </div>
  );
}
