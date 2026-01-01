import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Typography
} from "@mui/material";

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

import { db, auth } from "../firebase/firebase";

export default function LoanPaymentForm({ loan, onClose }) {
  const [paymentMode, setPaymentMode] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashWallet, setCashWallet] = useState(null);
  const [bankId, setBankId] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const userId = auth.currentUser?.uid;

  // Load bank accounts + cash wallet only for this user
  useEffect(() => {
    if (!userId) return;

    // Bank Accounts
    onSnapshot(
      query(collection(db, "bankAccounts"), where("userId", "==", userId)),
      (snap) => {
        let arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setBankAccounts(arr);
      }
    );

    // Cash Wallet
    onSnapshot(
      query(collection(db, "appWallets"), where("userId", "==", userId)),
      (snap) => {
        if (!snap.empty) {
          setCashWallet({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      }
    );
  }, [userId]);

  // Ensure "Loan EMI" category exists per user
  const ensureLoanEmiCategory = async () => {
    const qSnap = await getDocs(
      query(
        collection(db, "categories"),
        where("name", "==", "Loan EMI"),
        where("userId", "==", userId)
      )
    );

    if (qSnap.empty) {
      await addDoc(collection(db, "categories"), {
        name: "Loan EMI",
        userId,
        createdAt: new Date()
      });
    }
  };

  // Perform EMI payment
  const pay = async () => {
    if (!paymentMode) return;

    await ensureLoanEmiCategory();

    // 1️⃣ Add EMI Payment Record
    await addDoc(collection(db, "loanPayments"), {
      loanId: loan.id,
      amount: loan.emi,
      date: today,
      paymentMode,
      bankId: bankId || null,
      userId,
      createdAt: new Date()
    });

    // 2️⃣ Update loan remaining
    const newRemaining = loan.remaining - loan.emi;

    await updateDoc(doc(db, "loans", loan.id), {
      remaining: newRemaining < 0 ? 0 : newRemaining,
      nextEmiDate: today,
      userId
    });

    // 3️⃣ Deduct from bank
    if (paymentMode === "Bank" && bankId) {
      const bank = bankAccounts.find((b) => b.id === bankId);
      if (bank) {
        await updateDoc(doc(db, "bankAccounts", bankId), {
          balance: bank.balance - loan.emi
        });
      }
    }

    // 4️⃣ Deduct from cash wallet
    if (paymentMode === "Cash" && cashWallet) {
      await updateDoc(doc(db, "appWallets", cashWallet.id), {
        cash: cashWallet.cash - loan.emi
      });
    }

    // 5️⃣ Record EMI as an expense
    await addDoc(collection(db, "expenses"), {
      amount: Number(loan.emi),
      category: "Loan EMI",
      description: `${loan.loanName} EMI Payment`,
      date: today,
      paymentMode,
      bankId: paymentMode === "Bank" ? bankId : null,
      cardId: null,
      loanId: loan.id,
      userId,
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
