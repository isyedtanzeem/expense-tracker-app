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
  Chip,
  TextField,
  Divider,
  Pagination
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpenseForm from "../components/ExpenseForm";
import { useSwipeable } from "react-swipeable";

const PAGE_SIZE = 15;

/* ---------------- CATEGORY COLORS ---------------- */
const CATEGORY_COLORS = [
  "#1976d2", "#9c27b0", "#2e7d32",
  "#ed6c02", "#d32f2f", "#0288d1",
  "#6d4c41", "#455a64"
];

const getCategoryColor = (category = "") => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

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

export default function ExpensesPage() {
  const userId = auth.currentUser?.uid;

  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuExpense, setMenuExpense] = useState(null);

  const [page, setPage] = useState(1);

  /* ---------------- LOAD USER EXPENSES ---------------- */
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      const list = [];
      snap.forEach((d) => {
        if (d.data().userId === userId) {
          list.push({ id: d.id, ...d.data() });
        }
      });
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(list);
    });

    return () => unsub();
  }, [userId]);

  /* ---------------- SEARCH FILTER ---------------- */
  const filtered = expenses.filter((e) =>
    `${e.category} ${e.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ---------------- GROUPING ---------------- */
  const today = filtered.filter((e) => isToday(e.date));
  const yesterday = filtered.filter((e) => isYesterday(e.date));
  const older = filtered.filter(
    (e) => !isToday(e.date) && !isYesterday(e.date)
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
  const openMenu = (e, exp) => {
    setAnchorEl(e.currentTarget);
    setMenuExpense(exp);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuExpense(null);
  };

  const handleDelete = async () => {
    if (!menuExpense) return;
    if (!window.confirm("Delete this expense?")) return;
    await deleteDoc(doc(db, "expenses", menuExpense.id));
    closeMenu();
  };

  const handleEdit = () => {
    setSelectedExpense(menuExpense);
    setOpenForm(true);
    closeMenu();
  };

  /* ---------------- RENDER TILE ---------------- */
  const ExpenseTile = ({ exp }) => {
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
          <Typography fontWeight={600}>₹{exp.amount}</Typography>

          <Chip
            size="small"
            label={exp.category}
            sx={{
              mt: 0.5,
              mb: 0.5,
              backgroundColor: getCategoryColor(exp.category),
              color: "#fff"
            }}
          />

          <Typography variant="caption" display="block">
            {exp.date} • {exp.paymentMode}
          </Typography>

          {exp.description && (
            <Typography variant="body2">{exp.description}</Typography>
          )}
        </Box>

        <IconButton onClick={(e) => openMenu(e, exp)}>
          <MoreVertIcon />
        </IconButton>
      </Card>
    );
  };

  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Expenses</Typography>
        <Button variant="contained" onClick={() => setOpenForm(true)}>
          + Add
        </Button>
      </Box>

      {/* SEARCH */}
      <TextField
        fullWidth
        placeholder="Search by category or description"
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
                .filter((e) => group.data.includes(e))
                .map((exp) => (
                  <ExpenseTile key={exp.id} exp={exp} />
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
      <ExpenseForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        expense={selectedExpense}
      />
    </Box>
  );
}
