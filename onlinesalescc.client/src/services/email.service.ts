/**
 * Email Service
 * 
 * Handles sending notifications and emails related to orders
 */

import { apiClient } from './api';

interface SendNotificationParams {
  orderNumbers: number[] | 'all';
  subject: string;
  content: string;
  artikelNr: number;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  emailsSent?: number;
}

/**
 * Email Service for sending notifications to customers
 */
export const EmailService = {
  /**
   * Send notifications to customers about order updates
   * 
   * @param params Notification parameters
   * @returns Response with success status and message
   */
  async sendNotifications(params: SendNotificationParams): Promise<NotificationResponse> {
    // Make a POST request to the notifications endpoint
    const response = await apiClient.post<NotificationResponse>('/api/notifications/email', params);
    return response;
  }
};