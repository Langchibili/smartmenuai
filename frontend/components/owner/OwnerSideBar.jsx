"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@/lib/utils";
import { useState } from "react";
import {
    Box,
    Typography,
    Divider,
    IconButton,
    Avatar,
    Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const GOLD = "#F5C842";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";

// ─── Nav items definition ─────────────────────────────────────────────────────
const NAV_ITEMS = [
    { href: "/owner/dashboard", icon: "⊞", label: "Dashboard" },
    { href: "/owner/menu", icon: "📋", label: "Menu" },
    { href: "/owner/tables", icon: "🪑", label: "Tables" },
    { href: "/owner/orders", icon: "🧾", label: "Orders" },
    { href: "/owner/employees", icon: "👥", label: "Employees", roles: ["owner"] },
    { href: "/owner/reports", icon: "📊", label: "Reports" },
    { href: "/owner/settings", icon: "⚙", label: "Settings", roles: ["owner"] },
];

export function OwnerSidebar({ role }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, employee, business, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.roles || item.roles.includes(role)
    );

    const handleLogout = () => {
        logout();
        router.replace("/login");
    };

    return (
        <Box
            component="aside"
            sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
                height: "100dvh",
                position: "sticky",
                top: 0,
                overflow: "hidden",
                transition: "width 300ms",
                width: collapsed ? "72px" : "240px",
                background: "linear-gradient(180deg, #1C0A00 0%, #0D0400 100%)",
                borderRight: "1px solid rgba(212,133,10,0.12)",
            }}
        >
            {/* Liquid gold drip at the top — the signature element */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    top: 0,
                    insetX: 0,
                    pointerEvents: "none",
                    zIndex: 10,
                    height: "120px",
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: `linear-gradient(90deg, transparent 0%, ${GOLD} 30%, ${BRAND} 60%, transparent 100%)`,
                        boxShadow: `0 0 16px rgba(212,133,10,0.7), 0 0 40px rgba(212,133,10,0.3)`,
                    }}
                />
                {/* Drip blobs */}
                {[18, 42, 72, 108, 148, 190].map((left, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: "absolute",
                            top: "3px",
                            left: `${left}px`,
                            width: i % 2 === 0 ? "2px" : "3px",
                            height: `${16 + (i % 3) * 12}px`,
                            borderRadius: "0 0 99px 99px",
                            background: i % 3 === 0 ? GOLD : BRAND,
                            opacity: 0.7,
                            boxShadow: `0 0 6px ${i % 3 === 0 ? "rgba(245,200,66,0.5)" : "rgba(212,133,10,0.5)"}`,
                        }}
                    />
                ))}
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        inset: 0,
                        background: `radial-gradient(ellipse at 50% 0%, rgba(212,133,10,0.12) 0%, transparent 70%)`,
                    }}
                />
            </Box>

            {/* Logo + collapse toggle */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 20,
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    pt: "32px",
                    pb: 2,
                    minHeight: "80px",
                }}
            >
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: `linear-gradient(135deg, ${BRAND}, #6B3318)`,
                        boxShadow: `0 4px 12px rgba(212,133,10,0.35)`,
                    }}
                >
                    <Typography sx={{ fontSize: "1rem" }}>🍺</Typography>
                </Box>
                {!collapsed && (
                    <Box sx={{ ml: 1.5, minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontSize: "0.875rem",
                                fontFamily: '"Playfair Display", serif',
                                fontWeight: 700,
                                color: TEXT_P,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {business?.business_name ?? "SmartMenu AI"}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "0.75rem",
                                color: TEXT_M,
                                textTransform: "capitalize",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {role}
                        </Typography>
                    </Box>
                )}
                <IconButton
                    onClick={() => setCollapsed((v) => !v)}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    sx={{
                        ml: "auto",
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        color: TEXT_D,
                        background: "rgba(45,18,0,0.6)",
                        border: "1px solid rgba(107,51,24,0.3)",
                        "&:hover": {
                            background: "rgba(45,18,0,0.8)",
                            color: TEXT_M,
                        },
                    }}
                >
                    <Typography sx={{ fontSize: "10px", lineHeight: 1 }}>
                        {collapsed ? "▶" : "◀"}
                    </Typography>
                </IconButton>
            </Box>

            {/* Divider */}
            <Divider
                sx={{
                    mx: 1.5,
                    mb: 1,
                    borderColor: "rgba(107,51,24,0.25)",
                }}
            />

            {/* Nav items */}
            <Box
                component="nav"
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                    px: 1,
                    py: 1,
                }}
            >
                {visibleItems.map((item) => {
                    const active =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Button
                            key={item.href}
                            component={Link}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            sx={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: collapsed ? "center" : "flex-start",
                                gap: collapsed ? 0 : 1.5,
                                px: collapsed ? 0 : 1.5,
                                py: 1.2,
                                mb: 0.3,
                                borderRadius: "12px",
                                textTransform: "none",
                                color: active ? BRAND : TEXT_S,
                                background: active ? alpha(BRAND, 0.12) : "transparent",
                                border: active ? `1px solid ${alpha(BRAND, 0.2)}` : "1px solid transparent",
                                fontWeight: active ? 600 : 400,
                                fontSize: "0.875rem",
                                transition: "all 0.2s",
                                "&:hover": {
                                    background: active ? alpha(BRAND, 0.15) : alpha(BRAND, 0.06),
                                    color: active ? BRAND : TEXT_S,
                                },
                            }}
                        >
                            <Typography sx={{ fontSize: "1rem", width: 20, textAlign: "center", flexShrink: 0 }}>
                                {item.icon}
                            </Typography>
                            {!collapsed && (
                                <Typography
                                    sx={{
                                        flex: 1,
                                        textAlign: "left",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            )}
                            {!collapsed && item.badge != null && item.badge > 0 && (
                                <Box
                                    sx={{
                                        ml: "auto",
                                        px: 0.8,
                                        py: 0.3,
                                        borderRadius: "999px",
                                        background: alpha(BRAND, 0.2),
                                        color: BRAND,
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {item.badge}
                                </Box>
                            )}
                        </Button>
                    );
                })}
            </Box>

            {/* Divider */}
            <Divider
                sx={{
                    mx: 1.5,
                    mb: 1.5,
                    borderColor: "rgba(107,51,24,0.25)",
                }}
            />

            {/* User profile */}
            <Box sx={{ px: 1.5, pb: 2.5 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 1.5,
                        py: 1.5,
                        borderRadius: "12px",
                        justifyContent: collapsed ? "center" : "flex-start",
                    }}
                >
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${BRAND}, #6B3318)`,
                            boxShadow: `0 0 10px ${alpha(BRAND, 0.2)}`,
                        }}
                    >
                        {initials(employee?.full_name ?? user?.email ?? "U")}
                    </Avatar>
                    {!collapsed && (
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: TEXT_S,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {employee?.full_name ?? user?.email}
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "0.7rem",
                                    color: TEXT_D,
                                    textTransform: "capitalize",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {employee?.role ?? "user"}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Button
                    onClick={handleLogout}
                    sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: collapsed ? 0 : 1.5,
                        px: collapsed ? 0 : 1.5,
                        py: 1.2,
                        borderRadius: "12px",
                        textTransform: "none",
                        color: TEXT_S,
                        fontWeight: 400,
                        fontSize: "0.875rem",
                        "&:hover": {
                            background: alpha(BRAND, 0.06),
                        },
                    }}
                >
                    <Typography sx={{ fontSize: "1rem", width: 20, textAlign: "center", flexShrink: 0 }}>
                        ↩
                    </Typography>
                    {!collapsed && (
                        <Typography sx={{ flex: 1, textAlign: "left" }}>
                            Sign out
                        </Typography>
                    )}
                </Button>
            </Box>
        </Box>
    );
}