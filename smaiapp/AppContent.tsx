import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StatusBar, Platform, AppState, StyleSheet, View, BackHandler, Image, Linking, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

import BackgroundService from './src/services/BackgroundService';
import DrawOverModule from './src/services/DrawOverModule';
import DeviceSocketService from './src/services/DeviceSocketService';
import LocationService from './src/services/LocationService';
import NotificationService from './src/services/NotificationService';
import PermissionManager from './src/services/PermissionManager';
import AudioService from './src/services/AudioService';
import { getDeviceInfo } from './src/utils/device-info';
import { logger } from './src/utils/logger';
import { SOCKET_EVENTS, WEBVIEW_EVENTS, CONSTANTS } from './src/utils/constants';
import { OrderAlertModal } from './src/components/OrderAlertModal';
import { WaiterCallAlertModal } from './src/components/WaiterCallAlertModal';
import { LinearGradient } from 'expo-linear-gradient';
import { ConnectionLostBanner } from './src/components/ConnectionLostBanner';
import OfflineScreen from './src/components/OfflineScreen';
import { CameraView, useCameraPermissions } from 'expo-camera';

const API_URL = CONSTANTS.BACKEND_URL;
const FRONTEND_URL = CONSTANTS.FRONTEND_URLS.owner;
const FRONTEND_ORIGIN = new URL(FRONTEND_URL).origin;

