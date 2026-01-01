import React, { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Button,
} from "@mui/material";

import { db, auth } from "../firebase/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";

export default function LendBorrowForm({ type, onClose }) {
  const userId = auth.currentUser?.uid; // 🔥 Logged-in user ID

  const [personName, setPersonName] = useState("");
  const [sourceName, setSourceName] = useState("");   // NEW FOR BORROWING

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [borrowMode, setBorrowMode] = useState("Cash");

  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");

  // ================================
  // 🔥 Load ONLY user’s bank accounts
  // ================================
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(
      collection(db, "bankAccounts"),
      (snap) => {
        let arr = [];
        snap.forEach((d) => {
          if (d.data().userId === userId) arr.push({ id: d.id, ...d.data() });
        });
        setBankAccounts(arr);
      }
    );

    return () => unsub();
  }, [userId]);

  // ================================
  // 🔥 Save Lend / Borrow
  // ================================
  const handleSave = async () => {
    if (!personName || !amount || !date) return;

    const amt = Number(amount);

    const record = {
      type,   // lend | borrow
      userId, // 🔥 Store user ID

      personName,
      sourceName: type === "borrow" ? sourceName : null,

      amount: amt,
      date,
      description,

      paymentMode: type === "lend" ? paymentMode : null,
      borrowMode: type === "borrow" ? borrowMode : null,

      bankId:
        type === "lend" && paymentMode === "Bank"
          ? selectedBank
          : type === "borrow" && borrowMode === "Bank"
          ? selectedBank
          : null,

      isSettled: false,
      settledDate: null,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "lendBorrow"), record);

    // ================================
    // 🔥 BANK BALANCE UPDATE LOGIC
    // ================================

    const bankRef =
      selectedBank ? doc(db, "bankAccounts", selectedBank) : null;

    // LENDING reduces balance
    if (type === "lend" && paymentMode === "Bank" && bankRef) {
      const bank = bankAccounts.find(b => b.id === selectedBank);
      await updateDoc(bankRef, { balance: bank.balance - amt });
    }

    // BORROWING increases balance
    if (type === "borrow" && borrowMode === "Bank" && bankRef) {
      const bank = bankAccounts.find(b => b.id === selectedBank);
      await updateDoc(bankRef, { balance: bank.balance + amt });
    }

    onClose();
  };

  return (
    <div style={{ width: 300, paddingTop: 10, paddingBottom: 20 }}>
      <TextField
        label={type === "lend" ? "Person Name" : "Borrowed From (Person)"}
        fullWidth
        margin="dense"
        value={personName}
        onChange={(e) => setPersonName(e.target.value)}
      />

      {/* --- NEW FOR BORROWING --- */}
      {type === "borrow" && (
        <TextField
          label="Source / Reason (Optional)"
          fullWidth
          margin="dense"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
        />
      )}

      <TextField
        label="Amount"
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
        value={date}
        InputLabelProps={{ shrink: true }}
        onChange={(e) => setDate(e.target.value)}
      />

      <TextField
        label="Description"
        fullWidth
        margin="dense"
        multiline
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* ========== LEND MODE ========= */}
      {type === "lend" && (
        <>
          <TextField
            label="Payment Mode"
            fullWidth
            select
            margin="dense"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
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
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              {bankAccounts.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name} — ₹{b.balance}
                </MenuItem>
              ))}
            </TextField>
          )}
        </>
      )}

      {/* ========== BORROW MODE ========= */}
      {type === "borrow" && (
        <>
          <TextField
            label="Borrow Mode"
            fullWidth
            select
            margin="dense"
            value={borrowMode}
            onChange={(e) => setBorrowMode(e.target.value)}
          >
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Bank">Bank</MenuItem>
          </TextField>

          {borrowMode === "Bank" && (
            <TextField
              label="Select Bank"
              select
              fullWidth
              margin="dense"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              {bankAccounts.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name} — ₹{b.balance}
                </MenuItem>
              ))}
            </TextField>
          )}
        </>
      )}

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={handleSave}
      >
        Save
      </Button>
    </div>
  );
}
