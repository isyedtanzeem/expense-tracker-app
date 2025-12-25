import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
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
  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(null);

  // Load cards realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "creditCards"), (snapshot) => {
      let list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setCards(list);
    });
    return () => unsub();
  }, []);

  // Open Add Card Dialog
  const handleAdd = () => {
    setEditMode(false);
    setCardName("");
    setCardLimit("");
    setCurrentBalance("");
    setOpen(true);
  };

  // Open Edit Card Dialog
  const handleEdit = (card) => {
    setEditMode(true);
    setCardName(card.name);
    setCardLimit(card.limit);
    setCurrentBalance(card.currentBalance);
    setCurrentCardId(card.id);
    setOpen(true);
  };

  // Save or Update card
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
        name: cardName,
        limit: Number(cardLimit),
        currentBalance: Number(cardLimit) // default fully available
      });
    }

    setOpen(false);
  };

  // Delete card
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

            <Typography variant="body1">Limit: ₹{card.limit}</Typography>
            <Typography variant="body1">
              Available: ₹{card.currentBalance}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Used: ₹{card.limit - card.currentBalance}
            </Typography>

            <Button onClick={() => handleEdit(card)}>Edit</Button>
            <Button color="error" onClick={() => handleDelete(card.id)}>
              Delete
            </Button>

            {/* New Pay Bill Button */}
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

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {editMode ? "Edit Credit Card" : "Add Credit Card"}
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Card Name"
            fullWidth
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            margin="dense"
          />
          <TextField
            label="Card Limit"
            type="number"
            fullWidth
            value={cardLimit}
            onChange={(e) => setCardLimit(e.target.value)}
            margin="dense"
          />
          <TextField
            label="Current Balance (Available)"
            type="number"
            fullWidth
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            margin="dense"
            disabled={!editMode}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Credit Card Bill Dialog */}
      <PayCreditCardBill open={openPay} onClose={() => setOpenPay(false)} />
    </div>
  );
}
