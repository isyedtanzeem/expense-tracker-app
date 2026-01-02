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
  Box,
  Card,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSwipeable } from "react-swipeable";

import PayCreditCardBill from "../components/PayCreditCardBill";

const PAGE_SIZE = 15;

export default function CreditCards() {
  const userId = auth.currentUser?.uid;

  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [openDialog, setOpenDialog] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);

  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCard, setMenuCard] = useState(null);

  /* ---------------- LOAD USER CARDS ---------------- */
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "creditCards"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCards(list);
    });

    return () => unsub();
  }, [userId]);

  /* ---------------- FILTER + PAGINATION ---------------- */
  const filtered = cards.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* ---------------- MENU ---------------- */
  const openMenu = (e, card) => {
    setAnchorEl(e.currentTarget);
    setMenuCard(card);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuCard(null);
  };

  /* ---------------- ACTIONS ---------------- */
  const handleAdd = () => {
    setEditMode(false);
    setCurrentCard(null);
    setCardName("");
    setCardLimit("");
    setCurrentBalance("");
    setOpenDialog(true);
  };

  const handleEdit = () => {
    setEditMode(true);
    setCurrentCard(menuCard);
    setCardName(menuCard.name);
    setCardLimit(menuCard.limit);
    setCurrentBalance(menuCard.currentBalance);
    setOpenDialog(true);
    closeMenu();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this credit card?")) return;
    await deleteDoc(doc(db, "creditCards", menuCard.id));
    closeMenu();
  };

  const handleSave = async () => {
    if (!cardName || !cardLimit) return;

    if (editMode) {
      await updateDoc(doc(db, "creditCards", currentCard.id), {
        name: cardName,
        limit: Number(cardLimit),
        currentBalance: Number(currentBalance)
      });
    } else {
      await addDoc(collection(db, "creditCards"), {
        userId,
        name: cardName,
        limit: Number(cardLimit),
        currentBalance: Number(cardLimit),
        createdAt: new Date()
      });
    }

    setOpenDialog(false);
  };

  /* ---------------- TILE ---------------- */
  const CardTile = ({ card }) => {
    const used = card.limit - card.currentBalance;

    const swipeHandlers = useSwipeable({
      onSwipedRight: () => {
        setMenuCard(card);
        handleEdit();
      },
      onSwipedLeft: () => {
        setMenuCard(card);
        handleDelete();
      },
      trackMouse: true
    });

    return (
      <Card
        {...swipeHandlers}
        sx={{
          mb: 1.5,
          p: 1.5,
          borderRadius: 2,
          boxShadow: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          "&:hover": { boxShadow: 4 }
        }}
      >
        <Box>
          <Typography fontWeight={600}>{card.name}</Typography>
          <Typography color="text.secondary">
            Limit ₹{card.limit} • Used ₹{used}
          </Typography>
          <Typography color="primary">
            Available ₹{card.currentBalance}
          </Typography>
        </Box>

        <IconButton onClick={(e) => openMenu(e, card)}>
          <MoreVertIcon />
        </IconButton>
      </Card>
    );
  };

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Credit Cards</Typography>
        <Button variant="contained" onClick={handleAdd}>
          + Add
        </Button>
      </Box>

      {/* SEARCH */}
      <TextField
        fullWidth
        placeholder="Search card"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* LIST */}
      {paginated.map((card) => (
        <CardTile key={card.id} card={card} />
      ))}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, v) => setPage(v)}
          />
        </Box>
      )}

      {/* MENU */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={() => setOpenPay(true)}>Pay Bill</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "red" }}>
          Delete
        </MenuItem>
      </Menu>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PAY BILL */}
      <PayCreditCardBill
        open={openPay}
        onClose={() => setOpenPay(false)}
      />
    </Box>
  );
}
