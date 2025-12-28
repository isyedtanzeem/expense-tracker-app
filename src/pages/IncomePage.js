import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";

import {
  Button,
  Card,
  CardContent,
  Typography
} from "@mui/material";

import IncomeForm from "../components/IncomeForm";

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incomes"), (snap) => {
      let list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setIncomes(list);
    });
    return () => unsub();
  }, []);

  const handleEdit = (inc) => {
    setSelectedIncome(inc);
    setOpenForm(true);
  };

  const handleDelete = async (inc) => {
    if (!window.confirm("Delete this income?")) return;
    await deleteDoc(doc(db, "incomes", inc.id));
  };

  return (
    <div>
      <Button
        variant="contained"
        onClick={() => {
          setSelectedIncome(null);
          setOpenForm(true);
        }}
      >
        Add Income
      </Button>

      {incomes
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((inc) => (
          <Card key={inc.id} style={{ marginTop: 16 }}>
            <CardContent>
              <Typography variant="h6">₹{inc.amount}</Typography>
              <Typography>Source: {inc.source}</Typography>
              <Typography>Date: {inc.date}</Typography>

              <Button onClick={() => handleEdit(inc)}>Edit</Button>
              <Button color="error" onClick={() => handleDelete(inc)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}

      <IncomeForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        income={selectedIncome}
      />
    </div>
  );
}
