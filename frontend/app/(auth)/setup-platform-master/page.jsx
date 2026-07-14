
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { platformApi, setToken } from "@/lib/api";
import Link from "next/link";
import {
  Box, Typography, TextField, Button, Paper, CircularProgress, alpha,
} from "@mui/material";
import { motion } from "framer-motion";

const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const ERROR = "#ef4444";

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

export default function SetupPlatformMasterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await platformApi.setupPlatformMaster({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      });
      if (res.token) setToken(res.token);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 2, py: 12, background: "var(--color-bg)" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${BRAND}, #6B3318)`, boxShadow: `0 4px 16px rgba(212,133,10,0.35)` }}>🍺</Box>
        <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 20, background: `linear-gradient(135deg, #F5C842 0%, ${BRAND} 50%, ${BRAND_DARK} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          SmartMenu AI
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ width: "100%", maxWidth: 440, borderRadius: "20px", p: 4, background: "linear-gradient(145deg, rgba(45,18,0,0.95) 0%, rgba(28,10,0,0.98) 100%)", border: "1px solid rgba(212,133,10,0.18)", boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,133,10,0.08), inset 0 1px 0 rgba(212,133,10,0.12)" }}>
        {done ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography sx={{ fontSize: 48, mb: 2 }}>🛡️</Typography>
            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', color: TEXT_P, mb: 1 }}>Platform master created!</Typography>
            <Typography variant="body2" sx={{ color: TEXT_M, mb: 4 }}>You now have full platform admin access.</Typography>
            <Button fullWidth variant="contained" onClick={() => router.replace("/platform/dashboard")} sx={{ height: 48, borderRadius: "14px", background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, fontWeight: 700, boxShadow: `0 4px 20px ${alpha(BRAND, 0.4)}` }}>
              Go to platform dashboard →
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 2, mb: 3, borderRadius: "14px", background: alpha("#f59e0b", 0.05), border: `1px solid ${alpha("#f59e0b", 0.2)}`, color: "#D4A017", fontSize: 13 }}>
              ⚠️ This page creates the top-level platform administrator.
            </Box>
            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', color: TEXT_P, mb: 0.5 }}>Platform master setup</Typography>
            <Typography sx={{ fontSize: 14, color: TEXT_M, mb: 3 }}>One-time configuration for platform administrators.</Typography>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ px: 2.5, py: 1.5, borderRadius: "14px", mb: 3, background: alpha(ERROR, 0.08), border: `1px solid ${alpha(ERROR, 0.25)}`, color: "#f87171", fontSize: 13 }}>
                  {error}
                </Box>
              </motion.div>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField label="Full name" placeholder="Platform Owner" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} fullWidth sx={inputSx} />
              <TextField label="Email address" type="email" placeholder="admin@smartmenu.ai" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required fullWidth sx={inputSx} />
              <TextField label="Password" type="password" placeholder="Strong password (8+ chars)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required fullWidth sx={inputSx} inputProps={{ minLength: 8 }} />
              <TextField label="Confirm password" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required fullWidth sx={inputSx} />
              <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ height: 48, borderRadius: "14px", mt: 0.5, background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, fontWeight: 700, boxShadow: `0 4px 20px ${alpha(BRAND, 0.4)}`, "&:hover": { background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)` } }}>
                {loading ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Create platform master"}
              </Button>
            </Box>
            <Typography sx={{ textAlign: "center", fontSize: 12, color: TEXT_D, mt: 2 }}>
              <Link href="/login" style={{ color: TEXT_M, textDecoration: "none" }}>← Back to sign in</Link>
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}

