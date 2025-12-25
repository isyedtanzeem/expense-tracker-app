import React from "react";
import { AppBar, Toolbar, Typography, BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SettingsIcon from "@mui/icons-material/Settings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const [value, setValue] = React.useState(0);
  const navigate = useNavigate();

  return (
    <div style={{ paddingBottom: "70px" }}>
      {/* Top Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6">My Expense App</Typography>
        </Toolbar>
      </AppBar>

      {/* Page Content */}
      <div style={{ padding: "16px" }}>
        {children}
      </div>

      {/* Bottom Navigation */}
      <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }} elevation={8}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            navigate(newValue);
          }}
        >
          <BottomNavigationAction label="Dashboard" value="/" icon={<DashboardIcon />} />
          <BottomNavigationAction label="Expenses" value="/expenses" icon={<ReceiptLongIcon />} />
          <BottomNavigationAction label="Accounts" value="/accounts" icon={<AccountBalanceIcon />} />
          <BottomNavigationAction label="Cards" value="/cards" icon={<CreditCardIcon />} />
          <BottomNavigationAction label="Budget" value="/budget" icon={<BarChartIcon />} />
          <BottomNavigationAction label="Settings" value="/settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Paper>
    </div>
  );
}
