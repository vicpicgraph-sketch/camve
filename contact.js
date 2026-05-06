import { sql } from '@vercel/postgres';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Insert into database
    // Make sure you have created the ContactSubmissions table in your Vercel Postgres dashboard
    const result = await sql`
      INSERT INTO ContactSubmissions (name, email, phone, message, status, created_at)
      VALUES (${name}, ${email}, ${phone}, ${message}, 'new', NOW())
      RETURNING id;
    `;

    // Send email notification to admin
    await sendEmailNotification(name, email, phone, message);

    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully!',
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Error saving contact form submission:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Email sending function
async function sendEmailNotification(name, email, phone, message) {
  try {
    // Configure your email service here
    // Option 1: Using Gmail (requires app password)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'camve88@gmail.com',
      subject: `🔔 New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📧 New Contact Submission</h2>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;"><strong>New message from your website contact form:</strong></p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0;">
                <strong style="color: #667eea;">Name:</strong><br/>
                ${name}
              </p>
              <p style="margin: 0 0 15px 0;">
                <strong style="color: #667eea;">Email:</strong><br/>
                <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
              </p>
              <p style="margin: 0 0 15px 0;">
                <strong style="color: #667eea;">Phone:</strong><br/>
                ${phone}
              </p>
              <p style="margin: 0;">
                <strong style="color: #667eea;">Message:</strong><br/>
                ${message.replace(/\n/g, '<br/>')}
              </p>
            </div>

            <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                <strong>Submitted:</strong> ${new Date().toLocaleString()}
              </p>
            </div>

            <div style="text-align: center;">
              <a href="YOUR_DASHBOARD_URL/dashboard.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error - submission already saved to database
  }
}
