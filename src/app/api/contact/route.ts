import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'dailydevstudio@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD, // Ensure user sets this App Password in .env.local
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER || 'dailydevstudio@gmail.com'}>`, // Use authenticated sender to prevent spam bouncing
      replyTo: email,
      to: 'dailydevstudio@gmail.com',
      subject: `Pixie Contact Form: ${subject || 'New Message'}`,
      text: `You have received a new message from the Pixie Contact Form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Message sent successfully.' });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send message.', details: error.message }, { status: 500 });
  }
}
