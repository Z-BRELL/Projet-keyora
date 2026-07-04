import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    const htmlContent = `
      <h1>Welcome to Keyora! 🏠</h1>
      <p>Hello ${fullName},</p>
      <p>Thank you for joining Keyora, the #1 real estate platform in Cameroon.</p>
      <p>You can now:</p>
      <ul>
        <li>Browse thousands of verified properties</li>
        <li>Reach out to sellers and agents</li>
        <li>Create alert zones for your ideal properties</li>
        <li>Manage your favorites</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}">Start exploring now</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'Welcome to Keyora', htmlContent);
  }

  async sendListingApprovedEmail(email: string, listingTitle: string, listingUrl: string) {
    const htmlContent = `
      <h2>Your listing is now live! ✅</h2>
      <p>Congratulations!</p>
      <p>Your property listing "<strong>${listingTitle}</strong>" has been approved and is now visible to all buyers and renters on Keyora.</p>
      <p><a href="${listingUrl}">View your listing</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'Your listing is now live', htmlContent);
  }

  async sendListingRejectedEmail(email: string, listingTitle: string, reason: string) {
    const htmlContent = `
      <h2>Listing Review Update ⚠️</h2>
      <p>Your property listing "<strong>${listingTitle}</strong>" was not approved.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please review the requirements and resubmit your listing.</p>
      <p><a href="${process.env.FRONTEND_URL}/sell">Resubmit your listing</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'Listing review update', htmlContent);
  }

  async sendNewMessageEmail(email: string, senderName: string, messagePreview: string) {
    const htmlContent = `
      <h2>You have a new message</h2>
      <p>Hi,</p>
      <p><strong>${senderName}</strong> sent you a message:</p>
      <p style="background: #f0f0f0; padding: 10px; border-left: 3px solid #FF6B35;">
        ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}
      </p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/messages">View message</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'New message from ' + senderName, htmlContent);
  }

  async sendAlertMatchEmail(email: string, alertName: string, listings: any[]) {
    const listingsHtml = listings
      .map(
        l => `
        <li>
          <strong>${l.title}</strong> - ${l.price} FCFA
          <br />${l.address}, ${l.city}
        </li>
      `,
      )
      .join('');

    const htmlContent = `
      <h2>New properties match your alert! 🎯</h2>
      <p>Hi,</p>
      <p>We found ${listings.length} new properties matching your alert "<strong>${alertName}</strong>":</p>
      <ul>
        ${listingsHtml}
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/listing">View all properties</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, `${listings.length} new properties match your alert`, htmlContent);
  }

  async sendPasswordReset(email: string, fullName: string, resetUrl: string) {
    const htmlContent = `
      <h2>Reset your password</h2>
      <p>Hello ${fullName},</p>
      <p>We received a request to reset your Keyora password.</p>
      <p><a href="${resetUrl}" style="background: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'Reset your Keyora password', htmlContent);
  }

  async sendPasswordResetConfirmation(email: string, fullName: string) {
    const htmlContent = `
      <h2>Password reset successful ✅</h2>
      <p>Hello ${fullName},</p>
      <p>Your password has been successfully reset.</p>
      <p><a href="${process.env.FRONTEND_URL}/auth/login">Sign in with your new password</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'Password reset successful', htmlContent);
  }

  async sendVerificationEmail(email: string, fullName: string, verificationUrl: string) {
    const htmlContent = `
      <h2>Verify your email address</h2>
      <p>Hello ${fullName},</p>
      <p>Thank you for signing up for Keyora. Please verify your email to activate your account.</p>
      <p><a href="${verificationUrl}" style="background: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'Verify your Keyora email', htmlContent);
  }

  async sendWeeklyDigestEmail(email: string, stats: any) {
    const htmlContent = `
      <h2>Your Keyora Weekly Summary 📊</h2>
      <p>Hi,</p>
      <p>Here's what happened on Keyora this week:</p>
      <ul>
        <li>New properties in your area: ${stats.newListings}</li>
        <li>Your listings viewed: ${stats.views} times</li>
        <li>New messages: ${stats.messages}</li>
        <li>Property matches: ${stats.matches}</li>
      </ul>
      <p><a href="${process.env.FRONTEND_URL}/dashboard">View your dashboard</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'Your Keyora Weekly Summary', htmlContent);
  }

  async sendReportNotification(email: string, listingTitle: string, reason: string) {
    const htmlContent = `
      <h2>New Report Submitted 🚨</h2>
      <p>A user has reported a listing:</p>
      <p><strong>Listing:</strong> ${listingTitle}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/moderation">Review report</a></p>
      <br />
      <p>Best regards,<br />The Keyora Team</p>
    `;

    return this.sendEmail(email, 'New Report: ' + listingTitle, htmlContent);
  }

  private async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `Keyora <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }
}
