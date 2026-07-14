import { clsx } from "clsx";

/** Merge CSS classes safely (without Tailwind conflict resolution) */
export function cn(...inputs) {
    return clsx(inputs);
}

/** Format a number as currency */
export function formatCurrency(
    amount,
    currency = "USD",
    locale = "en-US"
) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

/** Format a date string */
export function formatDate(
    date,
    opts = {
        day: "numeric",
        month: "short",
        year: "numeric",
    }
) {
    return new Intl.DateTimeFormat("en-US", opts).format(new Date(date));
}

/** Format a relative time ("3 minutes ago") */
export function formatRelativeTime(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

/** Format a time string (HH:mm) to 12h */
export function formatTime(date) {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(date));
}

/** Generate a random session ID (for anonymous customer sessions) */
export function generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Get or create a persistent customer session ID */
export function getOrCreateSessionId() {
    if (typeof window === "undefined") return generateSessionId();
    const key = "smartmenu_session";
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = generateSessionId();
        sessionStorage.setItem(key, id);
    }
    return id;
}

/** Order status label */
export function orderStatusLabel(status) {
    const map = {
        pending: "Pending",
        accepted: "Accepted",
        preparing: "Preparing",
        served: "Served",
        completed: "Completed",
        cancelled: "Cancelled",
    };
    return map[status] ?? status;
}

/** Table status label */
export function tableStatusLabel(status) {
    const map = {
        available: "Available",
        occupied: "Occupied",
        ordering: "Ordering",
        needs_waiter: "Needs Waiter",
        bill_requested: "Bill Requested",
    };
    return map[status] ?? status;
}

/** Truncate a string with ellipsis */
export function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + "…" : str;
}

/** Get initials from a name */
export function initials(name) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase();
}

/** Download a URL as file */
export function downloadUrl(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}

/** Sleep for ms milliseconds */
export const sleep = (ms) =>
    new Promise((r) => setTimeout(r, ms));

/** Clamp a number between min and max */
export const clamp = (n, min, max) =>
    Math.min(Math.max(n, min), max);

/** Debounce a function */
export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/** Safe JSON parse */
export function safeJson(str, fallback) {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
}

/** Build a QR menu URL */
export function buildMenuUrl(
    businessId,
    branchId,
    tableId
) {
    const base =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${base}/m/${businessId}/${branchId}/${tableId}`;
}

/** Compute order subtotal from items */
export function calcSubtotal(items) {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}