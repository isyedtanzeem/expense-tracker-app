import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Button, Card, CardContent, Typography } from "@mui/material";
import ExpenseForm from "../components/ExpenseForm";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [openForm, setOpenForm] = useState(false);

  // Load expenses realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snapshot) => {
      let list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setExpenses(list);
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <Button variant="contained" onClick={() => setOpenForm(true)}>
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
              {exp.description && (
                <Typography>Description: {exp.description}</Typography>
              )}
            </CardContent>
          </Card>
        ))}

      <ExpenseForm open={openForm} onClose={() => setOpenForm(false)} />
    </div>
  );
}
