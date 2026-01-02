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
  Divider,
  Pagination
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSwipeable } from "react-swipeable";

const PAGE_SIZE = 15;

export default function BankAccounts() {
  const userId = auth.currentUser?.uid;

  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBank, setCurrentBank] = useState(null);
  const [bankName, setBankName] = useState("");
  const [balance, setBalance] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuBank, setMenuBank] = useState(null);

  /* ---------------- LOAD USER BANKS ---------------- */
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "bankAccounts"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setBanks(list);
    });

    return () => unsub();
  }, [userId]);

  /* ---------------- FILTER + PAGINATION ---------------- */
  const filtered = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* ---------------- MENU ---------------- */
  const openMenu = (e, bank) => {
    setAnchorEl(e.currentTarget);
    setMenuBank(bank);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuBank(null);
  };

  /* ---------------- ACTIONS ---------------- */
  const handleAdd = () => {
    setEditMode(false);
    setCurrentBank(null);
    setBankName("");
    setBalance("");
    setOpenDialog(true);
  };

  const handleEdit = () => {
    setEditMode(true);
    setCurrentBank(menuBank);
    setBankName(menuBank.name);
    setBalance(menuBank.balance);
    setOpenDialog(true);
    closeMenu();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this bank account?")) return;
    await deleteDoc(doc(db, "bankAccounts", menuBank.id));
    closeMenu();
  };

  const handleSave = async () => {
    if (!bankName || balance === "") return;

    if (editMode) {
      await updateDoc(doc(db, "bankAccounts", currentBank.id), {
        name: bankName,
        balance: Number(balance)
      });
    } else {
      await addDoc(collection(db, "bankAccounts"), {
        name: bankName,
        balance: Number(balance),
        type: "bank",
        userId,
        createdAt: new Date()
      });
    }

    setOpenDialog(false);
  };

  /* ---------------- TILE ---------------- */
  const BankTile = ({ bank }) => {
    const swipeHandlers = useSwipeable({
      onSwipedRight: () => {
        setMenuBank(bank);
        handleEdit();
      },
      onSwipedLeft: () => {
        setMenuBank(bank);
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
          <Typography fontWeight={600}>{bank.name}</Typography>
          <Typography color="text.secondary">
            Balance: ₹{bank.balance}
          </Typography>
        </Box>

        <IconButton onClick={(e) => openMenu(e, bank)}>
          <MoreVertIcon />
        </IconButton>
      </Card>
    );
  };

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Bank Accounts</Typography>
        <Button variant="contained" onClick={handleAdd}>
          + Add
        </Button>
      </Box>

      {/* SEARCH */}
      <TextField
        fullWidth
        placeholder="Search bank"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* LIST */}
      {paginated.map((bank) => (
        <BankTile key={bank.id} bank={bank} />
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
        <MenuItem onClick={handleDelete} sx={{ color: "red" }}>
          Delete
        </MenuItem>
      </Menu>

      {/* DIALOG */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editMode ? "Edit Bank" : "Add Bank"}</DialogTitle>

        <DialogContent>
          <TextField
            label="Bank Name"
            fullWidth
            margin="dense"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <TextField
            label="Balance"
            type="number"
            fullWidth
            margin="dense"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
