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
  doc
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export default function InvestmentCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "investmentCategories"), snap => {
      let arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setCategories(arr);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!category) return;

    if (editMode) {
      await updateDoc(doc(db, "investmentCategories", selectedId), {
        name: category
      });
    } else {
      await addDoc(collection(db, "investmentCategories"), {
        name: category,
        createdAt: new Date()
      });
    }

    setOpen(false);
    setCategory("");
    setSelectedId(null);
    setEditMode(false);
  };

  const handleEdit = (c) => {
    setCategory(c.name);
    setSelectedId(c.id);
    setEditMode(true);
    setOpen(true);
  };

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

      {/* Add/Edit Dialog */}
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
