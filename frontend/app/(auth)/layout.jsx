import { Box } from "@mui/material";

export const metadata = {
  title: "SmartMenu AI",
};

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(212,133,10,0.12), transparent 55%), #0D0400",
      }}
    >
      {children}
    </Box>
  );
}
