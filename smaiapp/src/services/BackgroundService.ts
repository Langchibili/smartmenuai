import DeviceSocketService from './DeviceSocketService';
import NotificationService from './NotificationService';
import AudioService from './AudioService';
import { logger } from '../utils/logger';
import { SOCKET_EVENTS } from '../utils/constants';

interface ServiceConfig { deviceId: string; userId: string | number; frontendName: string; socketServerUrl: string; authToken?: string | null; }

class BackgroundService {
  private isRunning = false;
  private removeSocketHandlers: Array<() => void> = [];

  async start(config: ServiceConfig): Promise<boolean> {
    if (this.isRunning) return true;
    await AudioService.initialize();
    const socketConnected = await DeviceSocketService.connect(config.socketServerUrl);
    if (!socketConnected) return false;

    this.bindSocketNotifications();

    const notificationToken = NotificationService.getToken();
    const { getDeviceInfo } = require('../utils/device-info');
    const deviceInfo = await getDeviceInfo();

    await DeviceSocketService.registerDevice({
      deviceId: config.deviceId, userId: config.userId,
      userType: config.frontendName === 'owner' ? 'owner' : 'employee',
      frontendName: config.frontendName, notificationToken, deviceInfo, socketServerUrl: config.socketServerUrl,
      authToken: config.authToken,
    });

    this.isRunning = true;
    return true;
  }

  async stop(): Promise<void> {
    this.removeSocketHandlers.forEach((remove) => remove());
    this.removeSocketHandlers = [];
    DeviceSocketService.disconnect();
    await AudioService.stopAlert();
    await NotificationService.cancelAll();
    this.isRunning = false;
  }

  async showOrderAlert(orderData: any): Promise<void> {
    const [audio, notification] = await Promise.allSettled([
      AudioService.playAlert('order_alert'),
      NotificationService.showOrderNotification(orderData),
    ]);
    if (audio.status === 'rejected') logger.error('Unable to play order alert:', audio.reason);
    if (notification.status === 'rejected') logger.error('Unable to show order notification:', notification.reason);
  }

  async showWaiterCallAlert(callData: any): Promise<void> {
    const [audio, notification] = await Promise.allSettled([
      AudioService.playAlert('waiter_call'),
      NotificationService.showWaiterCallNotification(callData),
    ]);
    if (audio.status === 'rejected') logger.error('Unable to play waiter-call alert:', audio.reason);
    if (notification.status === 'rejected') logger.error('Unable to show waiter-call notification:', notification.reason);
  }

  private bindSocketNotifications(): void {
    this.removeSocketHandlers.forEach((remove) => remove());
    this.removeSocketHandlers = [
      DeviceSocketService.on(SOCKET_EVENTS.ORDER.NEW, (data) => {
        const orderId = data?.orderId ?? data?.order_id ?? data?.id;
        if (orderId == null) {
          logger.warn('Ignoring new-order event without an order ID');
          return;
        }
        const itemCount = data.itemCount ?? data.item_count ??
          (Array.isArray(data.items)
            ? data.items.reduce((count: number, item: any) => count + Number(item.quantity || 0), 0)
            : 0);
        void this.showOrderAlert({
          orderId,
          orderNumber: data.numeric_order_number ?? data.orderNumber ?? data.order_number,
          tableNumber: data.tableNumber ?? data.table_number,
          itemCount,
          total: Number(data.total) || 0,
        }).catch((error) => logger.error('Unable to show order notification:', error));
      }),
      DeviceSocketService.on(SOCKET_EVENTS.WAITER_CALL.NEW, (data) => {
        const callId = data?.callId ?? data?.call_id ?? data?.id;
        if (callId == null) {
          logger.warn('Ignoring waiter-call event without a call ID');
          return;
        }
        void this.showWaiterCallAlert({
          callId,
          tableNumber: data.tableNumber ?? data.table_number,
          message: data.message,
        }).catch((error) => logger.error('Unable to show waiter-call notification:', error));
      }),
      DeviceSocketService.on(SOCKET_EVENTS.NOTIFICATION.NEW, (data) => {
        const title = typeof data?.title === 'string' ? data.title : 'Smart Menu AI';
        const body = typeof data?.body === 'string'
          ? data.body
          : typeof data?.message === 'string'
            ? data.message
            : 'You have a new notification';
        void NotificationService.show({ title, body, data }).catch(
          (error) => logger.error('Unable to show realtime notification:', error)
        );
      }),
    ];
  }

  isServicesRunning(): boolean { return this.isRunning; }
}

export default new BackgroundService();