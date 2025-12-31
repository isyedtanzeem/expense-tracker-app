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

import { db } from "../firebase/firebase";

import LoanForm from "../components/LoanForm";
import LoanPaymentForm from "../components/LoanPaymentForm";

export default function LoanPage() {
  const [loans, setLoans] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState(null);

  // Load loans
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "loans"), (snap) => {
      let arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setLoans(arr);
    });
    return () => unsub();
  }, []);

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

            {/* CLOSED LOAN DISPLAY */}
            {loan.closed && (
              <Typography style={{ color: "green", marginTop: 8 }}>
                Loan Closed on {loan.closedOn}
              </Typography>
            )}

            {/* PAY EMI BUTTON OR BLOCK IF CLOSED */}
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

            {/* EDIT */}
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

            {/* FORCE CLOSE */}
            {!loan.closed && (
              <Button
                style={{ marginTop: 10, marginRight: 8 }}
                variant="text"
                color="warning"
                onClick={async () => {
                  if (!window.confirm("Force close this loan? Remaining balance will be marked as settled.")) return;

                  await updateDoc(doc(db, "loans", loan.id), {
                    remaining: 0,
                    closed: true,
                    closedOn: new Date().toISOString().split("T")[0]
                  });
                }}
              >
                Force Close
              </Button>
            )}

            {/* DELETE LOAN */}
            <Button
              style={{ marginTop: 10 }}
              variant="text"
              color="error"
              onClick={async () => {
                if (!window.confirm("Delete this loan? This will also delete all its EMI payments.")) return;

                // Delete loan
                await deleteDoc(doc(db, "loans", loan.id));

                // Delete all linked EMI payments
                const qSnap = await getDocs(
                  query(
                    collection(db, "loanPayments"),
                    where("loanId", "==", loan.id)
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

      {/* ADD/EDIT Loan Form */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <DialogTitle>{selectedLoan ? "Edit Loan" : "Add Loan"}</DialogTitle>
        <DialogContent>
          <LoanForm loan={selectedLoan} onClose={() => setOpenForm(false)} />
        </DialogContent>
      </Dialog>

      {/* PAY EMI */}
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
