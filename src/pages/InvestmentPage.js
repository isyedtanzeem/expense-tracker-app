import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Pagination,
  Chip
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";

import InvestmentForm from "../components/InvestmentForm";
import SellInvestmentForm from "../components/SellInvestmentForm";

const PAGE_SIZE = 15;

export default function InvestmentPage() {
  const userId = auth.currentUser?.uid;

  const [investments, setInvestments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openSell, setOpenSell] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuInv, setMenuInv] = useState(null);

  /* ---------------- LOAD INVESTMENTS ---------------- */
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "investments"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setInvestments(arr);
    });

    return () => unsub();
  }, [userId]);

  /* ---------------- LOAD BANKS ---------------- */
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "bankAccounts"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });

    return () => unsub();
  }, [userId]);

  /* ---------------- FILTER + PAGINATION ---------------- */
  const filtered = investments.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* ---------------- MENU ---------------- */
  const openMenu = (e, inv) => {
    setAnchorEl(e.currentTarget);
    setMenuInv(inv);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuInv(null);
  };

  /* ---------------- DELETE + RESTORE ---------------- */
  const handleDelete = async () => {
    if (!window.confirm("Delete this investment?")) return;

    const inv = menuInv;
    const amt = inv.amount;

    if (inv.paymentMode === "Cash") {
      const cash = bankAccounts.find((b) => b.type === "cash");
      if (cash) {
        await updateDoc(doc(db, "bankAccounts", cash.id), {
          balance: cash.balance + amt
        });
      }
    }

    if (inv.paymentMode === "Bank" && inv.bankId) {
      const bank = bankAccounts.find((b) => b.id === inv.bankId);
      if (bank) {
        await updateDoc(doc(db, "bankAccounts", inv.bankId), {
          balance: bank.balance + amt
        });
      }
    }

    await deleteDoc(doc(db, "investments", inv.id));
    closeMenu();
  };

  /* ---------------- TILE ---------------- */
  const InvestmentTile = ({ inv }) => (
    <Card
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
        <Typography fontWeight={600}>{inv.name}</Typography>

        <Box display="flex" gap={1} mt={0.5}>
          <Chip label={inv.category} size="small" />
          {inv.sold && (
            <Chip
              label="Sold"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        <Typography color="text.secondary" mt={0.5}>
          ₹{inv.amount} • {inv.date}
        </Typography>

        {inv.sold && (
          <Typography color="success.main">
            Sold ₹{inv.sellAmount} on {inv.sellDate}
          </Typography>
        )}
      </Box>

      <IconButton onClick={(e) => openMenu(e, inv)}>
        <MoreVertIcon />
      </IconButton>
    </Card>
  );

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Investments</Typography>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          + Add
        </Button>
      </Box>

      {/* SEARCH */}
      <TextField
        fullWidth
        placeholder="Search by name or category"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* LIST */}
      {paginated.map((inv) => (
        <InvestmentTile key={inv.id} inv={inv} />
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
        {!menuInv?.sold && (
          <MenuItem
            onClick={() => {
              setSelectedInvestment(menuInv);
              setOpenSell(true);
              closeMenu();
            }}
          >
            Sell
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: "red" }}>
          Delete
        </MenuItem>
      </Menu>

      {/* ADD INVESTMENT */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add Investment</DialogTitle>
        <DialogContent>
          <InvestmentForm onClose={() => setOpenAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* SELL INVESTMENT */}
      <Dialog open={openSell} onClose={() => setOpenSell(false)}>
        <DialogTitle>Sell Investment</DialogTitle>
        <DialogContent>
          <SellInvestmentForm
            investment={selectedInvestment}
            onClose={() => setOpenSell(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
