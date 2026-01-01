import React, { useState } from "react";
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Button, TextField, Card, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Card style={{ padding: 20, marginTop: 50 }}>
      <Typography variant="h5">Login</Typography>

      <TextField
        label="Email"
        fullWidth
        style={{ marginTop: 20 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        label="Password"
        type="password"
        fullWidth
        style={{ marginTop: 20 }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        fullWidth
        variant="contained"
        style={{ marginTop: 25 }}
        onClick={login}
      >
        Login
      </Button>

      <Button
        fullWidth
        style={{ marginTop: 10 }}
        onClick={() => nav("/register")}
      >
        Create Account
      </Button>
    </Card>
  );
}
