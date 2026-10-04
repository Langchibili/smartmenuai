"use client";

import { Box } from "@mui/material";
import MainNavigation from "@/components/navigation/MainNavigation";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user || pathname === "/") return children;

  return (
    <>
      <MainNavigation />
      <Box component="main" sx={{ minHeight: "calc(100dvh - 122px)", pb: 10 }}>
        {children}
      </Box>
    </>
  );
}
