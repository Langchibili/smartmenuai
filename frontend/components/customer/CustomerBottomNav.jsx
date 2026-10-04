"use client";

import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import { useRouter } from "next/navigation";

export default function CustomerBottomNav({ selected, menuHref = "/" }) {
  const router = useRouter();

  return (
    <BottomNavigation
      showLabels
      value={selected}
      sx={{
        position: "fixed",
        zIndex: 6,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "#1C0A00",
        borderTop: "1px solid #49301B",
        "& .MuiBottomNavigationAction-root": { color: "#D4A872" },
        "& .Mui-selected": { color: "#F5C842" },
      }}
    >
      <BottomNavigationAction label="Menu" value="menu" onClick={() => router.push(menuHref)} />
      <BottomNavigationAction
        label="Orders"
        value="orders"
        onClick={() => router.push("/customer/orders")}
      />
      <BottomNavigationAction
        label="Businesses"
        value="businesses"
        onClick={() => router.push("/customer/places")}
      />
      <BottomNavigationAction
        label="Support"
        value="support"
        icon={<SupportAgentOutlinedIcon />}
        onClick={() => router.push("/support")}
      />
    </BottomNavigation>
  );
}
