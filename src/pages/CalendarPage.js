import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import {
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  IconButton
} from "@mui/material";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

/* ✅ LOCAL DATE FORMATTER (NO UTC) */
const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function CalendarPage() {
  const userId = auth.currentUser?.uid;

  const [expenses, setExpenses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayExpenses, setDayExpenses] = useState([]);

  /* ✅ Load ONLY logged-in user's expenses */
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setExpenses(arr);
    });

    return () => unsub();
  }, [userId]);

  /* ✅ Generate calendar days */
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++)
      days.push(new Date(year, month, d));

    return days;
  };

  /* ✅ Open day popup */
  const openDayDetails = (dateObj) => {
    const formatted = formatLocalDate(dateObj);

    const filtered = expenses.filter(
      (exp) => exp.date === formatted
    );

    setSelectedDate(dateObj);
    setDayExpenses(filtered);
    setOpen(true);
  };

  const days = getCalendarDays();

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Calendar View
      </Typography>

      {/* MONTH NAVIGATION */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <IconButton
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
        >
          <ArrowBackIosIcon />
        </IconButton>

        <Typography variant="h6" style={{ flexGrow: 1, textAlign: "center" }}>
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric"
          })}
        </Typography>

        <IconButton
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </div>

      {/* CALENDAR GRID */}
      <Card>
        <CardContent>
          {/* WEEK LABELS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: 10
            }}
          >
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* DAYS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8
            }}
          >
            {days.map((dateObj, index) => {
              if (!dateObj)
                return <div key={index} style={{ height: 60 }} />;

              const formatted = formatLocalDate(dateObj);

              const total = expenses
                .filter((e) => e.date === formatted)
                .reduce((sum, e) => sum + e.amount, 0);

              return (
                <div
                  key={index}
                  onClick={() => openDayDetails(dateObj)}
                  style={{
                    padding: 6,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    textAlign: "center",
                    cursor: "pointer",
                    background: total > 0 ? "#e3f2fd" : "#fafafa"
                  }}
                >
                  <Typography>{dateObj.getDate()}</Typography>

                  {total > 0 && (
                    <Typography
                      variant="caption"
                      style={{ color: "#1976d2", fontWeight: "bold" }}
                    >
                      ₹{total}
                    </Typography>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* DAY DETAILS */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {selectedDate
            ? selectedDate.toLocaleDateString()
            : "Expenses"}
        </DialogTitle>

        <DialogContent>
          {dayExpenses.length === 0 ? (
            <Typography>No expenses for this day.</Typography>
          ) : (
            <List>
              {dayExpenses.map((exp) => (
                <ListItem key={exp.id}>
                  <ListItemText
                    primary={`₹${exp.amount} • ${exp.category}`}
                    secondary={exp.description || ""}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
