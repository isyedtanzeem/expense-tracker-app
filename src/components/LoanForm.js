import React, { useEffect, useState } from "react";
import {
  TextField,
  Button
} from "@mui/material";

import {
  collection,
  addDoc,
  updateDoc,
  doc
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";

export default function LoanForm({ loan, onClose }) {
  const today = new Date().toISOString().split("T")[0];

  const [loanName, setLoanName] = useState("");
  const [lender, setLender] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [remaining, setRemaining] = useState("");
  const [emi, setEmi] = useState("");
  const [interest, setInterest] = useState("");
  const [nextEmiDate, setNextEmiDate] = useState(today);

  const isEdit = Boolean(loan);

  useEffect(() => {
    if (loan) {
      setLoanName(loan.loanName);
      setLender(loan.lender);
      setLoanAmount(loan.loanAmount);
      setRemaining(loan.remaining);
      setEmi(loan.emi);
      setInterest(loan.interest);
      setNextEmiDate(loan.nextEmiDate);
    } else {
      setLoanName("");
      setLender("");
      setLoanAmount("");
      setRemaining("");
      setEmi("");
      setInterest("");
      setNextEmiDate(today);
    }
  }, [loan]);

  const save = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return alert("User not logged in!");

    if (!loanName || !loanAmount || !emi) return;

    if (isEdit) {
      await updateDoc(doc(db, "loans", loan.id), {
        loanName,
        lender,
        loanAmount: Number(loanAmount),
        remaining: Number(remaining),
        emi: Number(emi),
        interest: Number(interest),
        nextEmiDate,
        userId       // 🔥 Ensures loan stays linked to user
      });
    } else {
      await addDoc(collection(db, "loans"), {
        loanName,
        lender,
        loanAmount: Number(loanAmount),
        remaining: Number(loanAmount),
        emi: Number(emi),
        interest: Number(interest),
        nextEmiDate,
        userId,      // 🔥 Saving with userId
        createdAt: new Date()
      });
    }

    onClose();
  };

  return (
    <div style={{ width: 320 }}>
      <TextField
        fullWidth
        label="Loan Name"
        margin="dense"
        value={loanName}
        onChange={(e) => setLoanName(e.target.value)}
      />

      <TextField
        fullWidth
        label="Lender (Bank/NBFC)"
        margin="dense"
        value={lender}
        onChange={(e) => setLender(e.target.value)}
      />

      <TextField
        fullWidth
        type="number"
        label="Loan Amount"
        margin="dense"
        value={loanAmount}
        onChange={(e) => setLoanAmount(e.target.value)}
      />

      <TextField
        fullWidth
        type="number"
        label="EMI Amount"
        margin="dense"
        value={emi}
        onChange={(e) => setEmi(e.target.value)}
      />

      <TextField
        fullWidth
        type="number"
        label="Interest Rate (%)"
        margin="dense"
        value={interest}
        onChange={(e) => setInterest(e.target.value)}
      />

      <TextField
        fullWidth
        type="date"
        label="Next EMI Date"
        margin="dense"
        InputLabelProps={{ shrink: true }}
        value={nextEmiDate}
        onChange={(e) => setNextEmiDate(e.target.value)}
      />

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={save}
      >
        Save
      </Button>
    </div>
  );
}
