/**
 * Email Service
 * 
 * This service handles email-related API calls to the backend.
 */

import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { EmailNotification } from '../types/models';

/**
 * Email service for handling email notifications
 */
export const EmailService = {
  /**
   * Send an email notification
   * @param notification The email notification details
   * @returns Promise indicating success/failure
   */
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_EMAIL, notification);
      return true;
    } catch (error) {
      console.error("Error sending email notification:", error);
      return false;
    }
  },

  /**
   * Send email notifications to multiple recipients
   * @param notification The notification details
   * @returns Promise with response object
   */
  async sendNotifications(notification: any): Promise<{ success: boolean, message: string }> {
    try {
      await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_EMAIL, notification);
      return { 
        success: true, 
        message: "Email notifications sent successfully" 
      };
    } catch (error) {
      console.error("Error sending notifications:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to send notifications" 
      };
    }
  }
}; 