import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";

import {
  Button,
  Card,
  CardContent,
  Typography
} from "@mui/material";

import ExpenseForm from "../components/ExpenseForm";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  const userId = auth.currentUser?.uid;

  // -------------------------------
  // LOAD EXPENSES (USER ONLY)
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      let list = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) {
          list.push({ id: d.id, ...d.data() });
        }
      });
      setExpenses(list);
    });

    return () => unsub();
  }, [userId]);

  // -------------------------------
  // LOAD BANK ACCOUNTS (USER ONLY)
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) {
          arr.push({ id: d.id, ...d.data() });
        }
      });
      setBankAccounts(arr);
    });

    return () => unsub();
  }, [userId]);

  // -------------------------------
  // LOAD CREDIT CARDS (USER ONLY)
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "creditCards"), (snap) => {
      let arr = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) {
          arr.push({ id: d.id, ...d.data() });
        }
      });
      setCreditCards(arr);
    });

    return () => unsub();
  }, [userId]);

  // -------------------------------
  // LOAD CUSTOM PAYMENT MODES (USER ONLY)
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "paymentModes"), (snap) => {
      let arr = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) {
          arr.push({ id: d.id, ...d.data() });
        }
      });
      setPaymentModes(arr);
    });

    return () => unsub();
  }, [userId]);

  // ======================================
  // RESTORE BALANCES WHEN DELETING EXPENSE
  // ======================================
  const restoreBalance = async (exp) => {
    // BANK
    if (exp.paymentMode === "Bank" && exp.bankId) {
      const ref = doc(db, "bankAccounts", exp.bankId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const current = snap.data().balance;
      await updateDoc(ref, { balance: current + Number(exp.amount) });
    }

    // CREDIT CARD
    if (exp.paymentMode === "Credit Card" && exp.cardId) {
      const ref = doc(db, "creditCards", exp.cardId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const current = snap.data().currentBalance;
      await updateDoc(ref, { currentBalance: current + Number(exp.amount) });
    }

    // CUSTOM PAYMENT MODE
    if (
      exp.paymentMode &&
      !["Cash", "Bank", "Credit Card"].includes(exp.paymentMode)
    ) {
      const ref = doc(db, "paymentModes", exp.paymentMode);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const current = snap.data().balance;
      await updateDoc(ref, { balance: current + Number(exp.amount) });
    }
  };

  // ======================================
  // DELETE EXPENSE (USER SAFE)
  // ======================================
  const handleDelete = async (exp) => {
    if (!window.confirm("Delete this expense?")) return;

    // Prevent someone deleting another user's record
    if (exp.userId !== userId) {
      alert("Not allowed. This expense does not belong to you.");
      return;
    }

    await restoreBalance(exp);
    await deleteDoc(doc(db, "expenses", exp.id));
  };

  // ======================================
  // EDIT EXPENSE
  // ======================================
  const handleEdit = (exp) => {
    if (exp.userId !== userId) {
      alert("You cannot edit another user's expense.");
      return;
    }
    setSelectedExpense(exp);
    setOpenForm(true);
  };

  return (
    <div>
      <Button
        variant="contained"
        onClick={() => {
          setSelectedExpense(null);
          setOpenForm(true);
        }}
      >
        Add Expense
      </Button>

      {expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((exp) => (
          <Card key={exp.id} style={{ marginTop: 16 }}>
            <CardContent>
              <Typography variant="h6">₹{exp.amount}</Typography>
              <Typography>Category: {exp.category}</Typography>
              <Typography>Date: {exp.date}</Typography>

              {/* Payment Mode Display */}
              {exp.paymentMode && (
                <Typography>
                  Payment:{" "}
                  {exp.paymentMode === "Cash"
                    ? "Cash"
                    : exp.paymentMode === "Bank"
                    ? "Bank"
                    : exp.paymentMode === "Credit Card"
                    ? "Credit Card"
                    : paymentModes.find((p) => p.id === exp.paymentMode)?.name ||
                      "Wallet"}
                </Typography>
              )}

              {exp.description && (
                <Typography>Description: {exp.description}</Typography>
              )}

              <Button onClick={() => handleEdit(exp)}>Edit</Button>

              <Button color="error" onClick={() => handleDelete(exp)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}

      <ExpenseForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        expense={selectedExpense}
      />
    </div>
  );
}
