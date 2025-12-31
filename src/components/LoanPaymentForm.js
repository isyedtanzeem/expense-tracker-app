import React, { useEffect, useState } from "react";
import { TextField, Button, MenuItem, Typography } from "@mui/material";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export default function LoanPaymentForm({ loan, onClose }) {
  const [paymentMode, setPaymentMode] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cash, setCash] = useState(0);
  const [bankId, setBankId] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Load bank accounts
  useEffect(() => {
    onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });

    // Load cash wallet
    onSnapshot(doc(db, "app", "wallet"), (snap) => {
      if (snap.exists()) setCash(snap.data().cash);
    });
  }, []);

  // Ensure "Loan EMI" category exists
  const ensureLoanEmiCategory = async () => {
    const qSnap = await getDocs(
      query(collection(db, "categories"), where("name", "==", "Loan EMI"))
    );

    if (qSnap.empty) {
      await addDoc(collection(db, "categories"), {
        name: "Loan EMI",
        createdAt: new Date()
      });
    }
  };

  const pay = async () => {
    if (!paymentMode) return;

    await ensureLoanEmiCategory();

    // 1️⃣ Record EMI payment
    await addDoc(collection(db, "loanPayments"), {
      loanId: loan.id,
      amount: loan.emi,
      date: today,
      paymentMode,
      bankId: bankId || null
    });

    // 2️⃣ Update loan remaining
    const newRemaining = loan.remaining - loan.emi;

    await updateDoc(doc(db, "loans", loan.id), {
      remaining: newRemaining < 0 ? 0 : newRemaining,
      nextEmiDate: today  // optionally set next EMI to today (or you can compute next month)
    });

    // 3️⃣ Deduct from bank
    if (paymentMode === "Bank") {
      const bankRef = doc(db, "bankAccounts", bankId);
      const bankData = bankAccounts.find((b) => b.id === bankId);
      const newBal = bankData.balance - loan.emi;
      await updateDoc(bankRef, { balance: newBal });
    }

    // 4️⃣ Deduct from cash
    if (paymentMode === "Cash") {
      await updateDoc(doc(db, "app", "wallet"), {
        cash: cash - loan.emi
      });
    }

    // 5️⃣ Create EXPENSE entry (EMI = Expense)
    await addDoc(collection(db, "expenses"), {
      amount: Number(loan.emi),
      category: "Loan EMI",
      description: `${loan.loanName} EMI Payment`,
      date: today,
      paymentMode,
      bankId: paymentMode === "Bank" ? bankId : null,
      cardId: null,
      loanId: loan.id,
      createdAt: new Date()
    });

    onClose();
  };

  return (
    <div style={{ width: 300 }}>
      <Typography>EMI: ₹{loan.emi}</Typography>

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
      </TextField>

      {paymentMode === "Bank" && (
        <TextField
          label="Select Bank"
          select
          fullWidth
          margin="dense"
          value={bankId}
          onChange={(e) => setBankId(e.target.value)}
        >
          {bankAccounts.map((bank) => (
            <MenuItem key={bank.id} value={bank.id}>
              {bank.name} — ₹{bank.balance}
            </MenuItem>
          ))}
        </TextField>
      )}

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={pay}
      >
        Pay EMI
      </Button>
    </div>
  );
}
