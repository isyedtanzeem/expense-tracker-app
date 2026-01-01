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

import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";

import LoanForm from "../components/LoanForm";
import LoanPaymentForm from "../components/LoanPaymentForm";

export default function LoanPage() {
  const [loans, setLoans] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState(null);

  const userId = auth.currentUser?.uid;

  // 🔥 Load loans only for the logged-in user
  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "loans"), where("userId", "==", userId));

    const unsub = onSnapshot(q, (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setLoans(arr);
    });

    return () => unsub();
  }, [userId]);

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Loans
      </Typography>

      <Button
        variant="contained"
        onClick={() => {
          setSelectedLoan(null);
          setOpenForm(true);
        }}
      >
        Add Loan
      </Button>

      {loans.map((loan) => (
        <Card key={loan.id} style={{ marginTop: 16 }}>
          <CardContent>
            <Typography variant="h6">{loan.loanName}</Typography>
            <Typography>Lender: {loan.lender}</Typography>
            <Typography>Loan Amount: ₹{loan.loanAmount}</Typography>
            <Typography>Remaining: ₹{loan.remaining}</Typography>
            <Typography>EMI: ₹{loan.emi}</Typography>
            <Typography>Interest Rate: {loan.interest}%</Typography>
            <Typography>Next EMI: {loan.nextEmiDate}</Typography>

            {loan.closed && (
              <Typography style={{ color: "green", marginTop: 8 }}>
                Loan Closed on {loan.closedOn}
              </Typography>
            )}

            {!loan.closed ? (
              <Button
                style={{ marginTop: 10, marginRight: 8 }}
                variant="outlined"
                onClick={() => {
                  setSelectedLoan(loan);
                  setOpenPayment(true);
                }}
              >
                Pay EMI
              </Button>
            ) : (
              <Typography style={{ marginTop: 10, color: "green" }}>
                EMI Payments Disabled (Closed)
              </Typography>
            )}

            <Button
              style={{ marginTop: 10, marginRight: 8 }}
              variant="text"
              onClick={() => {
                setSelectedLoan(loan);
                setOpenForm(true);
              }}
            >
              Edit
            </Button>

            {!loan.closed && (
              <Button
                style={{ marginTop: 10, marginRight: 8 }}
                variant="text"
                color="warning"
                onClick={async () => {
                  if (!window.confirm("Force close this loan?")) return;

                  await updateDoc(doc(db, "loans", loan.id), {
                    remaining: 0,
                    closed: true,
                    closedOn: new Date().toISOString().split("T")[0],
                    userId
                  });
                }}
              >
                Force Close
              </Button>
            )}

            <Button
              style={{ marginTop: 10 }}
              variant="text"
              color="error"
              onClick={async () => {
                if (!window.confirm("Delete this loan and all EMI records?"))
                  return;

                await deleteDoc(doc(db, "loans", loan.id));

                // Delete EMI entries linked to this loan
                const qSnap = await getDocs(
                  query(
                    collection(db, "loanPayments"),
                    where("loanId", "==", loan.id),
                    where("userId", "==", userId)
                  )
                );

                qSnap.forEach(async (d) => {
                  await deleteDoc(doc(db, "loanPayments", d.id));
                });
              }}
            >
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Add / Edit Loan */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <DialogTitle>{selectedLoan ? "Edit Loan" : "Add Loan"}</DialogTitle>
        <DialogContent>
          <LoanForm loan={selectedLoan} onClose={() => setOpenForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Pay EMI Dialog */}
      <Dialog open={openPayment} onClose={() => setOpenPayment(false)}>
        <DialogTitle>Pay EMI</DialogTitle>
        <DialogContent>
          <LoanPaymentForm
            loan={selectedLoan}
            onClose={() => setOpenPayment(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
