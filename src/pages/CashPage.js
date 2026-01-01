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

import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  where
} from "firebase/firestore";

import CashForm from "../components/CashForm";

export default function CashPage() {
  const [cash, setCash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("deposit");

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // 🔥 Listen only to this user's cash wallet
    const q = query(
      collection(db, "bankAccounts"),
      where("userId", "==", userId),
      where("type", "==", "cash")
    );

    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        // ➕ Auto-create wallet for new users
        await addDoc(collection(db, "bankAccounts"), {
          userId,
          name: "Cash Wallet",
          type: "cash",
          balance: 0,
          createdAt: new Date()
        });
        return;
      }

      let walletDoc = null;
      snap.forEach((d) => (walletDoc = { id: d.id, ...d.data() }));
      setCash(walletDoc);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

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

      {/* POPUP FORM */}
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
