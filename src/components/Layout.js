import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EventIcon from "@mui/icons-material/Event";

import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  // Load logged-in user name
  useEffect(() => {
    const loadUser = async () => {
      if (!auth.currentUser) return;

      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUserData(snap.data());
      }
    };

    loadUser();
  }, []);

  const menuItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { label: "Expenses", icon: <ReceiptLongIcon />, path: "/expenses" },
    { label: "Accounts", icon: <AccountBalanceIcon />, path: "/accounts" },
    { label: "Cards", icon: <CreditCardIcon />, path: "/cards" },
    { label: "Budget", icon: <BarChartIcon />, path: "/budget" },
    { label: "Income", icon: <BarChartIcon />, path: "/income" },
    { label: "Calendar", icon: <EventIcon />, path: "/calendar" },
    { label: "Lend / Borrow", icon: <PeopleIcon />, path: "/lendborrow" },
    { label: "Cash", icon: <AccountBalanceWalletIcon />, path: "/cash" },
    { label: "Investments", icon: <BarChartIcon />, path: "/investments" },
    { label: "Loans", icon: <AccountBalanceIcon />, path: "/loans" },
    { label: "Settings", icon: <SettingsIcon />, path: "/settings" }
  ];

  return (
    <div style={{ paddingBottom: "0px" }}>
      
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setOpen(true)}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6">My Expense App</Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <div style={{ width: 260 }}>
          
          {/* USER INFO */}
          <div style={{ padding: 16 }}>
            <Typography variant="h6">
              {userData ? userData.name : "Loading..."}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {auth.currentUser?.email}
            </Typography>
          </div>

          <Divider />

          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
              >
                {item.icon}
                <ListItemText primary={item.label} style={{ marginLeft: 16 }} />
              </ListItem>
            ))}

            <Divider style={{ marginTop: 10 }} />

            {/* LOGOUT WITH ICON */}
            <ListItem
              button
              onClick={() => {
                signOut(auth);
                navigate("/login");
              }}
            >
              <LogoutIcon style={{ marginRight: 10, color: "red" }} />
              <ListItemText primary="Logout" style={{ color: "red" }} />
            </ListItem>
          </List>
        </div>
      </Drawer>

      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
