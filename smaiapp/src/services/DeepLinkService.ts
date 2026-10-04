//OkraApp\src\services\DeepLinkService.ts
import { CONSTANTS } from '../utils/constants';
import { logger } from '../utils/logger';

type WebViewSender = ((data: any) => void) | null;

class DeepLinkService {
  /**
   * Handle notification tap and route to correct page
   */
  handleNotification(data: any, sendToWebView: WebViewSender): void {
    try {
      logger.info('Handling notification deep link:', data);

      if (!sendToWebView) {
        logger.warn('sendToWebView not available');
        return;
      }

      let url = '';
      const baseUrl = CONSTANTS.FRONTEND_URLS.owner;

      switch (data.type) {
        case 'order_new':
        case 'order_status_updated':
          url = `${baseUrl}/owner/orders`;
          break;
        case 'waiter_call':
          url = `${baseUrl}/waiter/alerts`;
          break;
        case 'reconnect':
          url = 'refresh';
          break;

        default:
          logger.warn('Unknown notification type:', data.type);
          return;
      }

      // Send navigation command to WebView
      sendToWebView({
        type: 'NAVIGATE_TO',
        payload: {
          url,
          data,
        },
      });

      logger.info('Navigation command sent to WebView:', url);
    } catch (error) {
      logger.error('Error handling notification deep link:', error);
    }
  }

  /**
   * Handle draw-over action result
   */
  handleDrawOverAction(action: 'accept' | 'decline', data: any, sendToWebView: WebViewSender): void {
    try {
      logger.info(`Draw-over action: ${action}`, data);

      if (!sendToWebView) {
        logger.warn('sendToWebView not available');
        return;
      }

      sendToWebView({
        type: 'RIDE_REQUEST_ACTION',
        payload: {
          action,
          rideId: data.rideId,
          rideCode: data.rideCode,
        },
      });
    } catch (error) {
      logger.error('Error handling draw-over action:', error);
    }
  }
}

export default new DeepLinkService();