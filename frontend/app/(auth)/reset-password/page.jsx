"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const resetCode = new URLSearchParams(window.location.search).get("code") || "";
    setCode(resetCode);
    if (!resetCode) setError("This reset link is missing its verification code. Request a new link.");
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!code) {
      setError("This reset link is missing its verification code. Request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({ code, password, passwordConfirmation });
      router.replace("/login?passwordReset=1");
    } catch (requestError) {
      setError(requestError.message || "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ color: TEXT_P, fontWeight: 700, mb: 1 }}>
        Choose a new password
      </Typography>
      <Typography sx={{ color: TEXT_M, fontSize: 14, mb: 3 }}>
        Your password must be at least 8 characters long.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2.5 }}>
        <TextField
          label="New password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          inputProps={{ minLength: 8 }}
          fullWidth
          sx={inputSx}
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          autoComplete="new-password"
          required
          inputProps={{ minLength: 8 }}
          fullWidth
          sx={inputSx}
        />
        <Button
          type="submit"
          disabled={submitting || !code}
          variant="contained"
          sx={{
            height: 50,
            borderRadius: "14px",
            background: "linear-gradient(135deg, #D4850A 0%, #A0622A 100%)",
            color: "#FFF8ED",
            fontWeight: 700,
          }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : "Update password"}
        </Button>
      </Box>

      <Typography sx={{ textAlign: "center", color: TEXT_M, fontSize: 14, mt: 3 }}>
        Need another reset link?{" "}
        <MuiLink component={Link} href="/forgot-password" sx={{ color: BRAND, fontWeight: 700 }}>
          Request one
        </MuiLink>
      </Typography>
    </Box>
  );
}
