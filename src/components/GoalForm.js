import React, { useEffect, useState } from "react";
import {
  TextField,
  Button
} from "@mui/material";

import {
  collection,
  addDoc,
  updateDoc,
  doc
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export default function GoalForm({ goal, onClose }) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const isEdit = Boolean(goal);

  useEffect(() => {
    if (goal) {
      setName(goal.name || "");
      setTargetAmount(goal.targetAmount || "");
    } else {
      setName("");
      setTargetAmount("");
    }
  }, [goal]);

  const handleSave = async () => {
    if (!name || !targetAmount) return;

    if (isEdit) {
      // Update goal
      await updateDoc(doc(db, "investmentGoals", goal.id), {
        name,
        targetAmount: Number(targetAmount)
      });
    } else {
      // Create new goal
      await addDoc(collection(db, "investmentGoals"), {
        name,
        targetAmount: Number(targetAmount),
        createdAt: new Date()
      });
    }

    onClose();
  };

  return (
    <div style={{ width: 300, paddingBottom: 16 }}>
      <TextField
        fullWidth
        label="Goal Name"
        margin="dense"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <TextField
        fullWidth
        type="number"
        label="Target Amount (₹)"
        margin="dense"
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
      />

      <Button
        variant="contained"
        fullWidth
        style={{ marginTop: 16 }}
        onClick={handleSave}
      >
        {isEdit ? "Update Goal" : "Save Goal"}
      </Button>
    </div>
  );
}
