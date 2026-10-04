"use client";

import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LandingPage from "@/components/LandingPage";

export default function BusinessLandingPage() {
  const { user, employee, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(employee?.role === "waiter" ? "/waiter" : "/owner/dashboard");
    }
  }, [employee?.role, loading, router, user]);

  if (loading || user) {
    return (
      <Box sx={{ display: "grid", minHeight: "100dvh", placeItems: "center", bgcolor: "#0D0400" }}>
        <CircularProgress sx={{ color: "#D4850A" }} />
      </Box>
    );
  }

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
