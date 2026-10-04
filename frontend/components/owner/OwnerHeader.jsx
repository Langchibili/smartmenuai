"use client";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  Box,
} from "@mui/material";
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  Receipt as OrdersIcon,
  DarkMode as DarkIcon,
  LightMode as LightIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useThemeMode } from "@/components/ThemeProvider"; // Adjust import as needed
import { initials } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/smart-modal";

export default function OwnerHeader() {
  const router = useRouter();
  const { user, employee, business, logout } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { toggleTheme } = useThemeMode();

  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    router.replace("/login");
  };

  const navigate = (path) => {
    handleMenuClose();
    router.push(path);
  };

  const displayName = employee?.full_name || user?.email || "User";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: isDark
          ? "linear-gradient(135deg, #1C0A00 0%, #0D0400 100%)"
          : "linear-gradient(135deg, #fff 0%, #F8FAFC 100%)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${alpha("#D4850A", isDark ? 0.12 : 0.08)}`,
        boxShadow: "none",
        transition: "background 0.3s",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: 56 }}>
        {/* Left: Logo / Brand */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, #D4850A, #6B3318)`,
              boxShadow: `0 2px 8px ${alpha("#D4850A", 0.35)}`,
              fontSize: "1rem",
            }}
          >
            🍺
          </Box>
          <Typography
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              fontSize: "1rem",
              color: isDark ? "#F9EDD8" : "#1C0A00",
            }}
          >
            {business?.business_name || "SmartMenu AI"}
          </Typography>
        </Box>

        {/* Right: Profile button */}
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            border: `1px solid ${alpha("#D4850A", 0.3)}`,
            background: alpha("#D4850A", isDark ? 0.1 : 0.05),
            transition: "all 0.2s",
            "&:hover": {
              background: alpha("#D4850A", 0.2),
              borderColor: "#D4850A",
            },
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: "0.75rem",
              fontWeight: 700,
              background: `linear-gradient(135deg, #D4850A, #6B3318)`,
            }}
          >
            {initials(displayName)}
          </Avatar>
        </IconButton>

        {/* Dropdown menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5,
              borderRadius: "14px",
              background: isDark
                ? "linear-gradient(145deg, rgba(45,18,0,0.98) 0%, rgba(28,10,0,0.99) 100%)"
                : "linear-gradient(145deg, #fff 0%, #F8FAFC 100%)",
              border: `1px solid ${alpha("#D4850A", isDark ? 0.2 : 0.1)}`,
              backdropFilter: "blur(12px)",
              boxShadow: isDark
                ? `0 8px 32px rgba(0,0,0,0.6)`
                : `0 8px 32px rgba(0,0,0,0.1)`,
              minWidth: 200,
              overflow: "visible",
            },
          }}
        >
          {/* User info */}
          <Box sx={{ px: 2, py: 1.5, textAlign: "center" }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.9rem",
                color: isDark ? "#F9EDD8" : "#1C0A00",
              }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: isDark ? "#8B6038" : "#6B7280" }}
            >
              {employee?.role || "Owner"}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: alpha("#D4850A", 0.15) }} />

          {/* Navigation items */}
          <MenuItem onClick={() => navigate("/orders")}>
            <ListItemIcon>
              <OrdersIcon fontSize="small" sx={{ color: "#D4850A" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
              Orders
            </ListItemText>
          </MenuItem>

          <MenuItem onClick={() => navigate("/reports")}>
            <ListItemIcon>
              <ReportsIcon fontSize="small" sx={{ color: "#D4850A" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
              Reports
            </ListItemText>
          </MenuItem>

          <MenuItem onClick={() => navigate("/settings")}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" sx={{ color: "#D4850A" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>
              Settings
            </ListItemText>
          </MenuItem>

          <Divider sx={{ borderColor: alpha("#D4850A", 0.15) }} />

          {/* Theme toggle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isDark ? (
                <DarkIcon fontSize="small" sx={{ color: "#D4850A" }} />
              ) : (
                <LightIcon fontSize="small" sx={{ color: "#D4850A" }} />
              )}
              <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#D4A872" : "#6B7280" }}>
                Dark mode
              </Typography>
            </Box>
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#D4850A",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#D4850A",
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: alpha("#D4850A", 0.15) }} />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: "#ef4444" }} />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                fontSize: "0.875rem",
                color: "#ef4444",
              }}
            >
              Sign out
            </ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
      <ConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="Sign out?"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign out"
        danger
      />
    </AppBar>
  );
}