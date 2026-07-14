// ─────────────────────────────────────────────────────────────────────────────
// FILE: smartmenuai/frontend/app/(main)/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function MainPage() {
    const { user, employee, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // wait for session to load
        if (!user) {
            router.replace("/login");
            return;
        }

        // Role-based redirect
        const role = employee?.role;
        if (role === "waiter") {
            router.replace("/waiter");
        } else {
            // owner, manager, or any other non‑waiter role
            router.replace("/dashboard");
        }
    }, [user, employee, loading, router]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100dvh",
                background: "#0D0400",
            }}
        >
            <CircularProgress sx={{ color: "#D4850A", mb: 2 }} />
            <Typography sx={{ color: "#D4A872", fontSize: "0.9rem" }}>
                Loading your workspace…
            </Typography>
        </Box>
    );
}