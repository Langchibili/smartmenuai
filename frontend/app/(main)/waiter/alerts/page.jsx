// FILE: smartmenuai/frontend/app/(main)/(waiter)/alerts/page.jsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Switch,
  FormControlLabel,
  Divider,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import TableBarIcon from "@mui/icons-material/TableBar";
import RefreshIcon from "@mui/icons-material/Refresh";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { useAuth } from "@/lib/auth-context";
import { waiterCallApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import { formatRelativeTime } from "@/lib/utils";
import { GlowCard } from "@/components/ui/smart-card";
import { tokens } from "@/lib/mui-theme";

// ─── Status config ────────────────────────────────────────────────────────────
const CALL_STATUS = {
  pending: { label: "Needs you", color: tokens.error, chipColor: "error", pulse: true },
  acknowledged: { label: "On my way", color: tokens.warning, chipColor: "warning", pulse: false },
  completed: { label: "Resolved", color: tokens.success, chipColor: "success", pulse: false },
};

// ─── Ripple pulse for urgent call cards ──────────────────────────────────────
function UrgentPulse({ color }) {
  return (
    <Box sx={{ position: "absolute", top: -4, right: -4, width: 16, height: 16 }}>
      {[0, 1].map(i => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: color,
            opacity: 0,
          }}
        />
      ))}
      <Box
        sx={{
          position: "absolute",
          inset: 3,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${alpha(color, 0.8)}`,
        }}
      />
    </Box>
  );
}

// ─── Single alert card ────────────────────────────────────────────────────────
function AlertCard({ call, onAcknowledge, onResolve, acknowledging, resolving }) {
  const cfg = CALL_STATUS[call.status] ?? CALL_STATUS.pending;
  const isPending = call.status === "pending";
  const isAcked = call.status === "acknowledged";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, x: 60, transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: "16px",
          overflow: "visible",
          border: `1px solid ${alpha(cfg.color, isPending ? 0.45 : 0.2)}`,
          background: `linear-gradient(135deg, ${alpha(cfg.color, isPending ? 0.1 : 0.05)} 0%, ${alpha(tokens.surface, 0.9)} 100%)`,
          backdropFilter: "blur(12px)",
          boxShadow: isPending
            ? `0 8px 32px rgba(0,0,0,0.55), 0 0 24px ${alpha(cfg.color, 0.25)}`
            : `0 4px 16px rgba(0,0,0,0.4)`,
          transition: "box-shadow 300ms ease, border-color 300ms ease",
        }}
      >
        {/* Urgent ripple indicator */}
        {isPending && <UrgentPulse color={cfg.color} />}

        {/* Top accent line */}
        {isPending && (
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
              borderRadius: "16px 16px 0 0",
            }}
          />
        )}

        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Table number */}
            <motion.div
              animate={isPending ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 700,
                  fontSize: "1.5rem",
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${alpha(cfg.color, 0.22)}, ${alpha(cfg.color, 0.1)})`,
                  border: `1px solid ${alpha(cfg.color, 0.4)}`,
                  color: cfg.color,
                  boxShadow: `0 0 ${isPending ? 20 : 10}px ${alpha(cfg.color, isPending ? 0.35 : 0.15)}`,
                }}
              >
                {call.table?.table_number ?? "?"}
              </Box>
            </motion.div>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: tokens.textPrimary,
                    fontWeight: 700,
                    fontFamily: '"Playfair Display", Georgia, serif',
                  }}
                >
                  Table {call.table?.table_number ?? "—"}
                </Typography>
                <Chip label={cfg.label} color={cfg.chipColor} size="small" />
              </Stack>

              {call.message && (
                <Typography
                  variant="body2"
                  sx={{
                    color: tokens.textSecondary,
                    fontStyle: "italic",
                    mb: 0.8,
                    px: 1.5,
                    py: 0.7,
                    borderRadius: "8px",
                    background: alpha(tokens.surface, 0.6),
                    border: `1px solid ${tokens.borderBase}`,
                    display: "inline-block",
                    maxWidth: "100%",
                  }}
                >
                  "{call.message}"
                </Typography>
              )}

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <AccessTimeIcon sx={{ fontSize: 12, color: tokens.textDisabled }} />
                <Typography variant="caption" sx={{ color: tokens.textDisabled }}>
                  {formatRelativeTime(call.created_at)}
                </Typography>
              </Stack>
            </Box>

            {/* Actions */}
            <Stack spacing={1} sx={{ flexShrink: 0 }}>
              {isPending && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={acknowledging === call.id}
                    onClick={() => onAcknowledge(call.id)}
                    startIcon={<CheckIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      py: 0.8,
                      px: 1.8,
                      background: `linear-gradient(135deg, ${tokens.error}, #991b1b)`,
                      border: `1px solid ${alpha(tokens.error, 0.4)}`,
                      boxShadow: `0 4px 14px ${alpha(tokens.error, 0.35)}`,
                      "&:hover": { boxShadow: `0 6px 20px ${alpha(tokens.error, 0.5)}` },
                    }}
                  >
                    {acknowledging === call.id ? "…" : "Respond"}
                  </Button>
                </motion.div>
              )}

              {isAcked && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={resolving === call.id}
                    onClick={() => onResolve(call.id, call.table?.id)}
                    startIcon={<DoneAllIcon sx={{ fontSize: 15 }} />}
                    sx={{
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      py: 0.8,
                      px: 1.8,
                      background: `linear-gradient(135deg, ${tokens.success}, #15803d)`,
                      border: `1px solid ${alpha(tokens.success, 0.4)}`,
                      boxShadow: `0 4px 14px ${alpha(tokens.success, 0.3)}`,
                      "&:hover": { boxShadow: `0 6px 20px ${alpha(tokens.success, 0.45)}` },
                    }}
                  >
                    {resolving === call.id ? "…" : "Resolved"}
                  </Button>
                </motion.div>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </motion.div>
  );
}

