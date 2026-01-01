import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";

import {
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  TextField,
  DialogActions,
  DialogTitle,
  DialogContent
} from "@mui/material";

import PayCreditCardBill from "../components/PayCreditCardBill";

export default function CreditCards() {
  const userId = auth.currentUser?.uid;

  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(null);

  // Load ONLY this user's cards
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "creditCards"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCards(list);
    });

    return () => unsub();
  }, [userId]);

  // Add Card
  const handleAdd = () => {
    setEditMode(false);
    setCardName("");
    setCardLimit("");
    setCurrentBalance("");
    setOpen(true);
  };

  // Edit Card
  const handleEdit = (card) => {
    setEditMode(true);
    setCardName(card.name);
    setCardLimit(card.limit);
    setCurrentBalance(card.currentBalance);
    setCurrentCardId(card.id);
    setOpen(true);
  };

  // Save / Update
  const handleSave = async () => {
    if (!cardName || !cardLimit) return;

    if (editMode) {
      await updateDoc(doc(db, "creditCards", currentCardId), {
        name: cardName,
        limit: Number(cardLimit),
        currentBalance: Number(currentBalance)
      });
    } else {
      await addDoc(collection(db, "creditCards"), {
        userId,
        name: cardName,
        limit: Number(cardLimit),
        currentBalance: Number(cardLimit), // default = full limit usable
        createdAt: new Date()
      });
    }

    setOpen(false);
  };

  // Delete
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "creditCards", id));
  };

  return (
    <div>
      <Button variant="contained" onClick={handleAdd}>
        Add Credit Card
      </Button>

      {cards.map((card) => (
        <Card key={card.id} style={{ marginTop: 16 }}>
          <CardContent>
            <Typography variant="h6">{card.name}</Typography>

            <Typography>Limit: ₹{card.limit}</Typography>
            <Typography>Available: ₹{card.currentBalance}</Typography>
            <Typography color="text.secondary">
              Used: ₹{card.limit - card.currentBalance}
            </Typography>

            <Button onClick={() => handleEdit(card)}>Edit</Button>
            <Button color="error" onClick={() => handleDelete(card.id)}>
              Delete
            </Button>

            {/* Pay Bill */}
            <Button
              variant="outlined"
              style={{ marginLeft: 10 }}
              onClick={() => setOpenPay(true)}
            >
              Pay Bill
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Card Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {editMode ? "Edit Credit Card" : "Add Credit Card"}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Card Name"
            fullWidth
            margin="dense"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />

          <TextField
            label="Card Limit"
            type="number"
            fullWidth
            margin="dense"
            value={cardLimit}
            onChange={(e) => setCardLimit(e.target.value)}
          />

          <TextField
            label="Available Balance"
            type="number"
            fullWidth
            margin="dense"
            value={currentBalance}
            disabled={!editMode}
            onChange={(e) => setCurrentBalance(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Credit Card Bill */}
      <PayCreditCardBill open={openPay} onClose={() => setOpenPay(false)} />
    </div>
  );
}