function getValidatedCustomerMenuUrl(rawUrl: string): string | null {
  try {
    const scanned = new URL(rawUrl);
    const frontend = new URL(FRONTEND_URL);
    if (!/^\/m\/[^/]+\/[^/]+\/[^/]+\/?$/.test(scanned.pathname)) return null;
    if (scanned.origin === FRONTEND_ORIGIN) return scanned.toString();
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(scanned.hostname);
    if (
      isLocalhost &&
      scanned.protocol === 'http:' &&
      frontend.protocol === 'http:' &&
      scanned.port === frontend.port
    ) {
      return `${FRONTEND_ORIGIN}${scanned.pathname}${scanned.search}${scanned.hash}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function AppContent() {
  const webViewRef = useRef<WebView>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [is404, setIs404] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const deviceIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | number | null>(null);
  const frontendNameRef = useRef<string | null>(null); // 'owner' | 'employee'
  const authTokenRef = useRef<string | null>(null);
  const servicesInitializedRef = useRef(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [entryMode, setEntryMode] = useState<'choice' | 'web'>('choice');
  const [webViewUrl, setWebViewUrl] = useState(FRONTEND_URL);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrError, setQrError] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const qrScanLocked = useRef(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showOrderModal) { setShowOrderModal(false); return true; }
      if (showCallModal) { setShowCallModal(false); return true; }
      if (is404) { setIs404(false); webViewRef.current?.injectJavaScript(`window.location = ""`); return true; }
      if (canGoBack && webViewRef.current) { webViewRef.current.goBack(); return true; }
      return false;
    });
    return () => backHandler.remove();
  }, [showOrderModal, showCallModal, is404, canGoBack]);

  const sendToWebView = useCallback((data: any) => {
    webViewRef.current?.postMessage(JSON.stringify({ type: data.type, payload: data.payload ?? {} }));
  }, []);

  const openCustomerScanner = async () => {
    setQrError('');
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        setQrError('Camera permission is required to scan a table QR code.');
        return false;
      }
    }
    qrScanLocked.current = false;
    setShowQrScanner(true);
    return true;
  };

  const handleAcceptOrder = async (orderId: string | number) => {
    setShowOrderModal(false);
    try {
      const { deviceId } = await getDeviceInfo();
      await fetch(`${API_URL}/devices/acceptorder/${deviceId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authTokenRef.current}` },
        body: JSON.stringify({ orderId, status: 'accepted' }),
      });
      setCurrentOrder(null);
    } catch (e) { logger.error('Accept order error:', e); }
  };

  const handleDismissOrder = (orderId: string | number) => { setShowOrderModal(false); setCurrentOrder(null); };

  const handleAcknowledgeCall = async (callId: string | number) => {
    setShowCallModal(false);
    try {
      const { deviceId } = await getDeviceInfo();
      await fetch(`${API_URL}/devices/acknowledgecall/${deviceId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authTokenRef.current}` },
        body: JSON.stringify({ callId }),
      });
      setCurrentCall(null);
    } catch (e) { logger.error('Acknowledge call error:', e); }
  };

  const handleDismissCall = (callId: string | number) => { setShowCallModal(false); setCurrentCall(null); };

  const setupSocketListeners = useCallback(() => {
    DeviceSocketService.on(SOCKET_EVENTS.ORDER.NEW, async (data: any) => {
      await BackgroundService.showOrderAlert(data);
      setCurrentOrder(data);
      setShowOrderModal(true);
      sendToWebView({ type: WEBVIEW_EVENTS.ORDER_NEW, payload: data });
    });

    DeviceSocketService.on(SOCKET_EVENTS.ORDER.STATUS_UPDATED, (data: any) => {
      sendToWebView({ type: WEBVIEW_EVENTS.ORDER_STATUS_UPDATED, payload: data });
    });

    DeviceSocketService.on(SOCKET_EVENTS.WAITER_CALL.NEW, async (data: any) => {
      await BackgroundService.showWaiterCallAlert(data);
      setCurrentCall(data);
      setShowCallModal(true);
      sendToWebView({ type: WEBVIEW_EVENTS.WAITER_CALL_NEW, payload: data });
    });

    DeviceSocketService.on(SOCKET_EVENTS.WAITER_CALL.ACKNOWLEDGED, (data: any) => {
      sendToWebView({ type: WEBVIEW_EVENTS.WAITER_CALL_ACKNOWLEDGED, payload: data });
    });

    DeviceSocketService.on(SOCKET_EVENTS.WAITER_CALL.RESOLVED, (data: any) => {
      setCurrentCall((call: any) => call?.callId === data.callId ? null : call);
      setShowCallModal(false);
      sendToWebView({ type: WEBVIEW_EVENTS.WAITER_CALL_RESOLVED, payload: data });
    });

    DeviceSocketService.on(SOCKET_EVENTS.TABLE.STATUS_UPDATED, (data: any) => {
      sendToWebView({ type: WEBVIEW_EVENTS.TABLE_STATUS_UPDATED, payload: data });
    });

    DeviceSocketService.on(SOCKET_EVENTS.NOTIFICATION.NEW, async (data: any) => {
      await NotificationService.show(data);
      sendToWebView({ type: WEBVIEW_EVENTS.NOTIFICATION_NEW, payload: data });
    });

    DeviceSocketService.on(SOCKET_EVENTS.CONNECTED, () => sendToWebView({ type: WEBVIEW_EVENTS.SOCKET_CONNECTED, payload: {} }));
    DeviceSocketService.on(SOCKET_EVENTS.DISCONNECTED, (d: any) => sendToWebView({ type: WEBVIEW_EVENTS.SOCKET_DISCONNECTED, payload: d }));
  }, [sendToWebView]);

  useEffect(() => {
    NotificationService.initialize(sendToWebView);
    return () => NotificationService.cleanup();
  }, [sendToWebView]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => setIsConnected(state.isConnected ?? false));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void DrawOverModule.setAppForeground(true);
        if (servicesInitializedRef.current) {
          void DrawOverModule.prepareServiceIfPermitted();
        }
      } else if (nextState === 'background') {
        void DrawOverModule.setAppForeground(false);
      }
    });
    return () => subscription.remove();
  }, []);

  const handleInitializeServices = async (payload: any) => {
    try {
      const { userId, frontendName, socketServerUrl, authToken } = payload;
      const deviceInfo = await getDeviceInfo();
      const deviceId = deviceInfo.deviceId;
      deviceIdRef.current = deviceId; userIdRef.current = userId; frontendNameRef.current = frontendName;
      authTokenRef.current = authToken || null;
      LocationService.setDeviceId(deviceId);
      const permissions = await PermissionManager.requestCriticalPermissions();
      const socketUrl = socketServerUrl || CONSTANTS.DEVICE_SOCKET_URL;
      const started = await BackgroundService.start({ deviceId, userId, frontendName, socketServerUrl: socketUrl, authToken });
      if (!started) return { success: false, error: 'Failed to start services' };
      setupSocketListeners();
      servicesInitializedRef.current = true;
      const drawOverPermission = await DrawOverModule.requestPermission();
      if (drawOverPermission) await DrawOverModule.prepareServiceIfPermitted();
      return {
        success: true,
        deviceId,
        permissions: { ...permissions, drawOver: drawOverPermission },
        socketConnected: DeviceSocketService.isConnected(),
      };
    } catch (e: any) { return { success: false, error: e.message }; }
  };

  const onMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const { type, requestId, payload } = message;
      let response: any = null;
      switch (type) {
        case 'INITIALIZE_SERVICES': response = await handleInitializeServices(payload); break;
        case 'REQUEST_PERMISSION': response = { status: await PermissionManager.request(payload.permissionType) }; break;
        case 'CHECK_PERMISSION': response = { status: await PermissionManager.check(payload.permissionType) }; break;
        case 'GET_CURRENT_LOCATION': response = await LocationService.getCurrentLocation() || { error: 'Could not get location' }; break;
        case 'SHOW_NOTIFICATION': await NotificationService.show(payload); response = { success: true }; break;
        case 'PLAY_AUDIO': await AudioService.playAlert(payload.soundFile); response = { success: true }; break;
        case 'OPEN_CUSTOMER_QR_SCANNER':
          response = await openCustomerScanner()
            ? { success: true }
            : { error: 'Camera permission is required to scan a table QR code.' };
          break;
        case 'LOG_DATA': console.log('Log from webview', payload); response = { success: true }; break;
        default: response = { error: 'Unknown message type' };
      }
      if (requestId && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type, requestId, payload: response?.error ? null : response, error: response?.error }));
      }
    } catch (e) { logger.error('onMessage error:', e); }
  };

  if (!isConnected) {
    return <OfflineScreen onRetry={() => webViewRef.current?.injectJavaScript(`window.location = ""`)} />;
  }

  const handleQrScanned = ({ data }: { data: string }) => {
    if (qrScanLocked.current) return;
    qrScanLocked.current = true;
    const menuUrl = getValidatedCustomerMenuUrl(data);
    if (!menuUrl) {
      setQrError('This QR code is not a valid SmartMenuAI table menu.');
      qrScanLocked.current = false;
      return;
    }
    setQrError('');
    setShowQrScanner(false);
    setWebViewUrl(menuUrl);
    setEntryMode('web');
  };

  const qrScannerOverlay = showQrScanner ? (
    <View style={styles.scannerOverlay}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleQrScanned}
      />
      <View style={styles.scannerActions}>
        <Text style={styles.scannerHint}>Point your camera at the table QR code.</Text>
        {qrError ? <Text accessibilityRole="alert" style={styles.entryError}>{qrError}</Text> : null}
        <Pressable
          style={styles.entrySecondaryButton}
          onPress={() => {
            setShowQrScanner(false);
            qrScanLocked.current = false;
          }}
        >
          <Text style={styles.entrySecondaryText}>Cancel scanning</Text>
        </Pressable>
      </View>
    </View>
  ) : null;

  if (entryMode === 'choice') {
    return (
      <LinearGradient colors={['#1C0A00', '#100904']} style={styles.entryContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#100904" />
        <SafeAreaView style={styles.entryContent}>
          <Text style={styles.entryTitle}>SmartMenu AI</Text>
          <Text style={styles.entrySubtitle}>Choose how you would like to continue.</Text>
          <Pressable style={styles.entryPrimaryButton} onPress={openCustomerScanner}>
            <Text style={styles.entryPrimaryText}>Are you a customer? Scan QR code</Text>
          </Pressable>
          <Pressable
            style={styles.entrySecondaryButton}
            onPress={() => {
              setWebViewUrl(`${FRONTEND_URL.replace(/\/$/, '')}/business-landing`);
              setEntryMode('web');
            }}
          >
            <Text style={styles.entrySecondaryText}>Manage Business Instead</Text>
          </Pressable>
          {qrError ? <Text accessibilityRole="alert" style={styles.entryError}>{qrError}</Text> : null}
        </SafeAreaView>
        {qrScannerOverlay}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ConnectionLostBanner visible={hasError || !isConnected} onRetry={() => webViewRef.current?.injectJavaScript(`window.location = ""`)} message={!isConnected ? 'No internet connection' : 'Connection lost'} />
      <SafeAreaView style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url.startsWith('tel:') || request.url.startsWith('mailto:')) { Linking.openURL(request.url); return false; }
            if (request.url === 'about:blank') return true;
            try {
              return new URL(request.url).origin === FRONTEND_ORIGIN;
            } catch {
              return false;
            }
          }}
          onMessage={onMessage}
          javaScriptEnabled domStorageEnabled startInLoadingState
          style={styles.webview}
          onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
          onError={() => setHasError(true)}
          onLoadEnd={() => setIsLoading(false)}
          onHttpError={(e) => { if (e.nativeEvent.statusCode === 404) setIs404(true); }}
        />
      </SafeAreaView>
      <OrderAlertModal open={showOrderModal} order={currentOrder} onAccept={handleAcceptOrder} onDismiss={handleDismissOrder} />
      <WaiterCallAlertModal open={showCallModal} call={currentCall} onAcknowledge={handleAcknowledgeCall} onDismiss={handleDismissCall} />
      {qrScannerOverlay}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webview: { flex: 1 },
  entryContainer: { flex: 1 },
  entryContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  entryTitle: { color: '#F9EDD8', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  entrySubtitle: { color: '#D4A872', fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 36 },
  entryPrimaryButton: { minHeight: 56, borderRadius: 14, backgroundColor: '#D4850A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginBottom: 14 },
  entryPrimaryText: { color: '#1C0A00', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  entrySecondaryButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: '#D4850A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  entrySecondaryText: { color: '#F9EDD8', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  entryError: { color: '#FCA5A5', fontSize: 14, textAlign: 'center', marginTop: 16 },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#100904' },
  camera: { flex: 1 },
  scannerActions: { padding: 20, backgroundColor: '#100904' },
  scannerHint: { color: '#F9EDD8', textAlign: 'center', marginBottom: 14 },
});