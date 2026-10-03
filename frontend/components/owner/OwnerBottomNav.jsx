"use client";
import { usePathname, useRouter } from "next/navigation";
import { Box, Paper, Typography } from "@mui/material";
import {
  Dashboard as HomeIcon,
  TableBar as TablesIcon,
  RestaurantMenu as MenuIcon,
  People as EmployeesIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { alpha, useTheme } from "@mui/material/styles";

const NAV_ITEMS = [
  { label: "Home", icon: HomeIcon, path: "/owner/dashboard" },
  { label: "Tables", icon: TablesIcon, path: "/owner/tables" },
  { label: "Menu", icon: MenuIcon, path: "/owner/menu" },
  { label: "Employees", icon: EmployeesIcon, path: "/owner/employees" },
];

export default function OwnerBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Hide bottom nav on certain pages
  const hideOnPaths = [
    "/tracking",
    "/affiliate",
    "/profile/settings",
    "/profile/about",
    "/trips/",
    "/deliveries/",
    "/orders/",
    "/reports/",
    "/settings/",
  ];
  const shouldHide = hideOnPaths.some((p) => pathname.startsWith(p));
  if (shouldHide) return null;

  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  );
  const activeIdx = activeIndex === -1 ? 0 : activeIndex;

  return (
    <AnimatePresence>
      <motion.div
        key="bottom-nav"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
            background: isDark
              ? `linear-gradient(180deg, ${alpha("#1C0A00", 0.98)} 0%, ${alpha("#0D0400", 0.99)} 100%)`
              : `linear-gradient(180deg, ${alpha("#fff", 0.98)} 0%, ${alpha("#F8FAFC", 0.99)} 100%)`,
            backdropFilter: "blur(20px)",
            borderTop: `1px solid ${alpha("#D4850A", isDark ? 0.12 : 0.08)}`,
            boxShadow: isDark
              ? `0 -8px 32px ${alpha("#000", 0.4)}`
              : `0 -8px 32px ${alpha("#000", 0.08)}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              height: 64,
              px: 1,
            }}
          >
            {NAV_ITEMS.map((item, i) => {
              const isActive = activeIdx === i;
              const Icon = item.icon;
              return (
                <Box
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    position: "relative",
                    borderRadius: 3,
                    mx: 0.25,
                    my: 0.75,
                    transition: "background 0.2s",
                    "&:active": { transform: "scale(0.94)" },
                  }}
                >
                  {/* Active background pill */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        key="active-bg"
                        layoutId="nav-active-bg"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 12,
                          background: alpha(
                            theme.palette.primary.main,
                            isDark ? 0.15 : 0.09
                          ),
                        }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.12 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    {isActive && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: -4,
                          borderRadius: "50%",
                          background: `radial-gradient(circle, ${alpha(
                            theme.palette.primary.main,
                            0.22
                          )} 0%, transparent 70%)`,
                          pointerEvents: "none",
                        }}
                      />
                    )}
                    <Icon
                      sx={{
                        fontSize: 22,
                        color: isActive
                          ? theme.palette.primary.main
                          : isDark
                            ? alpha("#fff", 0.45)
                            : alpha("#000", 0.38),
                        transition: "color 0.25s",
                        position: "relative",
                        zIndex: 1,
                      }}
                    />
                  </motion.div>

                  <motion.div
                    animate={{ opacity: isActive ? 1 : 0.55 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: isActive ? 800 : 500,
                        letterSpacing: isActive ? 0.3 : 0.1,
                        color: isActive
                          ? theme.palette.primary.main
                          : isDark
                            ? alpha("#fff", 0.5)
                            : alpha("#000", 0.45),
                        lineHeight: 1,
                        transition: "color 0.25s, font-weight 0.2s",
                        userSelect: "none",
                      }}
                    >
                      {item.label}
                    </Typography>
                  </motion.div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        key="dot"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 28, delay: 0.05 }}
                        style={{
                          position: "absolute",
                          bottom: 2,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: theme.palette.primary.main,
                          boxShadow: `0 0 6px ${alpha(theme.palette.primary.main, 0.7)}`,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
}