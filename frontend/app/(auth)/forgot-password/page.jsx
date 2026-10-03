"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link as MuiLink,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { authApi } from "@/lib/api";

const BRAND = "#D4850A";
const TEXT_P = "#F9EDD8";
const TEXT_M = "#8B6038";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(45,18,0,0.8)",
    color: TEXT_P,
    fontSize: 14,
    "& fieldset": { borderColor: "rgba(212,133,10,0.18)" },
    "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
    "&.Mui-focused fieldset": { borderColor: BRAND },
  },
  "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to send a password reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: TEXT_P, fontWeight: 700, mb: 1 }}>
        Reset your password
      </Typography>
      <Typography sx={{ color: TEXT_M, fontSize: 14, mb: 3 }}>
        Enter your account email and we&apos;ll send you a password reset link.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {sent ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          If an account exists for that email, a password reset link has been sent.
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2.5 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            fullWidth
            sx={inputSx}
          />
          <Button
            type="submit"
            disabled={submitting}
            variant="contained"
            sx={{
              height: 50,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #D4850A 0%, #A0622A 100%)",
              color: "#FFF8ED",
              fontWeight: 700,
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Send reset link"}
          </Button>
        </Box>
      )}

      <Typography sx={{ textAlign: "center", color: TEXT_M, fontSize: 14, mt: 3 }}>
        Remembered your password?{" "}
        <MuiLink component={Link} href="/login" sx={{ color: BRAND, fontWeight: 700 }}>
          Sign in
        </MuiLink>
      </Typography>
    </Box>
  );
}
