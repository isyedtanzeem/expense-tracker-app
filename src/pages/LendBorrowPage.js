import React, { useEffect, useState } from "react";
import {
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";

import { db, auth } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

import LendBorrowForm from "../components/LendBorrowForm";
import LendBorrowList from "../components/LendBorrowList";

export default function LendBorrowPage() {
  const userId = auth.currentUser?.uid; // 🔥 ACTIVE USER

  const [tab, setTab] = useState(0); // 0 = Lend, 1 = Borrow
  const [records, setRecords] = useState([]);
  const [openForm, setOpenForm] = useState(false);

  // ===============================
  // 🔥 Load only this user's lend/borrow entries
  // ===============================
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(collection(db, "lendBorrow"), (snap) => {
      let arr = [];

      snap.forEach((d) => {
        if (d.data().userId === userId) {
          arr.push({ id: d.id, ...d.data() });
        }
      });

      setRecords(arr);
    });

    return () => unsub();
  }, [userId]);

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Lending & Borrowing
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        centered
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Lending" />
        <Tab label="Borrowing" />
      </Tabs>

      {/* Add New Entry */}
      <Button
        variant="contained"
        fullWidth
        onClick={() => setOpenForm(true)}
        style={{ marginTop: 16 }}
      >
        {tab === 0 ? "Add Lending" : "Add Borrowing"}
      </Button>

      {/* List */}
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          <LendBorrowList
            type={tab === 0 ? "lend" : "borrow"}
            records={records}
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      {openForm && (
        <Dialog open={openForm} onClose={() => setOpenForm(false)}>
          <DialogTitle>
            {tab === 0 ? "Add Lending" : "Add Borrowing"}
          </DialogTitle>

          <DialogContent>
            <LendBorrowForm
              type={tab === 0 ? "lend" : "borrow"}
              onClose={() => setOpenForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
