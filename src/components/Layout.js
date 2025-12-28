import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";

import { useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Menu List Items
  const menuItems = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { label: "Expenses", icon: <ReceiptLongIcon />, path: "/expenses" },
    { label: "Accounts", icon: <AccountBalanceIcon />, path: "/accounts" },
    { label: "Cards", icon: <CreditCardIcon />, path: "/cards" },
    { label: "Budget", icon: <BarChartIcon />, path: "/budget" },
    { label: "Settings", icon: <SettingsIcon />, path: "/settings" },
    { label: "Income", icon: <BarChartIcon />, path: "/income" },
  ];

  return (
    <div style={{ paddingBottom: "0px" }}>
      
      {/* Top App Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>

          {/* Hamburger Button */}
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

      {/* Side Drawer */}
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <div style={{ width: 250 }}>
          <Typography
            variant="h6"
            style={{ padding: 16, paddingBottom: 0 }}
          >
            Menu
          </Typography>
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
                <ListItemText
                  primary={item.label}
                  style={{ marginLeft: 16 }}
                />
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>

      {/* Page Content */}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
