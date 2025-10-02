export interface AdminReplyEmailData {
  customerName: string
  customerEmail: string
  originalMessage: string
  adminReply: string
  replyUrl: string
  messageId: string
}

export function createAdminReplyEmailTemplate(data: AdminReplyEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reply from Duoheads Support</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #64748b;
          font-size: 14px;
        }
        .message-section {
          margin: 24px 0;
          padding: 20px;
          background-color: #f1f5f9;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
        .message-label {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .message-content {
          color: #475569;
          line-height: 1.6;
        }
        .reply-section {
          margin: 24px 0;
          padding: 20px;
          background-color: #ecfdf5;
          border-radius: 6px;
          border-left: 4px solid #10b981;
        }
        .cta-button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 24px 0;
          text-align: center;
        }
        .cta-button:hover {
          background-color: #2563eb;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Duoheads</div>
          <div class="subtitle">Support Team Response</div>
        </div>

        <p>Hi ${data.customerName},</p>
        
        <p>Thank you for contacting Duoheads support. We've reviewed your message and have a response for you.</p>

        <div class="message-section">
          <div class="message-label">Your Original Message</div>
          <div class="message-content">${data.originalMessage}</div>
        </div>

        <div class="reply-section">
          <div class="message-label">Our Response</div>
          <div class="message-content">${data.adminReply}</div>
        </div>

        <div style="text-align: center;">
          <a href="${data.replyUrl}" class="cta-button">Reply to this Message</a>
        </div>

        <p>You can continue the conversation by clicking the button above or replying directly to this email.</p>

        <div class="footer">
          <p>Best regards,<br>The Duoheads Support Team</p>
          <p>
            <a href="${data.replyUrl}">View Conversation</a> | 
            <a href="mailto:support@duoheads.com">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function createCustomerReplyNotificationTemplate(data: {
  customerName: string
  replyContent: string
  originalMessage: string
  conversationUrl: string
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Customer Reply - Duoheads</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #64748b;
          font-size: 14px;
        }
        .reply-section {
          margin: 24px 0;
          padding: 20px;
          background-color: #fef3c7;
          border-radius: 6px;
          border-left: 4px solid #f59e0b;
        }
        .message-label {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .message-content {
          color: #475569;
          line-height: 1.6;
        }
        .cta-button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 24px 0;
          text-align: center;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Duoheads</div>
          <div class="subtitle">New Customer Reply</div>
        </div>

        <p>A customer has replied to their support message.</p>

        <div class="reply-section">
          <div class="message-label">Customer Reply from ${data.customerName}</div>
          <div class="message-content">${data.replyContent}</div>
        </div>

        <div style="text-align: center;">
          <a href="${data.conversationUrl}" class="cta-button">View & Respond</a>
        </div>

        <div class="footer">
          <p>Duoheads Admin Panel</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export interface ChatEndedEmailData {
  customerName: string
  ticketNumber: string
  subject: string
  feedbackUrl?: string
}

export function createChatEndedEmailTemplate(data: ChatEndedEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chat Ended - Duoheads Support</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #64748b;
          font-size: 14px;
        }
        .status-badge {
          display: inline-block;
          background-color: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin: 16px 0;
        }
        .info-box {
          background-color: #f1f5f9;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          margin: 24px 0;
          border-radius: 6px;
        }
        .info-label {
          font-weight: 600;
          color: #1e293b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .info-value {
          color: #475569;
          font-size: 14px;
        }
        .feedback-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 8px;
          text-align: center;
          margin: 24px 0;
        }
        .feedback-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .feedback-text {
          font-size: 14px;
          opacity: 0.95;
          margin-bottom: 20px;
        }
        .cta-button {
          display: inline-block;
          background-color: white;
          color: #667eea;
          padding: 12px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 8px 0;
        }
        .cta-button:hover {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Duoheads</div>
          <div class="subtitle">Support Conversation</div>
          <div class="status-badge">✓ Resolved</div>
        </div>

        <p>Hi ${data.customerName},</p>
        
        <p>Your support conversation has been marked as resolved and closed.</p>

        <div class="info-box">
          <div class="info-label">Ticket Number</div>
          <div class="info-value">${data.ticketNumber}</div>
          <div class="info-label" style="margin-top: 12px;">Subject</div>
          <div class="info-value">${data.subject}</div>
        </div>

        <p>We hope we were able to help you with your inquiry. If you have any additional questions or concerns, please don't hesitate to reach out to us again.</p>

        <div class="feedback-section">
          <div class="feedback-title">How did we do?</div>
          <div class="feedback-text">
            Your feedback helps us improve our support service. We'd love to hear about your experience!
          </div>
          ${
            data.feedbackUrl
              ? `<a href="${data.feedbackUrl}" class="cta-button">Share Your Feedback</a>`
              : `<a href="mailto:support@duoheads.com?subject=Feedback for ${data.ticketNumber}" class="cta-button">Share Your Feedback</a>`
          }
        </div>

        <div class="footer">
          <p>Thank you for choosing Duoheads!</p>
          <p>
            <a href="mailto:support@duoheads.com">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
