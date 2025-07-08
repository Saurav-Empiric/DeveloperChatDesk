import { transporter } from '@/lib/nodemailer/config';

/**
 * Email Service
 * 
 * Sends emails using nodemailer with the configured transporter.
 */

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using nodemailer
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Get the sender email from environment variables
    const from = process.env.EMAIL_FROM;

    // Send the email
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a password reset email
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetLink: string,
  userName = 'User',
  role = 'user'
): Promise<boolean> => {
  const appName = 'WhatsApp Client-Developer Management Platform';
  const subject = `Password Reset Request - ${appName}`;

  const roleSpecificText = role === 'admin'
    ? 'your admin account'
    : 'your developer account';

  const text = `
    Hello ${userName},
    
    We received a request to reset your password for ${roleSpecificText} on the ${appName}.
    
    To reset your password, please click on the link below:
    ${resetLink}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email.
    
    Thank you,
    ${appName} Team
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password for <strong>${roleSpecificText}</strong> on the ${appName}.</p>
      <p>To reset your password, please click on the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>Thank you,<br>${appName} Team</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
} 