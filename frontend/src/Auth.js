import React, { useState } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Stack,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState(localStorage.getItem("cj_username") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (!isLogin && name.trim().length < 2) {
        setError("Please enter your name (at least 2 characters).");
        return;
      }
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // Store name for greeting if already signed up previously
        if (name.trim()) localStorage.setItem("cj_username", name.trim());
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        localStorage.setItem("cj_username", name.trim());
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e3f2fd 0%, #fff 100%)"
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          borderRadius: 3,
          width: 350,
          maxWidth: "90vw"
        }}
      >
        <Stack spacing={2} alignItems="center">
          <LockOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" fontWeight={600}>
            {isLogin ? "Login" : "Sign Up"}
          </Typography>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            {!isLogin && (
              <TextField
                label="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
            )}
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              {isLogin ? "Login" : "Sign Up"}
            </Button>
          </form>
          <Button
            variant="text"
            onClick={() => setIsLogin(!isLogin)}
            sx={{ mt: 1 }}
          >
            {isLogin
              ? "Need an account? Sign Up"
              : "Already have an account? Login"}
          </Button>
          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Boxa>
  );
}
