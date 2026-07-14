"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import { alpha } from "@mui/material/styles";

const WAITER_NAV = [
    { href: "/waiter", icon: "🪑", label: "Tables" },
    { href: "/waiter/orders", icon: "🧾", label: "Orders" },
    { href: "/waiter/alerts", icon: "🔔", label: "Alerts" },
];

export function WaiterBottomNav() {
    const pathname = usePathname();

    return (
        <Box
            component="nav"
            sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                px: 2,
                pb: "env(safe-area-inset-bottom, 0px)",
                background: "rgba(13,4,0,0.95)",
                backdropFilter: "blur(16px)",
                borderTop: "1px solid rgba(212,133,10,0.15)",
                height: "64px",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
            }}
        >
            {WAITER_NAV.map((item) => {
                const active =
                    pathname === item.href ||
                    (item.href !== "/waiter" && pathname.startsWith(item.href));

                return (
                    <Button
                        key={item.href}
                        component={Link}
                        href={item.href}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.2,
                            px: 2,
                            py: 0.5,
                            borderRadius: "12px",
                            minWidth: 0,
                            textTransform: "none",
                            color: active ? "#D4850A" : "#5F3E22",
                            transition: "all 150ms",
                            position: "relative",
                            "&:hover": {
                                background: "none",
                            },
                        }}
                    >
                        <Box
                            component="span"
                            sx={{
                                fontSize: "1.25rem",
                                transition: "transform 200ms",
                                transform: active ? "scale(1.15)" : "scale(1)",
                            }}
                        >
                            {item.icon}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 500,
                                color: "inherit",
                                textShadow: active ? "0 0 8px rgba(212,133,10,0.5)" : "none",
                            }}
                        >
                            {item.label}
                        </Typography>
                        {active && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 2,
                                    width: 4,
                                    height: 4,
                                    borderRadius: "50%",
                                    background: "#D4850A",
                                    boxShadow: "0 0 6px rgba(212,133,10,0.8)",
                                }}
                            />
                        )}
                    </Button>
                );
            })}
        </Box>
    );
}