// ─── Live counter strip ───────────────────────────────────────────────────────
function CounterStrip({ pending, acknowledged, resolved }) {
  const items = [
    { label: "Need response", count: pending, color: tokens.error },
    { label: "On my way", count: acknowledged, color: tokens.warning },
    { label: "Resolved", count: resolved, color: tokens.success },
  ];

  return (
    <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
      {items.map(({ label, count, color }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ flex: 1 }}
        >
          <Box
            sx={{
              borderRadius: "12px",
              border: `1px solid ${alpha(color, 0.25)}`,
              background: alpha(color, 0.07),
              p: 1.5,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: "1.6rem",
                fontWeight: 700,
                color,
                lineHeight: 1,
                textShadow: `0 0 16px ${alpha(color, 0.4)}`,
              }}
            >
              {count}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.textDisabled, display: "block", mt: 0.3, lineHeight: 1.2 }}>
              {label}
            </Typography>
          </Box>
        </motion.div>
      ))}
    </Stack>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function QuietState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Box sx={{ textAlign: "center", py: 12 }}>
        <motion.div
          animate={{
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.05, 0.98, 1.03, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Typography sx={{ fontSize: "4rem", mb: 2, display: "block" }}>🔕</Typography>
        </motion.div>
        <Typography
          variant="h6"
          sx={{ color: tokens.textMuted, fontFamily: "Inter, sans-serif", fontWeight: 400 }}
        >
          All quiet on the floor
        </Typography>
        <Typography variant="caption" sx={{ color: tokens.textDisabled, display: "block", mt: 1 }}>
          No active waiter calls right now
        </Typography>
      </Box>
    </motion.div>
  );
}

// ─── Sound toggle ─────────────────────────────────────────────────────────────
function useSoundEnabled() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem("waiter_sound") !== "false"; } catch { return true; }
  });
  const toggle = () => {
    setEnabled(v => {
      try { localStorage.setItem("waiter_sound", String(!v)); } catch { }
      return !v;
    });
  };
  return [enabled, toggle];
}

