"use client";

import { Box } from "@mui/material";
import MainNavigation from "@/components/navigation/MainNavigation";
import { useAuth } from "@/lib/auth-context";

export default function MainLayout({ children }) {
  const { user } = useAuth();
  if (!user) return children;

  return (
    <>
      <MainNavigation />
      <Box component="main" sx={{ minHeight: "calc(100dvh - 122px)", pb: 10 }}>
        {children}
      </Box>
    </>
  );
}
