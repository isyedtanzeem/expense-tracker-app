import React, { useState } from "react";
import { auth, db } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Button, TextField, Card, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");       // ⭐ NEW
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // ⭐ Save extra details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        createdAt: new Date()
      });

      nav("/");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Card style={{ padding: 20, marginTop: 50 }}>
      <Typography variant="h5">Register</Typography>

      <TextField
        label="Full Name"
        fullWidth
        style={{ marginTop: 20 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

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
        onClick={register}
      >
        Create Account
      </Button>

      <Button fullWidth style={{ marginTop: 10 }} onClick={() => nav("/login")}>
        Back to Login
      </Button>
    </Card>
  );
}
