import React, { useEffect, useState } from "react";
import { TextField, Button, MenuItem } from "@mui/material";
import { db } from "../firebase/firebase";
import { updateDoc, doc, collection, onSnapshot } from "firebase/firestore";

export default function SellInvestmentForm({ investment, onClose }) {
  const today = new Date().toISOString().split("T")[0];

  const [sellAmount, setSellAmount] = useState("");
  const [sellDate, setSellDate] = useState(today);

  const [mode, setMode] = useState("Cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");

  // Load bank accounts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), snap => {
      let list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setBankAccounts(list);
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

  const handleSell = async () => {
    const amt = Number(sellAmount);

    if (mode === "Cash") await updateCash(amt);
    if (mode === "Bank" && selectedBank) await updateBank(selectedBank, amt);

    await updateDoc(doc(db, "investments", investment.id), {
      sold: true,
      sellAmount: amt,
      sellDate,
      sellMode: mode,
      sellBankId: selectedBank || null
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

      <Button variant="contained" fullWidth style={{ marginTop: 16 }} onClick={handleSell}>
        Confirm Sell
      </Button>
    </div>
  );
}
