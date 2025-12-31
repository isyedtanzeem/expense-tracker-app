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
  IconButton,
  MenuItem
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

export default function SettingsPage() {
  // -------- EXPENSE CATEGORIES --------
  const [categories, setCategories] = useState([]);
  const [openCategory, setOpenCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // -------- PAYMENT MODES (Wallet, UPI, Online Services) --------
  const [paymentModes, setPaymentModes] = useState([]);
  const [openPayMode, setOpenPayMode] = useState(false);
  const [newPayMode, setNewPayMode] = useState({ name: "", balance: "", type: "Wallet" });

  // -------- INVESTMENT CATEGORIES --------
  const [invCategories, setInvCategories] = useState([]);
  const [openInvCategory, setOpenInvCategory] = useState(false);
  const [newInvCategory, setNewInvCategory] = useState("");

  // Load Expense Categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });
    return () => unsub();
  }, []);

  // Load Payment Modes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "paymentModes"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setPaymentModes(arr);
    });
    return () => unsub();
  }, []);

  // Load Investment Categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investmentCategories"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setInvCategories(arr);
    });
    return () => unsub();
  }, []);

  // ---------------- ADD CATEGORY ----------------
  const saveCategory = async () => {
    if (!newCategory) return;

    await addDoc(collection(db, "categories"), {
      name: newCategory
    });

    setNewCategory("");
    setOpenCategory(false);
  };

  // ---------------- ADD PAYMENT MODE ----------------
  const savePaymentMode = async () => {
    if (!newPayMode.name || newPayMode.balance === "") return;

    await addDoc(collection(db, "paymentModes"), {
      name: newPayMode.name,
      balance: Number(newPayMode.balance),
      type: newPayMode.type
    });

    setNewPayMode({ name: "", balance: "", type: "Wallet" });
    setOpenPayMode(false);
  };

  // ---------------- ADD INVESTMENT CATEGORY ----------------
  const saveInvCategory = async () => {
    if (!newInvCategory) return;

    await addDoc(collection(db, "investmentCategories"), {
      name: newInvCategory
    });

    setNewInvCategory("");
    setOpenInvCategory(false);
  };

  // ---------------- RESET ALL DATA ----------------
  const resetAllData = async () => {
    if (!window.confirm("⚠ This will delete ALL data permanently. Proceed?")) return;

    const collections = [
      "expenses",
      "bankAccounts",
      "creditCards",
      "incomes",
      "categories",
      "paymentModes",
      "investmentCategories",
      "investments",
      "loans",
      "loanPayments"
    ];

    for (let col of collections) {
      const unsub = onSnapshot(collection(db, col), async (snap) => {
        snap.forEach(async (d) => await deleteDoc(doc(db, col, d.id)));
      });
      unsub();
    }

    alert("All data wiped successfully.");
  };

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Settings
      </Typography>

      {/* ========================= */}
      {/* EXPENSE CATEGORIES */}
      {/* ========================= */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Expense Categories</Typography>

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

      {/* ========================= */}
      {/* PAYMENT MODES */}
      {/* ========================= */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Payment Modes (Wallet / UPI / Online)</Typography>

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
                <ListItemText
                  primary={mode.name}
                  secondary={`₹${mode.balance} • ${mode.type}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* ========================= */}
      {/* INVESTMENT CATEGORIES */}
      {/* ========================= */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6">Investment Categories</Typography>

          <Button
            variant="contained"
            style={{ marginTop: 10 }}
            onClick={() => setOpenInvCategory(true)}
          >
            Add Investment Category
          </Button>

          <List>
            {invCategories.map((cat) => (
              <ListItem
                key={cat.id}
                secondaryAction={
                  <IconButton onClick={() => deleteDoc(doc(db, "investmentCategories", cat.id))}>
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

      {/* ========================= */}
      {/* DANGER ZONE */}
      {/* ========================= */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Typography variant="h6" color="error">Danger Zone</Typography>

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
        <DialogTitle>Add Expense Category</DialogTitle>
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
          <Button variant="contained" onClick={saveCategory}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ADD PAYMENT MODE DIALOG */}
      <Dialog open={openPayMode} onClose={() => setOpenPayMode(false)}>
        <DialogTitle>Add Payment Mode</DialogTitle>
        <DialogContent>

          <TextField
            fullWidth
            label="Payment Mode Name"
            value={newPayMode.name}
            margin="dense"
            onChange={(e) => setNewPayMode({ ...newPayMode, name: e.target.value })}
          />

          <TextField
            fullWidth
            label="Initial Balance"
            type="number"
            margin="dense"
            value={newPayMode.balance}
            onChange={(e) => setNewPayMode({ ...newPayMode, balance: e.target.value })}
          />

          <TextField
            fullWidth
            select
            label="Type"
            margin="dense"
            value={newPayMode.type}
            onChange={(e) => setNewPayMode({ ...newPayMode, type: e.target.value })}
          >
            <MenuItem value="Wallet">Wallet</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="OnlineService">Online Service</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenPayMode(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePaymentMode}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ADD INVESTMENT CATEGORY DIALOG */}
      <Dialog open={openInvCategory} onClose={() => setOpenInvCategory(false)}>
        <DialogTitle>Add Investment Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Investment Category"
            value={newInvCategory}
            onChange={(e) => setNewInvCategory(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvCategory(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveInvCategory}>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
