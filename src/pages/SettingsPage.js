import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

export default function SettingsPage() {
  const [categories, setCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  const [openCategory, setOpenCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [openPayMode, setOpenPayMode] = useState(false);
  const [newPayMode, setNewPayMode] = useState("");

  // Load categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });
    return () => unsub();
  }, []);

  // Load payment modes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "paymentModes"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setPaymentModes(arr);
    });
    return () => unsub();
  }, []);

  // Add Category
  const saveCategory = async () => {
    if (!newCategory) return;

    await addDoc(collection(db, "categories"), {
      name: newCategory
    });

    setNewCategory("");
    setOpenCategory(false);
  };

  // Add Payment Mode
  const savePaymentMode = async () => {
    if (!newPayMode) return;

    await addDoc(collection(db, "paymentModes"), {
      name: newPayMode
    });

    setNewPayMode("");
    setOpenPayMode(false);
  };

  // Reset all data
  const resetAllData = async () => {
    if (!window.confirm("Are you sure? This will delete ALL data!")) return;

    const collections = [
      "expenses",
      "bankAccounts",
      "creditCards",
      "ccPayments",
      "incomes",
      "categories",
      "paymentModes"
    ];

    for (let col of collections) {
      const snap = await onSnapshot(collection(db, col), () => {});
      snap.forEach(async (d) => await deleteDoc(doc(db, col, d.id)));
    }

    alert("All data cleared.");
  };

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Settings
      </Typography>

      {/* CATEGORY MANAGEMENT */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Manage Categories</Typography>
          <Button
            variant="contained"
            style={{ marginTop: 10 }}
            onClick={() => setOpenCategory(true)}
          >
            Add Category
          </Button>

          <List>
            {categories.map((cat) => (
              <ListItem
                key={cat.id}
                secondaryAction={
                  <IconButton onClick={() => deleteDoc(doc(db, "categories", cat.id))}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={cat.name} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* PAYMENT MODES */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Payment Modes</Typography>

          <Button
            variant="contained"
            style={{ marginTop: 10 }}
            onClick={() => setOpenPayMode(true)}
          >
            Add Payment Mode
          </Button>

          <List>
            {paymentModes.map((mode) => (
              <ListItem
                key={mode.id}
                secondaryAction={
                  <IconButton onClick={() => deleteDoc(doc(db, "paymentModes", mode.id))}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={mode.name} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* RESET ALL DATA */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6" color="error">
            Danger Zone
          </Typography>
          <Button
            variant="contained"
            color="error"
            style={{ marginTop: 10 }}
            onClick={resetAllData}
          >
            Reset All Data
          </Button>
        </CardContent>
      </Card>

      {/* ADD CATEGORY DIALOG */}
      <Dialog open={openCategory} onClose={() => setOpenCategory(false)}>
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategory(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCategory}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD PAYMENT MODE DIALOG */}
      <Dialog open={openPayMode} onClose={() => setOpenPayMode(false)}>
        <DialogTitle>Add Payment Mode</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Payment Mode"
            value={newPayMode}
            onChange={(e) => setNewPayMode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayMode(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePaymentMode}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
