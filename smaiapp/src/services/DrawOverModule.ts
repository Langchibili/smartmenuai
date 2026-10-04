// OkraApp\src\services\DrawOverModule.ts
import DrawOverNativeModule from '../../modules/expo-draw-over';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

interface DrawOverData {
  orderId?: number | string;
  orderNumber?: string;
  tableNumber?: number | string;
  itemCount?: number;
  total?: number;
  requesterName?: string;
  message?: string;
  autoTimeout?: number;
}

class DrawOverModule {
  private isModuleAvailable(): boolean {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!DrawOverNativeModule) {
      logger.error('❌ DrawOverNativeModule not available');
      return false;
    }

    return true;
  }

  private validateData(data: DrawOverData): boolean {
    const required = ['orderId', 'orderNumber', 'tableNumber'];

    for (const field of required) {
      if (data[field as keyof DrawOverData] === undefined || data[field as keyof DrawOverData] === null) {
        logger.error(`❌ Missing field: ${field}`);
        return false;
      }
    }
    return true;
  }

  async show(data: DrawOverData): Promise<void> {
    if (Platform.OS !== 'android') {
      logger.warn('⚠️ Draw-over only on Android');
      return;
    }

    try {
      if (!this.isModuleAvailable()) {
        logger.error('❌ Module not available');
        return;
      }

      if (!this.validateData(data)) {
        logger.error('❌ Invalid data');
        return;
      }

      const payload = JSON.stringify({
        type: 'order_request',
        orderId: data.orderId,
        orderNumber: data.orderNumber ?? String(data.orderId),
        tableNumber: data.tableNumber,
        itemCount: data.itemCount ?? 0,
        total: data.total ?? 0,
        requesterName: data.requesterName ?? 'Customer',
        message: data.message ?? 'You have a new order on table',
        autoTimeout: data.autoTimeout ?? 30000,
      });

      if (typeof (DrawOverNativeModule as any).showRideCard === 'function') {
        await (DrawOverNativeModule as any).showRideCard(payload);
      } else if (typeof (DrawOverNativeModule as any).showOverlay === 'function') {
        await (DrawOverNativeModule as any).showOverlay({
          orderId: data.orderId,
          orderNumber: data.orderNumber ?? String(data.orderId),
          tableNumber: data.tableNumber,
          itemCount: data.itemCount ?? 0,
          total: data.total ?? 0,
          autoTimeout: data.autoTimeout ?? 30000,
        });
      } else {
        logger.warn('⚠️ No overlay API available on native module');
      }

      logger.info('✅ Order overlay shown');
    } catch (error) {
      logger.error('❌ Error showing order overlay:', error);
    }
  }

  async hide(): Promise<void> {
    if (!this.isModuleAvailable()) return;
    try {
      if (typeof (DrawOverNativeModule as any).hideOverlay === 'function') {
        await DrawOverNativeModule.hideOverlay();
      }
      logger.info('✅ Hidden');
    } catch (error) {
      logger.error('❌ Hide error:', error);
    }
  }

  async isShowing(): Promise<boolean> {
    if (!this.isModuleAvailable()) return false;
    try {
      return Boolean(await DrawOverNativeModule.isOverlayShowing?.());
    } catch (error) {
      logger.error('❌ Status error:', error);
      return false;
    }
  }
}

export default new DrawOverModule();