// ─── Shake animation when new pending call arrives ────────────────────────────
const headerShake = {
  animate: { x: [0, -6, 6, -4, 4, -2, 2, 0], transition: { duration: 0.55 } },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WaiterAlertsPage() {
  const { employee, business } = useAuth();
  const { toast } = useToast();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [soundEnabled, toggleSound] = useSoundEnabled();
  const [shakeHeader, setShakeHeader] = useState(false);

  const prevPendingCount = useRef(0);
  const audioRef = useRef(null);

  // Play alert sound
  const playAlert = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // Create a simple beep via Web Audio API
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { }
  }, [soundEnabled]);

  const load = useCallback(async () => {
    if (!business?.id) return;
    try {
      const res = await waiterCallApi.getActiveCalls(business.id);
      const newCalls = res.calls ?? [];
      const pendingCount = newCalls.filter(c => c.status === "pending").length;

      // Detect new pending calls → shake + sound
      if (pendingCount > prevPendingCount.current) {
        playAlert();
        setShakeHeader(true);
        setTimeout(() => setShakeHeader(false), 600);
      }
      prevPendingCount.current = pendingCount;
      setCalls(newCalls);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [business?.id, playAlert]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 8_000); // faster polling for alerts
    return () => clearInterval(t);
  }, [load]);

  const acknowledge = async (callId) => {
    setAcknowledging(callId);
    try {
      await waiterCallApi.acknowledgeCall(callId, employee?.id);
      setCalls(prev => prev.map(c => c.id === callId ? { ...c, status: "acknowledged" } : c));
      toast("On your way! 🏃", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setAcknowledging(null);
    }
  };

  const resolve = async (callId, tableId) => {
    setResolving(callId);
    try {
      await waiterCallApi.resolveCall(callId, tableId);
      setCalls(prev => prev.filter(c => c.id !== callId));
      toast("Call resolved ✓", "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setResolving(null);
    }
  };

  const pendingCalls = calls.filter(c => c.status === "pending");
  const acknowledgedCalls = calls.filter(c => c.status === "acknowledged");
  const hasCalls = calls.length > 0;

  return (
    <Box
      sx={{
        pb: 10,
        maxWidth: 600,
        mx: "auto",
        minHeight: "100dvh",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          px: 2,
          pt: 2.5,
          pb: 2,
          background: alpha(tokens.bg, 0.92),
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${tokens.borderBase}`,
        }}
      >
        <motion.div animate={shakeHeader ? "animate" : "initial"} variants={headerShake}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {/* Bell icon with badge */}
              <Box sx={{ position: "relative" }}>
                <motion.div
                  animate={pendingCalls.length > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                  transition={pendingCalls.length > 0 ? { duration: 1.2, repeat: Infinity, repeatDelay: 3 } : {}}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: pendingCalls.length > 0
                        ? `linear-gradient(135deg, ${alpha(tokens.error, 0.25)}, ${alpha(tokens.error, 0.12)})`
                        : `linear-gradient(135deg, ${alpha(tokens.surface, 0.9)}, ${alpha(tokens.bgRaised, 0.95)})`,
                      border: `1px solid ${pendingCalls.length > 0 ? alpha(tokens.error, 0.4) : tokens.borderBase}`,
                      boxShadow: pendingCalls.length > 0 ? `0 0 16px ${alpha(tokens.error, 0.3)}` : "none",
                    }}
                  >
                    <NotificationsIcon
                      sx={{
                        fontSize: 22,
                        color: pendingCalls.length > 0 ? tokens.error : tokens.textMuted,
                      }}
                    />
                  </Box>
                </motion.div>

                {/* Pending badge */}
                <AnimatePresence>
                  {pendingCalls.length > 0 && (
                    <motion.div
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 20 }}
                      style={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: tokens.error,
                        border: `2px solid ${tokens.bg}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 0 10px ${alpha(tokens.error, 0.7)}`,
                      }}
                    >
                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                        {pendingCalls.length}
                      </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontFamily: '"Playfair Display", Georgia, serif', color: tokens.textPrimary, lineHeight: 1.2 }}
                >
                  Alerts
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.3 }}>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Box sx={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: hasCalls ? tokens.error : tokens.success,
                      boxShadow: `0 0 6px ${hasCalls ? tokens.error : tokens.success}`,
                    }} />
                  </motion.div>
                  <Typography variant="caption" sx={{ color: tokens.textMuted }}>
                    {hasCalls ? `${calls.length} active call${calls.length > 1 ? "s" : ""}` : "All quiet"}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            {/* Controls */}
            <Stack direction="row" spacing={0.8}>
              <Tooltip title={soundEnabled ? "Mute alerts" : "Unmute alerts"} arrow>
                <IconButton
                  onClick={toggleSound}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    background: alpha(tokens.surface, 0.9),
                    border: `1px solid ${tokens.borderBase}`,
                    color: soundEnabled ? tokens.brand : tokens.textDisabled,
                    "&:hover": { color: tokens.textSecondary, borderColor: tokens.borderStrong },
                  }}
                >
                  {soundEnabled
                    ? <VolumeUpIcon sx={{ fontSize: 17 }} />
                    : <VolumeOffIcon sx={{ fontSize: 17 }} />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh" arrow>
                <IconButton
                  onClick={load}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    background: alpha(tokens.surface, 0.9),
                    border: `1px solid ${tokens.borderBase}`,
                    color: tokens.textMuted,
                    "&:hover": { color: tokens.brand, borderColor: tokens.borderStrong },
                  }}
                >
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </motion.div>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ p: 2, pt: 2.5 }}>
        {loading ? (
          <Stack spacing={2}>
            {[...Array(3)].map((_, i) => (
              <Box key={i} sx={{ borderRadius: "16px", overflow: "hidden", border: `1px solid ${tokens.borderBase}` }}>
                <Skeleton variant="rectangular" height={100} animation="wave" />
              </Box>
            ))}
          </Stack>
        ) : !hasCalls ? (
          <QuietState />
        ) : (
          <>
            {/* Stats strip */}
            <CounterStrip
              pending={pendingCalls.length}
              acknowledged={acknowledgedCalls.length}
              resolved={0}
            />

            {/* Pending — highest priority */}
            <AnimatePresence mode="popLayout">
              {pendingCalls.length > 0 && (
                <motion.div
                  key="pending-section"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: tokens.error,
                      display: "block",
                      mb: 1.5,
                      letterSpacing: "0.1em",
                      fontWeight: 700,
                    }}
                  >
                    🔴 Needs immediate response ({pendingCalls.length})
                  </Typography>

                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {pendingCalls.map(call => (
                      <AlertCard
                        key={call.id}
                        call={call}
                        onAcknowledge={acknowledge}
                        onResolve={resolve}
                        acknowledging={acknowledging}
                        resolving={resolving}
                      />
                    ))}
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Acknowledged */}
            <AnimatePresence mode="popLayout">
              {acknowledgedCalls.length > 0 && (
                <motion.div
                  key="acked-section"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {pendingCalls.length > 0 && <Divider sx={{ my: 2.5 }} />}

                  <Typography
                    variant="overline"
                    sx={{ color: tokens.warning, display: "block", mb: 1.5, letterSpacing: "0.1em", fontWeight: 700 }}
                  >
                    🟡 On your way ({acknowledgedCalls.length})
                  </Typography>

                  <Stack spacing={1.5}>
                    {acknowledgedCalls.map(call => (
                      <AlertCard
                        key={call.id}
                        call={call}
                        onAcknowledge={acknowledge}
                        onResolve={resolve}
                        acknowledging={acknowledging}
                        resolving={resolving}
                      />
                    ))}
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Box>
    </Box>
  );
}