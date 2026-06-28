const { Resend } = require('resend');

let resendInstance = null;

/**
 * Reusable email service wrapper.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @returns {Promise<Object>} Resend API response
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }

  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'AI Accountability <onboarding@resend.dev>';

  try {
    const data = await resendInstance.emails.send({
      from: senderEmail,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`, data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

module.exports = {
  sendEmail
};
