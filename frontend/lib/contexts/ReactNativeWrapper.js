'use client';
// FILE: smartmenuai/frontend/lib/contexts/ReactNativeWrapper.jsx
//
// Full-featured React Native ↔ WebView bridge for SmartMenu AI.
//
// What changed from the original:
//  • INITIALIZE_SERVICES message + servicesInitialized state (required by layout.jsx)
//  • initializeNativeServices(userId, frontendName, socketUrl) helper
//  • Real-time socket event forwarding: ORDER_NEW, ORDER_STATUS_UPDATED,
//    WAITER_CALL_NEW, WAITER_CALL_ACKNOWLEDGED, TABLE_STATUS_UPDATED,
//    SOCKET_CONNECTED, SOCKET_DISCONNECTED, NOTIFICATION_NEW
//  • getNativeLocation() + startLocationTracking() / stopLocationTracking()
//    that layout.jsx calls directly
//  • PLAY_AUDIO message support (waiter alerts page plays its own beep,
//    but native can also trigger sounds)
//  • Connection-lost state exposed as isConnected
//  • All event constants match AppContent.tsx WEBVIEW_EVENTS exactly
//  • Fully backward-compatible: everything the old wrapper exposed still works

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
} from 'react';
import { getToken } from '../api';

// ─── Context ─────────────────────────────────────────────────────────────────
const ReactNativeContext = createContext(null);

export const useReactNative = () => {
    const ctx = useContext(ReactNativeContext);
    if (!ctx) throw new Error('useReactNative must be used within ReactNativeWrapper');
    return ctx;
};

// ─── WEBVIEW_EVENTS — must mirror AppContent.tsx WEBVIEW_EVENTS exactly ──────
// These are the `type` strings that AppContent posts INTO the WebView.
const WEBVIEW_EVENTS = {
    ORDER_NEW: 'ORDER_NEW',
    ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
    WAITER_CALL_NEW: 'WAITER_CALL_NEW',
    WAITER_CALL_ACKNOWLEDGED: 'WAITER_CALL_ACKNOWLEDGED',
    WAITER_CALL_RESOLVED: 'WAITER_CALL_RESOLVED',
    TABLE_STATUS_UPDATED: 'TABLE_STATUS_UPDATED',
    SOCKET_CONNECTED: 'SOCKET_CONNECTED',
    SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED',
    NOTIFICATION_NEW: 'NOTIFICATION_NEW',
    LOCATION_UPDATE: 'LOCATION_UPDATE',
};

// ─── Messages we POST to native — AppContent.tsx handles these in onMessage() ─
const NATIVE_MESSAGES = {
    INITIALIZE_SERVICES: 'INITIALIZE_SERVICES',
    REQUEST_PERMISSION: 'REQUEST_PERMISSION',
    CHECK_PERMISSION: 'CHECK_PERMISSION',
    GET_CURRENT_LOCATION: 'GET_CURRENT_LOCATION',
    SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
    PLAY_AUDIO: 'PLAY_AUDIO',
    LOG_DATA: 'LOG_DATA',
    THEME_MODE_CHANGE: 'THEME_MODE_CHANGE',
    OPEN_CUSTOMER_QR_SCANNER: 'OPEN_CUSTOMER_QR_SCANNER',
    DOWNLOAD_FILE: 'DOWNLOAD_FILE',
    OPEN_EMAIL: 'OPEN_EMAIL',
    REQUEST_DRAW_OVER_PERMISSION: 'REQUEST_DRAW_OVER_PERMISSION',
    CONFIRM_DRAW_OVER_PERMISSION: 'CONFIRM_DRAW_OVER_PERMISSION',
};

// ─── Per-request timeouts ─────────────────────────────────────────────────────
const REQUEST_TIMEOUTS = {
    GET_CURRENT_LOCATION: 10_000,
    REQUEST_PERMISSION: 15_000,
    CHECK_PERMISSION: 5_000,
    INITIALIZE_SERVICES: 20_000,
    DEFAULT: 30_000,
};

