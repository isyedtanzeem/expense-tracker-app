import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

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
  IconButton,
} from "@mui/material";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function CalendarPage() {
  const [expenses, setExpenses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // shown month
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayExpenses, setDayExpenses] = useState([]);

  // Load expenses realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "expenses"), (snap) => {
      let arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setExpenses(arr);
    });
    return () => unsub();
  }, []);

  // Get YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // first day of month
    const firstDay = new Date(year, month, 1);
    // last day of month
    const lastDay = new Date(year, month + 1, 0);

    // day of week (0 = Sun)
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // empty cells before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // push actual days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  // Click a date cell
  const openDayDetails = (dateObj) => {
    const formatted = formatDate(dateObj);

    const filtered = expenses.filter((exp) => exp.date === formatted);
    setDayExpenses(filtered);
    setSelectedDate(dateObj);
    setOpen(true);
  };

  const days = getCalendarDays();

  return (
    <div>
      <Typography variant="h5" style={{ marginBottom: 16 }}>
        Calendar View
      </Typography>

      {/* Month Navigation */}
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
            year: "numeric",
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

      {/* Calendar Grid */}
      <Card>
        <CardContent>
          {/* Day labels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: 10,
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

          {/* Actual dates */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
            }}
          >
            {days.map((dateObj, index) => {
              if (!dateObj)
                return <div key={index} style={{ height: 60 }}></div>;

              const formatted = formatDate(dateObj);

              const total = expenses
                .filter((exp) => exp.date === formatted)
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
                    background: total > 0 ? "#e3f2fd" : "#fafafa",
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

      {/* Dialog showing expenses for a day */}
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
                    primary={`₹${exp.amount} — ${exp.category}`}
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
