"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { employeeApi } from "@/lib/api";
import Link from "next/link";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Visibility, VisibilityOff, ErrorOutlineOutlined } from "@mui/icons-material";
import { motion } from "framer-motion";

const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const GOLD = "#F5C842";
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
    transition: "all 220ms",
    "& fieldset": {
      borderColor: "rgba(212,133,10,0.18)",
      transition: "all 220ms",
    },
    "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
    "&.Mui-focused fieldset": {
      borderColor: BRAND,
      boxShadow: `0 0 0 3px ${alpha(BRAND, 0.18)}, 0 0 20px ${alpha(BRAND, 0.12)}`,
    },
  },
  "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: BRAND },
  "& input": { color: TEXT_P },
};

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { user, login, register, refreshBusiness } = useAuth();
  const router = useRouter();

  const [stage, setStage] = useState("loading");
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!token) {
      setStage("invalid");
      return;
    }
    (async () => {
      try {
        const res = await employeeApi.validateInviteToken(token);
        if (!res.valid) {
          setStage("invalid");
          setError(
            res.reason === "expired"
              ? "This invite link has expired."
              : res.reason === "accepted"
                ? "This invite has already been accepted."
                : "This invite link is not valid."
          );
          return;
        }
        setInviteData(res);
        setStage(user ? "ready" : "register");
      } catch {
        setStage("invalid");
        setError("Failed to validate invite link. Please try again.");
      }
    })();
  }, [token, user]);

  const accept = async () => {
    setStage("accepting");
    try {
      await employeeApi.acceptInvite(token);
      await refreshBusiness();
      setStage("done");
    } catch (err) {
      setError(err.message);
      setStage("error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStage("accepting");
    try {
      await register({
        username: inviteData.invitation.invited_email.split("@")[0],
        email: inviteData.invitation.invited_email,
        password: form.password,
        fullName: inviteData.invitation.invited_name,
      });
      await employeeApi.acceptInvite(token);
      await refreshBusiness();
      setStage("done");
    } catch (err) {
      setError(err.message);
      setStage("error");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setStage("accepting");
    try {
      await login(inviteData.invitation.invited_email, form.password);
      await employeeApi.acceptInvite(token);
      await refreshBusiness();
      setStage("done");
    } catch (err) {
      setError(err.message);
      setStage("login");
    }
  };

  const Wrapper = ({ children }) => (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0D0400",
        px: 2,
        py: 6,
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 0%, ${alpha(BRAND, 0.1)} 0%, transparent 60%)`,
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 36,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            background: `linear-gradient(135deg, ${BRAND}, #6B3318)`,
            boxShadow: `0 4px 20px ${alpha(BRAND, 0.4)}`,
          }}
        >
          🍺
        </Box>
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            fontSize: 20,
            background: `linear-gradient(135deg, ${GOLD} 0%, ${BRAND} 50%, ${BRAND_DARK} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SmartMenu AI
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{ width: "100%", maxWidth: 440 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: "20px",
            background:
              "linear-gradient(145deg, rgba(45,18,0,0.95) 0%, rgba(28,10,0,0.98) 100%)",
            border: "1px solid rgba(212,133,10,0.18)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,133,10,0.08), inset 0 1px 0 rgba(212,133,10,0.12)",
          }}
        >
          {children}
        </Paper>
      </motion.div>
    </Box>
  );

  const InviteInfo = () => (
    <Box
      sx={{
        p: 2,
        mb: 3,
        borderRadius: "14px",
        background: alpha(BRAND, 0.06),
        border: `1px solid ${alpha(BRAND, 0.2)}`,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          color: BRAND,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          mb: 0.5,
        }}
      >
        Invitation details
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: TEXT_P }}>
        {inviteData?.business?.business_name}
      </Typography>
      <Typography variant="caption" sx={{ color: TEXT_M }}>
        Role: <span style={{ color: TEXT_S }}>{inviteData?.invitation?.role}</span>
        {inviteData?.branch && (
          <>
            {" "}
            · Branch:{" "}
            <span style={{ color: TEXT_S }}>{inviteData.branch.branch_name}</span>
          </>
        )}
      </Typography>
    </Box>
  );

  const ErrorBar = () =>
    error ? (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 1.5,
            borderRadius: "14px",
            mb: 3,
            background: alpha(ERROR, 0.08),
            border: `1px solid ${alpha(ERROR, 0.25)}`,
          }}
        >
          <ErrorOutlineOutlined sx={{ color: "#f87171", fontSize: 18, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 13, color: "#f87171" }}>{error}</Typography>
        </Box>
      </motion.div>
    ) : null;

  if (stage === "loading" || stage === "accepting") {
    return (
      <Wrapper>
        <Box sx={{ textAlign: "center", py: 3 }}>
          <CircularProgress sx={{ color: BRAND, mb: 2 }} />
          <Typography sx={{ color: TEXT_S }}>
            {stage === "accepting" ? "Accepting invite…" : "Validating link…"}
          </Typography>
        </Box>
      </Wrapper>
    );
  }

  if (stage === "invalid") {
    return (
      <Wrapper>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography sx={{ fontSize: 40, mb: 2 }}>⚠️</Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: TEXT_P,
              mb: 1,
            }}
          >
            Invalid invite link
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_M, mb: 4 }}>
            {error || "This link is not valid."}
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            sx={{
              borderColor: alpha(BRAND, 0.4),
              color: TEXT_S,
              borderRadius: "14px",
              "&:hover": {
                borderColor: BRAND,
                background: alpha(BRAND, 0.06),
              },
            }}
          >
            Back to sign in
          </Button>
        </Box>
      </Wrapper>
    );
  }

  if (stage === "done") {
    return (
      <Wrapper>
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography sx={{ fontSize: 48, mb: 2 }}>🎉</Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: TEXT_P,
              mb: 1,
            }}
          >
            You're in!
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_S, mb: 0.5 }}>
            You've joined{" "}
            <strong style={{ color: TEXT_P }}>
              {inviteData?.business?.business_name}
            </strong>
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_M, mb: 4 }}>
            as a <strong style={{ color: BRAND }}>{inviteData?.invitation?.role}</strong>.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() =>
              router.replace(
                inviteData?.invitation?.role === "waiter" ? "/waiter" : "/dashboard"
              )
            }
            sx={{
              height: 48,
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
              fontWeight: 700,
              boxShadow: `0 4px 20px ${alpha(BRAND, 0.4)}`,
              "&:hover": {
                boxShadow: `0 6px 28px ${alpha(BRAND, 0.55)}`,
              },
            }}
          >
            Go to my dashboard →
          </Button>
        </Box>
      </Wrapper>
    );
  }

  if (stage === "ready") {
    return (
      <Wrapper>
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: TEXT_P,
            mb: 0.5,
          }}
        >
          Accept invite
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_M, mb: 3 }}>
          Signed in as{" "}
          <strong style={{ color: TEXT_S }}>{user?.email}</strong>
        </Typography>
        <InviteInfo />
        <ErrorBar />
        <Button
          fullWidth
          variant="contained"
          onClick={accept}
          sx={{
            height: 48,
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
            fontWeight: 700,
            boxShadow: `0 4px 20px ${alpha(BRAND, 0.4)}`,
          }}
        >
          Accept & join →
        </Button>
      </Wrapper>
    );
  }

  if (stage === "register") {
    return (
      <Wrapper>
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: TEXT_P,
            mb: 0.5,
          }}
        >
          Create your account
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_M, mb: 3 }}>
          Set a password for{" "}
          <strong style={{ color: TEXT_S }}>
            {inviteData?.invitation?.invited_email}
          </strong>
        </Typography>
        <InviteInfo />
        <ErrorBar />
        <Box
          component="form"
          onSubmit={handleRegister}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField
            label="Password"
            type={showPass ? "text" : "password"}
            required
            inputProps={{ minLength: 8 }}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPass((v) => !v)}
                    sx={{ color: TEXT_M, "&:hover": { color: TEXT_S } }}
                  >
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm password"
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((f) => ({ ...f, confirmPassword: e.target.value }))
            }
            sx={inputSx}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              height: 48,
              borderRadius: "14px",
              mt: 0.5,
              background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
              fontWeight: 700,
              boxShadow: `0 4px 20px ${alpha(BRAND, 0.4)}`,
              "&:hover": {
                background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                transform: "translateY(-2px)",
              },
            }}
          >
            Create account & join →
          </Button>
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 2.5,
            color: TEXT_M,
          }}
        >
          Already have an account?{" "}
          <Button
            size="small"
            sx={{
              color: BRAND,
              fontWeight: 700,
              minWidth: 0,
              p: 0,
              textTransform: "none",
              "&:hover": { color: GOLD },
            }}
            onClick={() => setStage("login")}
          >
            Sign in instead
          </Button>
        </Typography>
      </Wrapper>
    );
  }

  if (stage === "login") {
    return (
      <Wrapper>
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: TEXT_P,
            mb: 0.5,
          }}
        >
          Sign in to accept
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_M, mb: 3 }}>
          Use the password for{" "}
          <strong style={{ color: TEXT_S }}>
            {inviteData?.invitation?.invited_email}
          </strong>
        </Typography>
        <InviteInfo />
        <ErrorBar />
        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField
            label="Password"
            type={showPass ? "text" : "password"}
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPass((v) => !v)}
                    sx={{ color: TEXT_M, "&:hover": { color: TEXT_S } }}
                  >
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              height: 48,
              borderRadius: "14px",
              mt: 0.5,
              background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
              fontWeight: 700,
              boxShadow: `0 4px 20px ${alpha(BRAND, 0.4)}`,
              "&:hover": {
                background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                transform: "translateY(-2px)",
              },
            }}
          >
            Sign in & join →
          </Button>
        </Box>
      </Wrapper>
    );
  }

  return null;
}