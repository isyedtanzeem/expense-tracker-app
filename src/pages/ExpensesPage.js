import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Button, Card, CardContent, Typography } from "@mui/material";
import ExpenseForm from "../components/ExpenseForm";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Load expenses realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snapshot) => {
      let list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setExpenses(list);
    });
    return () => unsub();
  }, []);

  const handleEdit = (exp) => {
    setSelectedExpense(exp);
    setOpenForm(true);
  };

  const handleDelete = async (exp) => {
    if (!window.confirm("Delete this expense?")) return;

    // Reverse effect on bank balance
    if (exp.paymentMode === "Bank" && exp.bankId) {
      const bankRef = doc(db, "bankAccounts", exp.bankId);
      const newBal = exp.originalBankBalance + Number(exp.amount);
      await updateDoc(bankRef, { balance: newBal });
    }

    // Reverse effect on credit card
    if (exp.paymentMode === "Credit Card" && exp.cardId) {
      const cardRef = doc(db, "creditCards", exp.cardId);
      const newBal = exp.originalCardBalance + Number(exp.amount);
      await updateDoc(cardRef, { currentBalance: newBal });
    }

    await deleteDoc(doc(db, "expenses", exp.id));
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
              <Typography>{exp.category}</Typography>
              <Typography>Date: {exp.date}</Typography>
              <Typography>Payment: {exp.paymentMode}</Typography>
              {exp.description && <Typography>{exp.description}</Typography>}

              {/* Buttons */}
              <Button variant="text" onClick={() => handleEdit(exp)}>
                Edit
              </Button>
              <Button variant="text" color="error" onClick={() => handleDelete(exp)}>
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
