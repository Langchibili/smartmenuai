// ─────────────────────────────────────────────────────────────────────────────
// FILE: smartmenuai/frontend/app/(main)/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Box, CircularProgress, Typography } from "@mui/material";
import LandingPage from "@/components/LandingPage";

export default function MainPage() {
    const { user, employee, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // wait for session to load
        if (!user) return;

        // Role-based redirect
        const role = employee?.role;
        if (role === "waiter") {
            router.replace("/waiter");
        } else {
            // Owner dashboard lives under the owner route segment.
            router.replace("/owner/dashboard");
        }
    }, [user, employee, loading, router]);

    if (!loading && !user) {
        return (
            <Box
                sx={{
                    minHeight: "100dvh",
                    width: "100%",
                    px: { xs: 2, sm: 3 },
                    py: { xs: 5, sm: 8 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "radial-gradient(ellipse at 50% 0%, rgba(212,133,10,0.12), transparent 55%), #0D0400",
                }}
            >
                <LandingPage />
            </Box>
        );
    }

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