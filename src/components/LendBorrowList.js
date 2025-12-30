import React, { useState } from "react";
import {
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Card,
  CardContent
} from "@mui/material";

import { db } from "../firebase/firebase";
import {
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  collection
} from "firebase/firestore";

export default function LendBorrowList({ type, records }) {
  const [settleDialog, setSettleDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [selectedBank, setSelectedBank] = useState("");

  // Load bank accounts (only needed for settlement)
  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBankAccounts(arr);
    });
    return () => unsub();
  }, []);

  const filtered = records.filter((r) => r.type === type);

  const pending = filtered.filter((r) => !r.isSettled);
  const settled = filtered.filter((r) => r.isSettled);

  // Open Settlement Dialog
  const handleOpenSettle = (record) => {
    setSelectedRecord(record);
    setPaymentMode("Cash");
    setSelectedBank("");
    setSettleDialog(true);
  };

  // DELETE a record
  const handleDelete = async (record) => {
    if (!window.confirm("Delete this entry?")) return;

    await deleteDoc(doc(db, "lendBorrow", record.id));
  };

  // SETTLE the record
  const handleSettle = async () => {
    if (!selectedRecord) return;

    const today = new Date().toISOString().split("T")[0];

    // Update record in Firestore
    await updateDoc(doc(db, "lendBorrow", selectedRecord.id), {
      isSettled: true,
      settledDate: today,
    });

    // Bank Logic on settlement
    if (selectedRecord.type === "lend") {
      // You gave money → when settled, you RECEIVE MONEY
      if (paymentMode === "Bank" && selectedBank) {
        const bank = bankAccounts.find((b) => b.id === selectedBank);
        const newBal = bank.balance + selectedRecord.amount;

        await updateDoc(doc(db, "bankAccounts", selectedBank), {
          balance: newBal,
        });
      }
    } else if (selectedRecord.type === "borrow") {
      // You borrowed → when settled, YOU PAY BACK
      if (paymentMode === "Bank" && selectedBank) {
        const bank = bankAccounts.find((b) => b.id === selectedBank);
        const newBal = bank.balance - selectedRecord.amount;

        await updateDoc(doc(db, "bankAccounts", selectedBank), {
          balance: newBal,
        });
      }
    }

    setSettleDialog(false);
  };

  return (
    <div>
      {/* PENDING */}
      <Typography variant="h6" style={{ marginTop: 10 }}>
        Pending
      </Typography>
      <Divider style={{ marginBottom: 10 }} />

      {pending.length === 0 && <Typography>No pending entries.</Typography>}

      {pending.map((rec) => (
        <Card key={rec.id} style={{ marginBottom: 10 }}>
          <CardContent>
            <Typography variant="h6">
              {rec.personName} — ₹{rec.amount}
            </Typography>
            <Typography>Date: {rec.date}</Typography>
            {rec.description && (
              <Typography>Description: {rec.description}</Typography>
            )}

            <Button
              variant="outlined"
              onClick={() => handleOpenSettle(rec)}
              style={{ marginRight: 10, marginTop: 8 }}
            >
              Settle
            </Button>

            <Button
              variant="text"
              color="error"
              onClick={() => handleDelete(rec)}
            >
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* SETTLED */}
      <Typography variant="h6" style={{ marginTop: 20 }}>
        Settled
      </Typography>
      <Divider style={{ marginBottom: 10 }} />

      {settled.length === 0 && <Typography>No settled entries.</Typography>}

      {settled.map((rec) => (
        <Card key={rec.id} style={{ marginBottom: 10, background: "#e8f5e9" }}>
          <CardContent>
            <Typography variant="h6">
              {rec.personName} — ₹{rec.amount}
            </Typography>
            <Typography>Given: {rec.date}</Typography>
            <Typography>Settled: {rec.settledDate}</Typography>
            {rec.description && (
              <Typography>Description: {rec.description}</Typography>
            )}
          </CardContent>
        </Card>
      ))}

      {/* SETTLEMENT DIALOG */}
      <Dialog open={settleDialog} onClose={() => setSettleDialog(false)}>
        <DialogTitle>Settle Transaction</DialogTitle>

        <DialogContent>
          <Typography>
            Amount: <b>₹{selectedRecord?.amount}</b>
          </Typography>

          <TextField
            label={
              selectedRecord?.type === "lend"
                ? "Receive Money Mode"
                : "Pay Back Mode"
            }
            fullWidth
            select
            margin="dense"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Bank">Bank</MenuItem>
          </TextField>

          {paymentMode === "Bank" && (
            <TextField
              label="Select Bank"
              fullWidth
              select
              margin="dense"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              {bankAccounts.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name} — ₹{b.balance}
                </MenuItem>
              ))}
            </TextField>
          )}

          <DialogActions>
            <Button onClick={() => setSettleDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSettle}>
              Confirm Settlement
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
}