const getTimeout = (type) => REQUEST_TIMEOUTS[type] ?? REQUEST_TIMEOUTS.DEFAULT;

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ReactNativeWrapper({ children }) {

    // ── Environment ───────────────────────────────────────────────────────
    const [isNative, setIsNative] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isConnected, setIsConnected] = useState(true);   // network / socket health
    const [servicesInitialized, setServicesInitialized] = useState(false);

    // ── Permissions ───────────────────────────────────────────────────────
    const [permissions, setPermissions] = useState({
        location: null,
        notification: null,
    });

    // ── Request plumbing ──────────────────────────────────────────────────
    const pendingRequests = useRef(new Map());
    const requestIdCounter = useRef(0);
    const messageHandlers = useRef(new Map());   // type → Set<handler>

    // ── Location tracking ─────────────────────────────────────────────────
    const locationIntervalRef = useRef(null);
    const locationCallbacksRef = useRef(new Set());  // external subscribers

    // ── Native environment detection ──────────────────────────────────────
    useEffect(() => {
        let checkCount = 0;
        const maxChecks = 180;

        const check = () => {
            if (typeof window !== 'undefined' && !!window.ReactNativeWebView) {
                setIsNative(true);
                setIsChecking(false);
                return true;
            }
            checkCount++;
            if (checkCount >= maxChecks) {
                setIsNative(false);
                setIsChecking(false);
                return true;
            }
            return false;
        };

        if (!check()) {
            const interval = setInterval(() => { if (check()) clearInterval(interval); }, 1000);
            return () => clearInterval(interval);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Core: post a message to native and await its response
    // ─────────────────────────────────────────────────────────────────────
    const sendToNative = useCallback((type, payload = {}) => {
        if (typeof window === 'undefined' || !window.ReactNativeWebView) {
            return Promise.reject(new Error('Not running in React Native environment'));
        }

        return new Promise((resolve, reject) => {
            const requestId = `req_${++requestIdCounter.current}_${Date.now()}`;
            const duration = getTimeout(type);

            const entry = { resolve, reject };
            pendingRequests.current.set(requestId, entry);

            entry.timeoutId = setTimeout(() => {
                if (pendingRequests.current.has(requestId)) {
                    pendingRequests.current.delete(requestId);
                    reject(new Error(`Request timeout after ${duration}ms: ${type}`));
                }
            }, duration);

            try {
                window.ReactNativeWebView.postMessage(
                    JSON.stringify({ type, requestId, payload })
                );
            } catch (err) {
                clearTimeout(entry.timeoutId);
                pendingRequests.current.delete(requestId);
                reject(err);
            }
        });
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Subscribe to events pushed FROM native (no requestId)
    // ─────────────────────────────────────────────────────────────────────
    const on = useCallback((type, handler) => {
        if (!messageHandlers.current.has(type)) {
            messageHandlers.current.set(type, new Set());
        }
        messageHandlers.current.get(type).add(handler);
        return () => messageHandlers.current.get(type)?.delete(handler);
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Global inbound message listener
    // Handles:  (a) promise responses  (b) push events from native
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMessage = (event) => {
            let data;
            try {
                data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            } catch { return; }

            const { type, requestId, payload, error } = data ?? {};

            // ── (a) Response for a pending sendToNative() call ────────────
            if (requestId && pendingRequests.current.has(requestId)) {
                const { resolve, reject, timeoutId } = pendingRequests.current.get(requestId);
                clearTimeout(timeoutId);
                pendingRequests.current.delete(requestId);
                if (error) {
                    reject(new Error(typeof error === 'string' ? error : JSON.stringify(error)));
                } else {
                    resolve(payload);
                }
                return;
            }

            // ── (b) Push events broadcast from AppContent.tsx ─────────────

            // Dispatch to registered handlers
            messageHandlers.current.get(type)?.forEach(h => h(payload));

            // Built-in state side-effects
            switch (type) {
                // Permission changes
                case 'PERMISSION_RESULT':
                    if (payload?.permissionType) {
                        setPermissions(prev => ({ ...prev, [payload.permissionType]: payload.status }));
                    }
                    break;

                // Socket connectivity reflected in isConnected
                case WEBVIEW_EVENTS.SOCKET_CONNECTED:
                    setIsConnected(true);
                    break;
                case WEBVIEW_EVENTS.SOCKET_DISCONNECTED:
                    setIsConnected(false);
                    break;

                // Location updates forwarded from native GPS tracking
                case WEBVIEW_EVENTS.LOCATION_UPDATE:
                    if (payload) {
                        locationCallbacksRef.current.forEach(cb => cb(payload));
                    }
                    break;

                case 'ORDER_NOTIFICATION_TAPPED':
                    window.location.assign(
                        window.location.pathname.startsWith('/waiter')
                            ? '/waiter/orders'
                            : '/owner/orders'
                    );
                    break;
                case 'WAITER_CALL_NOTIFICATION_TAPPED':
                    window.location.assign(
                        window.location.pathname.startsWith('/waiter')
                            ? '/waiter/alerts'
                            : '/owner/dashboard'
                    );
                    break;

                default:
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        document.addEventListener('message', handleMessage);   // Android WebView
        return () => {
            window.removeEventListener('message', handleMessage);
            document.removeEventListener('message', handleMessage);
        };
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // initializeNativeServices — called by layout.jsx after login
    // Mirrors what AppContent.tsx expects in INITIALIZE_SERVICES payload
    // ─────────────────────────────────────────────────────────────────────
    const initializeNativeServices = useCallback(async (userId, frontendName, socketServerUrl) => {
        if (!isNative) {
            // In web context we consider services always "ready"
            setServicesInitialized(true);
            return { success: true, native: false };
        }

        try {
            const result = await sendToNative(NATIVE_MESSAGES.INITIALIZE_SERVICES, {
                userId,
                frontendName,   // 'owner' | 'employee' — sent to AppContent
                socketServerUrl: socketServerUrl || '',
                authToken: getToken(),
            });

            if (result?.success) {
                setServicesInitialized(true);
                // Reflect any permissions that came back
                if (result.permissions) {
                    setPermissions(prev => ({ ...prev, ...result.permissions }));
                }
            }

            return result ?? { success: false, error: 'No response from native' };
        } catch (err) {
            console.error('[RNWrapper] initializeNativeServices:', err);
            return { success: false, error: err.message };
        }
    }, [isNative, sendToNative]);

    const openCustomerQrScanner = useCallback(
        () => sendToNative(NATIVE_MESSAGES.OPEN_CUSTOMER_QR_SCANNER),
        [sendToNative],
    );

    const downloadFile = useCallback(
        (fileName, dataUrl) => sendToNative(NATIVE_MESSAGES.DOWNLOAD_FILE, { fileName, dataUrl }),
        [sendToNative],
    );

    const openEmail = useCallback(
        (email, subject) => sendToNative(NATIVE_MESSAGES.OPEN_EMAIL, { email, subject }),
        [sendToNative],
    );

    const requestDrawOverPermission = useCallback(
        () => sendToNative(NATIVE_MESSAGES.REQUEST_DRAW_OVER_PERMISSION),
        [sendToNative],
    );

    const confirmDrawOverPermission = useCallback(
        () => sendToNative(NATIVE_MESSAGES.CONFIRM_DRAW_OVER_PERMISSION),
        [sendToNative],
    );

    // ─────────────────────────────────────────────────────────────────────
    // Permissions
    // ─────────────────────────────────────────────────────────────────────
    const requestPermission = useCallback(async (permissionType) => {
        if (permissions[permissionType] === 'granted') return 'granted';

        if (isNative) {
            try {
                const result = await sendToNative(NATIVE_MESSAGES.REQUEST_PERMISSION, { permissionType });
                setPermissions(prev => ({ ...prev, [permissionType]: result.status }));
                return result.status;
            } catch (err) {
                console.error('[RNWrapper] requestPermission:', err);
                return 'denied';
            }
        }

        // Web fallbacks
        if (permissionType === 'location') {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                if (result.state === 'granted' || result.state === 'prompt') {
                    return new Promise((resolve) => {
                        navigator.geolocation.getCurrentPosition(
                            () => { setPermissions(p => ({ ...p, location: 'granted' })); resolve('granted'); },
                            () => { setPermissions(p => ({ ...p, location: 'denied' })); resolve('denied'); },
                            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
                        );
                    });
                }
                return result.state;
            } catch { return 'denied'; }
        }

        if (permissionType === 'notification') {
            try {
                const status = await Notification.requestPermission();
                setPermissions(p => ({ ...p, notification: status }));
                return status;
            } catch { return 'denied'; }
        }

        return 'unsupported';
    }, [isNative, sendToNative, permissions]);

    const checkPermission = useCallback(async (permissionType) => {
        if (isNative) {
            try {
                const result = await sendToNative(NATIVE_MESSAGES.CHECK_PERMISSION, { permissionType });
                setPermissions(p => ({ ...p, [permissionType]: result.status }));
                return result.status;
            } catch { return 'denied'; }
        }
        if (permissionType === 'location') {
            try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { return 'prompt'; }
        }
        if (permissionType === 'notification') return Notification.permission;
        return 'unsupported';
    }, [isNative, sendToNative]);

    // ─────────────────────────────────────────────────────────────────────
    // Location — one-time fetch
    // ─────────────────────────────────────────────────────────────────────
    const getCurrentLocation = useCallback(async () => {
        if (isNative) {
            const loc = await sendToNative(NATIVE_MESSAGES.GET_CURRENT_LOCATION, {});
            return {
                lat: loc?.coords?.latitude ?? loc?.lat,
                lng: loc?.coords?.longitude ?? loc?.lng,
                accuracy: loc?.coords?.accuracy ?? loc?.accuracy,
                heading: loc?.coords?.heading ?? loc?.heading,
                speed: loc?.coords?.speed ?? loc?.speed,
                timestamp: loc?.timestamp,
            };
        }

        // Web fallback
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                    timestamp: pos.timestamp,
                }),
                reject,
                { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
            );
        });
    }, [isNative, sendToNative]);

    // ─────────────────────────────────────────────────────────────────────
    // getNativeLocation — fire-and-forget single fetch
    // Used by layout.jsx:  if (isNative) getNativeLocation()
    // ─────────────────────────────────────────────────────────────────────
    const getNativeLocation = useCallback(() => {
        if (isNative && window.ReactNativeWebView) {
            try {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: NATIVE_MESSAGES.GET_CURRENT_LOCATION,
                    requestId: `init_loc_${Date.now()}`,
                    payload: {},
                }));
            } catch (err) {
                console.error('[RNWrapper] getNativeLocation:', err);
            }
        } else if (!isNative && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const location = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                    };
                    locationCallbacksRef.current.forEach(cb => cb(location));
                },
                (err) => console.warn('[RNWrapper] Web geolocation error:', err),
                { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
            );
        }
    }, [isNative]);

    // ─────────────────────────────────────────────────────────────────────
    // startLocationTracking / stopLocationTracking
    // Called by layout.jsx depending on current route
    // In native: native side handles the tracking loop; we just subscribe.
    // In web: we run a setInterval here.
    // ─────────────────────────────────────────────────────────────────────
    const startLocationTracking = useCallback((onLocation, intervalMs = 15_000) => {
        // Register subscriber if provided
        if (typeof onLocation === 'function') {
            locationCallbacksRef.current.add(onLocation);
        }

        // Avoid double-starting
        if (locationIntervalRef.current) return;

        if (isNative) {
            // Native side (BackgroundService) drives tracking;
            // we already receive LOCATION_UPDATE events via the message listener.
            // Just do an immediate fetch so the server has a fresh fix now.
            getNativeLocation();
        } else {
            // Web fallback: poll geolocation on an interval
            if (!navigator.geolocation) return;

            const tick = () => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const location = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            heading: pos.coords.heading,
                            speed: pos.coords.speed,
                            timestamp: pos.timestamp,
                        };
                        locationCallbacksRef.current.forEach(cb => cb(location));
                    },
                    (err) => console.warn('[RNWrapper] Tracking error:', err),
                    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
                );
            };

            tick(); // immediate
            locationIntervalRef.current = setInterval(tick, intervalMs);
        }
    }, [isNative, getNativeLocation]);

    const stopLocationTracking = useCallback((onLocation) => {
        // Remove a specific subscriber, or clear all if none specified
        if (typeof onLocation === 'function') {
            locationCallbacksRef.current.delete(onLocation);
        } else {
            locationCallbacksRef.current.clear();
        }

        // Stop the web interval if no more subscribers
        if (locationCallbacksRef.current.size === 0 && locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Notifications
    // ─────────────────────────────────────────────────────────────────────
    const showNotification = useCallback(async (notification) => {
        if (isNative) return sendToNative(NATIVE_MESSAGES.SHOW_NOTIFICATION, notification);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon,
                badge: notification.badge,
                data: notification.data,
            });
            return { shown: true };
        }
        return { shown: false, reason: 'permission_denied' };
    }, [isNative, sendToNative]);

    // ─────────────────────────────────────────────────────────────────────
    // Audio — native can play sounds via PLAY_AUDIO message
    // ─────────────────────────────────────────────────────────────────────
    const playAudio = useCallback(async (soundFile = 'alert') => {
        if (isNative) {
            try {
                return await sendToNative(NATIVE_MESSAGES.PLAY_AUDIO, { soundFile });
            } catch (err) {
                console.warn('[RNWrapper] playAudio:', err);
                return { success: false };
            }
        }
        // Web fallback: Web Audio API beep (keeps alerts working in browser too)
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.45);
            return { success: true };
        } catch {
            return { success: false };
        }
    }, [isNative, sendToNative]);

    // ─────────────────────────────────────────────────────────────────────
    // Theme mode sync
    // ─────────────────────────────────────────────────────────────────────
    const handleChangeThemeMode = useCallback(async ({ color, mode }) => {
        if (isNative) return sendToNative(NATIVE_MESSAGES.THEME_MODE_CHANGE, { color, mode });
        return { success: true };
    }, [isNative, sendToNative]);

    // ─────────────────────────────────────────────────────────────────────
    // Convenience: log data to native console
    // ─────────────────────────────────────────────────────────────────────
    const logToNative = useCallback((data) => {
        if (!isNative) return;
        try {
            window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: NATIVE_MESSAGES.LOG_DATA, payload: data })
            );
        } catch { }
    }, [isNative]);

    // ─────────────────────────────────────────────────────────────────────
    // Cleanup on unmount
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
            // Reject all pending requests cleanly
            pendingRequests.current.forEach(({ reject, timeoutId }) => {
                clearTimeout(timeoutId);
                reject(new Error('ReactNativeWrapper unmounted'));
            });
            pendingRequests.current.clear();
        };
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Context value
    // ─────────────────────────────────────────────────────────────────────
    const value = {
        // State
        isNative,
        isChecking,
        isConnected,
        servicesInitialized,
        permissions,

        // Core bridge
        sendToNative,
        openCustomerQrScanner,
        downloadFile,
        openEmail,
        requestDrawOverPermission,
        confirmDrawOverPermission,
        on,

        // Services
        initializeNativeServices,

        // Permissions
        requestPermission,
        checkPermission,

        // Location
        getCurrentLocation,
        getNativeLocation,
        startLocationTracking,
        stopLocationTracking,

        // Notifications & audio
        showNotification,
        playAudio,

        // Theme
        handleChangeThemeMode,

        // Debug
        logToNative,

        // Event type constants (re-export for consumers)
        WEBVIEW_EVENTS,
    };

    return (
        <ReactNativeContext.Provider value={value}>
            {children}
        </ReactNativeContext.Provider>
    );
}

export default ReactNativeWrapper;