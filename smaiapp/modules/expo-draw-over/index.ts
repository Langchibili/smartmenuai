// // ✅ NEW - use requireNativeModule instead
// import { requireNativeModule } from 'expo-modules-core';

// const DrawOverNativeModule = requireNativeModule('DrawOverNativeModule');
// export default DrawOverNativeModule;
import { Platform } from 'react-native';

// iOS stub — all methods are no-ops so imports never throw on iOS
const DrawOverStub = {
  checkPermission:         async () => false,
  requestPermission:       async () => {},
  prepareFloatingBubbleService: async () => false,
  startFloatingBubble:     async () => {},
  stopFloatingBubble:      async () => {},
  isFloatingBubbleShowing: async () => false,
  updateBubbleBadge:       async (_count: number) => {},
  showBubbleRipple:        async () => {},
  showOverlay:             async (_data: any) => {},
  showRideCard:            async (_json: string) => {},
  hideOverlay:             async () => {},
  isOverlayShowing:        async () => false,
  notifyAppForeground:     async () => {},
  notifyAppBackground:     async () => {},
};

let DrawOverNativeModule: typeof DrawOverStub;

if (Platform.OS === 'android') {
  // requireNativeModule throws if the module isn't found,
  // so we wrap it in a try/catch as an extra safety net
  try {
    const { requireNativeModule } = require('expo-modules-core');
    DrawOverNativeModule = requireNativeModule('DrawOverNativeModule');
  } catch (e) {
    console.warn('DrawOverNativeModule not available on this device:', e);
    DrawOverNativeModule = DrawOverStub;
  }
} else {
  DrawOverNativeModule = DrawOverStub;
}

export default DrawOverNativeModule;