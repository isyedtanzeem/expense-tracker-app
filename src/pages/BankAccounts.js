import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Button, Card, CardContent, Typography, Dialog, TextField, DialogActions, DialogTitle, DialogContent } from "@mui/material";

export default function BankAccounts() {
  const [banks, setBanks] = useState([]);
  const [open, setOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [balance, setBalance] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [currentBankId, setCurrentBankId] = useState(null);

  // Load banks realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snapshot) => {
      let list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setBanks(list);
    });
    return () => unsub();
  }, []);

  // Open Add Bank Dialog
  const handleAdd = () => {
    setEditMode(false);
    setBankName("");
    setBalance("");
    setOpen(true);
  };

  // Open Edit Bank Dialog
  const handleEdit = (bank) => {
    setEditMode(true);
    setBankName(bank.name);
    setBalance(bank.balance);
    setCurrentBankId(bank.id);
    setOpen(true);
  };

  // Save or Update bank
  const handleSave = async () => {
    if (!bankName || !balance) return;

    if (editMode) {
      await updateDoc(doc(db, "bankAccounts", currentBankId), {
        name: bankName,
        balance: Number(balance)
      });
    } else {
      await addDoc(collection(db, "bankAccounts"), {
        name: bankName,
        balance: Number(balance)
      });
    }

    setOpen(false);
  };

  // Delete bank
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "bankAccounts", id));
  };

  return (
    <div>
      <Button variant="contained" onClick={handleAdd}>
        Add Bank Account
      </Button>

      {banks.map((bank) => (
        <Card key={bank.id} style={{ marginTop: 16 }}>
          <CardContent>
            <Typography variant="h6">{bank.name}</Typography>
            <Typography variant="body1">Balance: ₹{bank.balance}</Typography>

            <Button onClick={() => handleEdit(bank)}>Edit</Button>
            <Button color="error" onClick={() => handleDelete(bank.id)}>Delete</Button>
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editMode ? "Edit Bank" : "Add Bank"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Bank Name"
            fullWidth
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            margin="dense"
          />
          <TextField
            label="Balance"
            fullWidth
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            margin="dense"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
