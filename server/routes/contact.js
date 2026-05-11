const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// @route   POST /api/contact
// @desc    Send contact form message via email
router.post('/', async (req, res) => {
  const { name, email, subject, message, phone } = req.body;
  const customerName = name || 'Valued Customer';

  try {
    // Check if email config exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Email configuration missing on server' });
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 1. Send email to Admin
    const adminMailOptions = {
      to: process.env.EMAIL_USER, // Sending to the support email itself
      from: `Zudo Contact Form <${process.env.EMAIL_USER}>`,
      subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">New Inquiry</h1>
          </div>
          <div style="padding: 20px;">
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p><strong>Message:</strong></p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</div>
          </div>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
            Sent from Zudo Website Contact Form
          </div>
        </div>
      `
    };

    // 2. Send confirmation email to User
    const userMailOptions = {
      to: email,
      from: `Zudo Support <${process.env.EMAIL_USER}>`,
      subject: 'We received your message!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Hello ${customerName}!</h1>
          </div>
          <div style="padding: 20px;">
            <p>Thank you for reaching out to Zudo. We have received your inquiry and our team will get back to you as soon as possible.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"We're processing your request. Most inquiries are answered within 24 hours."</p>
            </div>
            <p>Best regards,<br/><strong>Team Zudo</strong></p>
          </div>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #777;">
            This is an automated response. Please do not reply directly to this email.
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact Form Email Error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
