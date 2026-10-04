
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAuthenticatedDashboardPath } from "@/lib/utils";
import {
  Alert, Box, Typography, TextField, Button, InputAdornment,
  IconButton, Link as MuiLink, CircularProgress, alpha,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { motion } from "framer-motion";

const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const GOLD = "#F5C842";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(45,18,0,0.8)",
    color: TEXT_P,
    fontSize: 14,
    "& fieldset": { borderColor: "rgba(212,133,10,0.18)" },
    "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
    "&.Mui-focused fieldset": {
      borderColor: BRAND,
      boxShadow: `0 0 0 3px ${alpha(BRAND, 0.18)}, 0 0 20px ${alpha(BRAND, 0.12)}`,
    },
  },
  "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: BRAND },
};

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    setPasswordReset(new URLSearchParams(window.location.search).get("passwordReset") === "1");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const session = await login(form.identifier, form.password);
      router.replace(
        session.profile?.is_platform_admin
          ? "/platform/settings"
          : getAuthenticatedDashboardPath(session.employee)
      );
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      style={{ width: "100%", maxWidth: 460 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: TEXT_P, mb: 0.75, fontSize: { xs: 28, sm: 34 } }}>
          Welcome back
        </Typography>
        <Typography sx={{ fontSize: 14, color: TEXT_M }}>
          Sign in to your SmartMenu workspace
        </Typography>
      </Box>

      {passwordReset && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your password has been updated. Sign in with your new password.
        </Alert>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.75, borderRadius: "14px", mb: 3, background: alpha("#ef4444", 0.09), border: `1px solid ${alpha("#ef4444", 0.28)}`, color: "#f87171", fontSize: 13 }}>
            ⚠ {error}
          </Box>
        </motion.div>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <TextField
          label="Email or username"
          type="text"
          placeholder="your@email.com"
          value={form.identifier}
          onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
          required
          autoComplete="username"
          fullWidth
          sx={inputSx}
        />

        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: TEXT_M, fontWeight: 500 }}>Password</Typography>
            <MuiLink component={Link} href="/forgot-password" sx={{ fontSize: 12, color: BRAND, textDecoration: "none", fontWeight: 600, "&:hover": { color: GOLD } }}>
              Forgot password?
            </MuiLink>
          </Box>
          <TextField
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            autoComplete="current-password"
            fullWidth
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass((v) => !v)} edge="end" size="small" sx={{ color: TEXT_M, "&:hover": { color: TEXT_S } }}>
                    {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              height: 52, mt: 0.5, borderRadius: "14px",
              background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
              color: "#FFF8ED",
              fontSize: 15, fontWeight: 700,
              boxShadow: `0 4px 24px ${alpha(BRAND, 0.38)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
              border: `1px solid ${alpha(BRAND, 0.45)}`,
              "&:hover": {
                background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                transform: "translateY(-2px)",
              },
              "&.Mui-disabled": { opacity: 0.5, transform: "none" },
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.25)", borderTopColor: "white", animation: "spinArc 0.75s linear infinite" }} />
                Signing in…
              </Box>
            ) : "Sign in →"}
          </Button>
        </motion.div>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 3.5 }}>
        <Box sx={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(BRAND, 0.22)}, transparent)` }} />
        <Typography sx={{ fontSize: 12, color: TEXT_D }}>or</Typography>
        <Box sx={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(BRAND, 0.22)}, transparent)` }} />
      </Box>

      <Typography sx={{ textAlign: "center", fontSize: 14, color: TEXT_M }}>
        Don&apos;t have an account?{" "}
        <MuiLink component={Link} href="/register" sx={{ color: BRAND, fontWeight: 700, textDecoration: "none", "&:hover": { color: GOLD } }}>
          Create one
        </MuiLink>
      </Typography>

      <Typography sx={{ textAlign: "center", fontSize: 12, color: TEXT_D, mt: 2 }}>
        Platform admin?{" "}
        <MuiLink component={Link} href="/setup-platform-master" sx={{ color: "#6B3318", textDecoration: "none", "&:hover": { color: TEXT_M } }}>
          Set up master account
        </MuiLink>
      </Typography>
    </motion.div>
  );
}
