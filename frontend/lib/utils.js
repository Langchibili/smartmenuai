import { clsx } from "clsx";

/** Merge CSS classes safely (without Tailwind conflict resolution) */
export function cn(...inputs) {
    return clsx(inputs);
}

export const DEFAULT_CURRENCY = {
    name: "Zambian Kwacha",
    code: "ZMW",
    symbol: "K",
};

/** Format a number as currency */
export function formatCurrency(
    amount,
    currency = DEFAULT_CURRENCY.code,
    locale = "en-US"
) {
    if (currency === "ZMW") {
        return `K ${new Intl.NumberFormat(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount) || 0)}`;
    }
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

/** Select the staff dashboard, or onboarding for a newly registered owner. */
export function getAuthenticatedDashboardPath(employee) {
    if (employee?.role === "waiter") return "/waiter";
    if (employee?.role === "owner" || employee?.role === "manager") {
        return "/owner/dashboard";
    }
    return "/onboarding";
}

/** Resolve Strapi media paths against the configured API host. */
export function getMediaUrl(path) {
    if (!path) return null;
    if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(path) || /^data:/i.test(path)) return path;

    const apiUrl =
        process.env.NEXT_PUBLIC_MEDIA_URL ||
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        "http://localhost:1357";
    const root = apiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    return `${root}/${String(path).replace(/^\/+/, "")}`;
}

export function getBusinessWord(business, word, fallback) {
    const businessType = String(business?.business_type || "").toLocaleLowerCase();
    const override = business?.terminology?.[word] ??
        business?.business_terminology?.[businessType]?.[word];
    return typeof override === "string" && override.trim() ? override.trim() : fallback;
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
    if (globalThis.crypto?.randomUUID) return `sess_${globalThis.crypto.randomUUID()}`;
    if (globalThis.crypto?.getRandomValues) {
        const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
        return `sess_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    }
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

/** Get the opaque, persistent identity used for anonymous customer history. */
export function getOrCreateCustomerInstallationId() {
    if (typeof window === "undefined") return "";
    const key = "smartmenu_customer_installation_id";
    let id = window.localStorage.getItem(key);
    if (!id) {
        if (globalThis.crypto?.randomUUID) {
            id = globalThis.crypto.randomUUID();
        } else if (globalThis.crypto?.getRandomValues) {
            const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
            id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
        } else {
            throw new Error("Secure browser storage is unavailable for customer history.");
        }
        window.localStorage.setItem(key, id);
    }
    return id;
}

/** Build a customer session shared across businesses for the same installation. */
export function getCustomerSessionId(installationId) {
    if (!installationId) return "";
    return `customer-${installationId}`;
}

export function getLastCustomerMenuUrl() {
    if (typeof window === "undefined") return "/";
    return window.localStorage.getItem("smartmenu_last_customer_menu_url") || "/";
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
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3007";
    return `${base}/m/${businessId}/${branchId}/${tableId}`;
}

/** Compute order subtotal from items */
export function calcSubtotal(items) {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}