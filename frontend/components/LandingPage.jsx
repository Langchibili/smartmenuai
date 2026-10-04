"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

const BRAND = "#D4850A";
const TEXT_PRIMARY = "#F9EDD8";
const TEXT_SECONDARY = "#D4A872";

const FEATURES = [
  {
    icon: QrCode2Icon,
    title: "QR menus",
    description: "Keep menus current and make ordering simple at every table.",
  },
  {
    icon: NotificationsActiveOutlinedIcon,
    title: "Live service",
    description: "Orders, waiter calls, and team updates arrive in real time.",
  },
  {
    icon: InsightsOutlinedIcon,
    title: "One workspace",
    description: "Manage tables, staff, branches, and business performance.",
  },
];

export default function LandingPage() {
  return (
    <Box sx={{ width: "100%", maxWidth: 1080, mx: "auto" }}>
      <Stack alignItems="center" textAlign="center" spacing={2.5} sx={{ mb: 6 }}>
        <Chip
          icon={<RestaurantMenuIcon />}
          label="SmartMenu AI · Hospitality, made simpler"
          sx={{
            color: TEXT_SECONDARY,
            border: `1px solid ${alpha(BRAND, 0.3)}`,
            bgcolor: alpha(BRAND, 0.08),
            "& .MuiChip-icon": { color: BRAND },
          }}
        />
        <Typography
          component="h1"
          sx={{
            maxWidth: 820,
            color: TEXT_PRIMARY,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.2rem" },
            lineHeight: 1.08,
            fontWeight: 700,
          }}
        >
          A smarter way to run your restaurant
        </Typography>
        <Typography
          sx={{
            maxWidth: 650,
            color: TEXT_SECONDARY,
            fontSize: { xs: "1rem", sm: "1.15rem" },
            lineHeight: 1.75,
          }}
        >
          Bring QR menus, live orders, waiter alerts, and staff management
          together in one calm, connected workspace.
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ pt: 1, width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            component={Link}
            href="/login"
            variant="contained"
            size="large"
            sx={{
              minWidth: 190,
              py: 1.4,
              borderRadius: 3,
              bgcolor: BRAND,
              color: "#1C0A00",
              fontWeight: 700,
              "&:hover": { bgcolor: "#E8970F" },
            }}
          >
            Log in
          </Button>
          <Button
            component={Link}
            href="/register"
            variant="outlined"
            size="large"
            sx={{
              minWidth: 190,
              py: 1.4,
              borderRadius: 3,
              borderColor: alpha(BRAND, 0.45),
              color: TEXT_PRIMARY,
              fontWeight: 700,
              "&:hover": {
                borderColor: BRAND,
                bgcolor: alpha(BRAND, 0.08),
              },
            }}
          >
            Create new account
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Grid size={{ xs: 12, md: 4 }} key={title}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                p: 3,
                borderRadius: 4,
                bgcolor: "rgba(45,18,0,0.52)",
                border: `1px solid ${alpha(BRAND, 0.16)}`,
              }}
            >
              <Icon sx={{ color: BRAND, fontSize: 28, mb: 2 }} />
              <Typography sx={{ color: TEXT_PRIMARY, fontWeight: 700, mb: 1 }}>
                {title}
              </Typography>
              <Typography sx={{ color: TEXT_SECONDARY, lineHeight: 1.65 }}>
                {description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography
        sx={{ color: "#5F3E22", textAlign: "center", mt: 5, fontSize: 12 }}
      >
        © {new Date().getFullYear()} SmartMenu AI · Built for hospitality
      </Typography>
      <Typography sx={{ textAlign: "center", mt: 1 }}>
        <Button component={Link} href="/support" size="small" sx={{ color: TEXT_SECONDARY }}>
          Contact support
        </Button>
      </Typography>
    </Box>
  );
}
