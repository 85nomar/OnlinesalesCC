/**
 * Email Service
 * 
 * Handles sending notifications and emails related to orders
 */

import { apiClient } from './api';
import { CURRENT_DATA_SOURCE, DataSource, isRealApi } from '@/config/api.config';

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
    // For mock data, simulate a successful response
    if (!isRealApi(CURRENT_DATA_SOURCE)) {
      const numEmails = params.orderNumbers === 'all' ? 5 : params.orderNumbers.length;
      
      // Simulate server delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Successfully sent ${numEmails} email notifications to customers.`,
        emailsSent: numEmails
      };
    }
    
    // For real API, make a POST request to the notifications endpoint
    const response = await apiClient.post<NotificationResponse>('/api/notifications/email', params);
    return response;
  }
};