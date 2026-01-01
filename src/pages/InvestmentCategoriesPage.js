import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";

export default function InvestmentCategoriesPage() {
  const userId = auth.currentUser?.uid;

  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // =====================================================
  // 🔥 Load ONLY categories belonging to logged-in user
  // =====================================================
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "investmentCategories"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, snap => {
      let arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });

    return () => unsub();
  }, [userId]);

  // =====================================================
  // SAVE / UPDATE CATEGORY
  // =====================================================
  const handleSave = async () => {
    if (!category) return;

    if (editMode) {
      await updateDoc(doc(db, "investmentCategories", selectedId), {
        name: category,
        userId
      });
    } else {
      await addDoc(collection(db, "investmentCategories"), {
        name: category,
        userId,
        createdAt: new Date()
      });
    }

    setOpen(false);
    setCategory("");
    setSelectedId(null);
    setEditMode(false);
  };

  // Edit
  const handleEdit = (c) => {
    setCategory(c.name);
    setSelectedId(c.id);
    setEditMode(true);
    setOpen(true);
  };

  // Delete
  const handleDelete = async (c) => {
    if (!window.confirm("Delete category?")) return;

    await deleteDoc(doc(db, "investmentCategories", c.id));
  };

  return (
    <div>
      <Typography variant="h5">Investment Categories</Typography>

      <Button
        variant="contained"
        style={{ marginTop: 16 }}
        onClick={() => {
          setEditMode(false);
          setCategory("");
          setOpen(true);
        }}
      >
        Add Category
      </Button>

      {categories.map(cat => (
        <Card key={cat.id} style={{ marginTop: 16 }}>
          <CardContent>
            <Typography>{cat.name}</Typography>

            <Button onClick={() => handleEdit(cat)}>Edit</Button>
            <Button color="error" onClick={() => handleDelete(cat)}>
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {editMode ? "Edit Category" : "Add Category"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="Category Name"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editMode ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
