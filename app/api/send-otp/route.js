import { pool } from '../../../lib/db';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60000);

    // 1. Save the OTP to the TiDB database
    await pool.query(
      'INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    // 2. Setup the email transporter for Hostinger
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Send the email
    await transporter.sendMail({
      from: `"Vaibhav's AI Bot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Chat Login OTP',
      text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
    });

    return Response.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error("OTP Error:", error);
    return Response.json({ success: false, error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}