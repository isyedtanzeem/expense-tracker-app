import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";

import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  addDoc
} from "firebase/firestore";

import CashForm from "../components/CashForm";

export default function CashPage() {
  const [cash, setCash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("deposit");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bankAccounts"), async (snap) => {
      let list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      let cashWallet = list.find((b) => b.type === "cash");

      // CREATE CASH WALLET IF NOT FOUND
      if (!cashWallet) {
        await addDoc(collection(db, "bankAccounts"), {
          name: "Cash Wallet",
          type: "cash",
          balance: 0,
          createdAt: new Date()
        });
        return;
      }

      setCash(cashWallet);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <Typography>Loading Cash Wallet...</Typography>;

  return (
    <div>
      <Typography variant="h5">Cash Wallet</Typography>

      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <Typography variant="h6">Available Cash</Typography>
          <Typography variant="h3">₹{cash.balance}</Typography>

          <Button
            variant="contained"
            fullWidth
            style={{ marginTop: 16 }}
            onClick={() => {
              setMode("deposit");
              setOpen(true);
            }}
          >
            Deposit Cash
          </Button>

          <Button
            variant="outlined"
            fullWidth
            style={{ marginTop: 10 }}
            onClick={() => {
              setMode("withdraw");
              setOpen(true);
            }}
          >
            Withdraw Cash
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {mode === "deposit" ? "Deposit Cash" : "Withdraw Cash"}
        </DialogTitle>

        <DialogContent>
          <CashForm
            mode={mode}
            cash={cash}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
