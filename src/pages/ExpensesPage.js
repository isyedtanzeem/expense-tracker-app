import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";

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

  // Load expenses
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      let list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setExpenses(list);
    });
    return () => unsub();
  }, []);

  // Load bank accounts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });
    return () => unsub();
  }, []);

  // Load credit cards
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "creditCards"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCreditCards(arr);
    });
    return () => unsub();
  }, []);

  // Load custom payment modes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "paymentModes"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setPaymentModes(arr);
    });
    return () => unsub();
  }, []);

  // =======================
  //  REVERSE BALANCE LOGIC
  // =======================
  const restoreBalance = async (exp) => {
    // Case A: Restore Bank Balance
    if (exp.paymentMode === "Bank" && exp.bankId) {
      const ref = doc(db, "bankAccounts", exp.bankId);
      const snap = await getDoc(ref);
      const current = snap.data().balance;

      await updateDoc(ref, {
        balance: current + Number(exp.amount)
      });
    }

    // Case B: Restore Credit Card Balance
    if (exp.paymentMode === "Credit Card" && exp.cardId) {
      const ref = doc(db, "creditCards", exp.cardId);
      const snap = await getDoc(ref);
      const current = snap.data().currentBalance;

      await updateDoc(ref, {
        currentBalance: current + Number(exp.amount)
      });
    }

    // Case C: Restore Custom Payment Mode Balance
    if (
      exp.paymentMode &&
      !["Cash", "Bank", "Credit Card"].includes(exp.paymentMode)
    ) {
      const ref = doc(db, "paymentModes", exp.paymentMode);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const current = snap.data().balance;

        await updateDoc(ref, {
          balance: current + Number(exp.amount)
        });
      }
    }
  };

  // =======================
  //    DELETE EXPENSE
  // =======================
  const handleDelete = async (exp) => {
    if (!window.confirm("Delete this expense?")) return;

    // 1️⃣ Restore balance
    await restoreBalance(exp);

    // 2️⃣ Delete expense
    await deleteDoc(doc(db, "expenses", exp.id));
  };

  // =======================
  //       EDIT EXPENSE
  // =======================
  const handleEdit = (exp) => {
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

              {/* Payment Mode */}
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

              {/* Description */}
              {exp.description && (
                <Typography>Description: {exp.description}</Typography>
              )}

              {/* Buttons */}
              <Button onClick={() => handleEdit(exp)}>Edit</Button>
              <Button
                color="error"
                onClick={() => handleDelete(exp)}
              >
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
