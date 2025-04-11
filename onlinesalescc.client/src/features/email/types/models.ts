/**
 * Email Models
 */

/**
 * Email notification interface
 */
export interface EmailNotification {
  to: string;
  cc?: string[] | null;
  subject: string;
  body: string;
  isHtml?: boolean;
} 