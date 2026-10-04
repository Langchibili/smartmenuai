"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableBarIcon from "@mui/icons-material/TableBar";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LogoutIcon from "@mui/icons-material/Logout";
import { alpha } from "@mui/material/styles";
import { useAuth } from "@/lib/auth-context";
import { ConfirmModal } from "@/components/ui/smart-modal";

const OWNER_ITEMS = [
  { label: "Home", path: "/owner/dashboard", icon: DashboardIcon },
  { label: "Tables", path: "/owner/tables", icon: TableBarIcon },
  { label: "Orders", path: "/owner/orders", icon: ReceiptLongIcon },
  { label: "Menu", path: "/owner/menu", icon: RestaurantMenuIcon },
  { label: "More", path: "more", icon: MoreHorizIcon },
];

const MANAGER_ITEMS = [
  ...OWNER_ITEMS.slice(0, 4),
  OWNER_ITEMS[4],
];

const WAITER_ITEMS = [
  { label: "Tables", path: "/waiter", icon: TableBarIcon },
  { label: "Orders", path: "/waiter/orders", icon: ReceiptLongIcon },
  { label: "Alerts", path: "/waiter/alerts", icon: NotificationsActiveOutlinedIcon },
  { label: "More", path: "more", icon: MoreHorizIcon },
];

export default function MainNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { business, employee, logout } = useAuth();
  const internalPaths = useRef([]);
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const role = employee?.role?.toLowerCase();
  const items = role === "waiter"
    ? WAITER_ITEMS
    : role === "manager"
      ? MANAGER_ITEMS
      : OWNER_ITEMS;
  const rootPath = role === "waiter" ? "/waiter" : "/owner/dashboard";
  const moreLinks = role === "owner"
    ? [
        { label: "Employees", path: "/owner/employees", icon: PeopleAltIcon },
        { label: "Reports", path: "/owner/reports", icon: AssessmentOutlinedIcon },
        { label: "Settings", path: "/owner/settings", icon: MoreHorizIcon },
      ]
    : role === "manager"
      ? [{ label: "Reports", path: "/owner/reports", icon: AssessmentOutlinedIcon }]
      : [];
  const activePath = items.find((item) =>
    item.path !== "more" && (
      pathname === item.path ||
      (item.path !== "/waiter" && pathname.startsWith(`${item.path}/`))
    )
  )?.path;
  const moreActive = moreLinks.some((item) =>
    pathname === item.path || pathname.startsWith(`${item.path}/`)
  );
  const selected = moreActive || moreAnchor ? "more" : activePath ?? false;

  useEffect(() => {
    const paths = internalPaths.current;
    if (pathname !== "/" && paths[paths.length - 1] !== pathname) paths.push(pathname);
  }, [pathname]);

  const handleBack = () => {
    const event = new CustomEvent("smartmenu:back-request", {
      detail: { handled: false },
    });
    window.dispatchEvent(event);
    if (event.detail.handled) return;

    if (internalPaths.current.length > 1) {
      internalPaths.current.pop();
      router.back();
    } else {
      router.replace(rootPath);
    }
  };

  const handleLogout = () => {
    setMoreAnchor(null);
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    router.replace("/login");
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.appBar + 1,
          bgcolor: "rgba(13,4,0,0.94)",
          borderBottom: `1px solid ${alpha("#D4850A", 0.15)}`,
          backdropFilter: "blur(16px)",
        }}
      >
        <Toolbar sx={{ minHeight: "58px !important", px: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: "#F9EDD8",
                fontWeight: 700,
                fontSize: "0.98rem",
                lineHeight: 1.2,
              }}
            >
              SmartMenu AI
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "#8B6038",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {business?.business_name ?? employee?.role ?? "Workspace"}
            </Typography>
          </Box>
          <IconButton
            aria-label="Go back or close preview"
            onClick={handleBack}
            sx={{
              color: "#D4A872",
              border: `1px solid ${alpha("#D4850A", 0.2)}`,
              "&:hover": { bgcolor: alpha("#D4850A", 0.1), color: "#D4850A" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          zIndex: 1200,
          bottom: 0,
          left: 0,
          right: 0,
          pb: "env(safe-area-inset-bottom, 0px)",
          bgcolor: "rgba(13,4,0,0.97)",
          borderTop: `1px solid ${alpha("#D4850A", 0.17)}`,
          backdropFilter: "blur(16px)",
        }}
      >
        <BottomNavigation
          showLabels
          value={selected}
          sx={{
            height: 64,
            bgcolor: "transparent",
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              px: 0.5,
              color: "#8B6038",
            },
            "& .Mui-selected": { color: "#D4850A" },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "0.66rem",
              "&.Mui-selected": { fontSize: "0.7rem", fontWeight: 700 },
            },
          }}
        >
          {items.map(({ label, path, icon: Icon }) => (
            <BottomNavigationAction
              key={path}
              component={path === "more" ? "button" : Link}
              href={path === "more" ? undefined : path}
              value={path}
              label={label}
              icon={<Icon fontSize="small" />}
              onClick={path === "more" ? (event) => setMoreAnchor(event.currentTarget) : undefined}
            />
          ))}
        </BottomNavigation>
        <Menu
          anchorEl={moreAnchor}
          open={Boolean(moreAnchor)}
          onClose={() => setMoreAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#1C0A00",
                color: "#F9EDD8",
                border: `1px solid ${alpha("#D4850A", 0.2)}`,
              },
            },
          }}
        >
          {moreLinks.map(({ label, path, icon: Icon }) => (
            <MenuItem
              key={path}
              component={Link}
              href={path}
              onClick={() => setMoreAnchor(null)}
              sx={{ gap: 1.5, minWidth: 180 }}
            >
              <Icon fontSize="small" sx={{ color: "#D4850A" }} />
              {label}
            </MenuItem>
          ))}
          {moreLinks.length > 0 && <Divider sx={{ borderColor: alpha("#D4850A", 0.18) }} />}
          <MenuItem onClick={handleLogout} sx={{ gap: 1.5, minWidth: 180, color: "#ef7777" }}>
            <LogoutIcon fontSize="small" />
            Sign out
          </MenuItem>
        </Menu>
      </Paper>
      <ConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="Sign out?"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign out"
        danger
      />
    </>
  );
}
