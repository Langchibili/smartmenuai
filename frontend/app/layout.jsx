'use client'
import "./globals.css";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useReactNative, ReactNativeWrapper } from '@/lib/contexts/ReactNativeWrapper';

// Public routes that never redirect to login
const PUBLIC_ROUTES = [
    "/login",
    "/register",
    "/onboarding",
    "/accept-invite",
    "/setup-platform-master",
    "/forgot-password",
    "/reset-password",
    "/business-landing",
    "/m/",
    "/customer",
    "/deal-and-promos",
];

export default function RootLayout({ children }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <meta name="theme-color" content="#D4850A" />

                <title>SmartMenu AI</title>
                <meta name="description" content="Premium QR-based restaurant ordering and management platform. Digital menus, real-time orders, staff management — all in one place." />
                <meta name="keywords" content="restaurant, menu, QR code, ordering, POS, hospitality" />
                <meta name="author" content="SmartMenu AI" />
                <meta name="creator" content="SmartMenu AI" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="SmartMenu AI" />
                <meta property="og:description" content="Premium QR-based restaurant ordering and management platform." />
                <meta property="og:site_name" content="SmartMenu AI" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="SmartMenu AI" />
                <meta name="twitter:description" content="Premium QR-based restaurant ordering and management platform." />

                {/* Icons */}
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="manifest" href="/site.webmanifest" />
            </head>
            <body>
                <ReactNativeWrapper>
                    <AuthProvider>
                        <AppShell>
                            {children}
                        </AppShell>
                    </AuthProvider>
                </ReactNativeWrapper>
            </body>
        </html>
    );
}

function AppShell({ children }) {
    const { user, employee, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const {
        isNative,
        servicesInitialized,
        initializeNativeServices,
        getNativeLocation,
        startLocationTracking,
        stopLocationTracking,
    } = useReactNative();

    const isPublic = pathname === "/" || PUBLIC_ROUTES.some(r => pathname.startsWith(r));
    useEffect(() => {
        if (loading) return;
        if (!user && !isPublic) {
            router.replace('/login');
        }
    }, [user, loading, isPublic, pathname, router]);

    useEffect(() => {
        if (user) {
            const initializeNativeCode = async () => {
                if (isNative && !servicesInitialized && user?.id) {
                    console.log('Initializing native staff services...');
                    const result = await initializeNativeServices(
                        user.id,
                        employee?.role === 'owner' ? 'owner' : 'employee',
                        process.env.NEXT_PUBLIC_DEVICE_SOCKET_URL
                    );

                    if (window.ReactNativeWebView || result.success) {
                        if (typeof window !== 'undefined') {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'GET_CURRENT_LOCATION',
                                requestId: `init_loc_${Date.now()}`,
                            }));

                            const handleLocationUpdate = (event) => {
                                try {
                                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                                    if (data.type === 'LOCATION_UPDATE' && data.payload) {
                                        const { lat, lng } = data.payload;
                                        // import('@/lib/api/client').then(({ apiClient }) => {
                                        //   apiClient.post('/driver/update-location', { location: { lat, lng } })
                                        //     .catch(err => console.error('Location update error:', err));
                                        // })
                                        window.removeEventListener('message', handleLocationUpdate);
                                    }
                                } catch (e) {
                                    console.error('Location response parse error:', e);
                                }
                            };

                            window.addEventListener('message', handleLocationUpdate);
                            setTimeout(() => window.removeEventListener('message', handleLocationUpdate), 10000);
                        } else {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        // import('@/lib/api/client').then(({ apiClient }) => {
                                        //   apiClient.post('/driver/update-location', {
                                        //     location: { lat: position.coords.latitude, lng: position.coords.longitude },
                                        //   }).catch(err => console.error('Location update error:', err));
                                        // });
                                    },
                                    (error) => console.error('Geolocation error:', error)
                                );
                            }
                        }
                        console.log('✅ Native services initialized successfully');
                    } else {
                        console.error('❌ Failed to initialize native services:', result.error);
                    }
                }
                if (isNative) {
                    getNativeLocation() // make the device send the current location to the server at least once
                }
                if (typeof window !== 'undefined') {
                    if (window.location.pathname.startsWith('/deliveries/send')) {
                        startLocationTracking(); // only do location tracking on those pages, as for the homepage, it's location tracking code is run on the page.jsx file in the root layout folder
                    }
                    else {
                        stopLocationTracking();
                    }
                }
            }
            initializeNativeCode()
        }
    }, [
        user,
        employee?.role,
        isNative,
        servicesInitialized,
        initializeNativeServices,
        getNativeLocation,
        startLocationTracking,
        stopLocationTracking,
    ])
    // Still loading — render nothing to avoid flash
    if (loading) return null;

    // Not logged in on a protected route — render nothing while redirect fires
    if (!user && !isPublic) return null;

    return (
        <ThemeProvider>
            <ToastProvider>
                {children}
            </ToastProvider>
        </ThemeProvider>
    );
}