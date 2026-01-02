import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc
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
  Divider,
  Pagination,
  Chip
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSwipeable } from "react-swipeable";
import IncomeForm from "../components/IncomeForm";

const PAGE_SIZE = 15;

/* ---------------- DATE HELPERS ---------------- */
const isToday = (dateStr) => {
  const d = new Date(dateStr);
  const t = new Date();
  return d.toDateString() === t.toDateString();
};

const isYesterday = (dateStr) => {
  const d = new Date(dateStr);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
};

export default function IncomePage() {
  const userId = auth.currentUser?.uid;

  const [incomes, setIncomes] = useState([]);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuIncome, setMenuIncome] = useState(null);

  const [page, setPage] = useState(1);

  /* ---------------- LOAD USER INCOMES ---------------- */
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "incomes"), (snap) => {
      const list = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) {
          list.push({ id: d.id, ...d.data() });
        }
      });
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setIncomes(list);
    });

    return () => unsub();
  }, [userId]);

  /* ---------------- SEARCH FILTER ---------------- */
  const filtered = incomes.filter((i) =>
    `${i.source} ${i.paymentMode || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ---------------- GROUPING ---------------- */
  const today = filtered.filter((i) => isToday(i.date));
  const yesterday = filtered.filter((i) => isYesterday(i.date));
  const older = filtered.filter(
    (i) => !isToday(i.date) && !isYesterday(i.date)
  );

  const grouped = [
    { label: "Today", data: today },
    { label: "Yesterday", data: yesterday },
    { label: "Older", data: older }
  ];

  /* ---------------- PAGINATION ---------------- */
  const flatList = grouped.flatMap((g) => g.data);
  const totalPages = Math.ceil(flatList.length / PAGE_SIZE);
  const paginated = flatList.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* ---------------- MENU ACTIONS ---------------- */
  const openMenu = (e, inc) => {
    setAnchorEl(e.currentTarget);
    setMenuIncome(inc);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuIncome(null);
  };

  const handleDelete = async () => {
    if (!menuIncome) return;
    if (!window.confirm("Delete this income?")) return;
    await deleteDoc(doc(db, "incomes", menuIncome.id));
    closeMenu();
  };

  const handleEdit = () => {
    setSelectedIncome(menuIncome);
    setOpenForm(true);
    closeMenu();
  };

  /* ---------------- RENDER TILE ---------------- */
  const IncomeTile = ({ inc }) => {
    const swipeHandlers = useSwipeable({
      onSwipedLeft: handleDelete,
      onSwipedRight: handleEdit,
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
          "&:hover": { boxShadow: 4 }
        }}
      >
        <Box>
          <Typography fontWeight={600} color="success.main">
            + ₹{inc.amount}
          </Typography>

          <Typography variant="body2">{inc.source}</Typography>

          <Typography variant="caption" display="block">
            {inc.date} • {inc.paymentMode}
          </Typography>

          {inc.bankId && (
            <Chip
              size="small"
              label="Bank"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>

        <IconButton onClick={(e) => openMenu(e, inc)}>
          <MoreVertIcon />
        </IconButton>
      </Card>
    );
  };

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Income</Typography>
        <Button variant="contained" onClick={() => setOpenForm(true)}>
          + Add
        </Button>
      </Box>

      {/* SEARCH */}
      <TextField
        fullWidth
        placeholder="Search by source or payment mode"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* GROUPED LIST */}
      {grouped.map(
        (group) =>
          group.data.length > 0 && (
            <Box key={group.label} mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {group.label}
              </Typography>
              <Divider sx={{ mb: 1 }} />

              {paginated
                .filter((i) => group.data.includes(i))
                .map((inc) => (
                  <IncomeTile key={inc.id} inc={inc} />
                ))}
            </Box>
          )
      )}

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

      {/* FORM */}
      <IncomeForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        income={selectedIncome}
      />
    </Box>
  );
}
