import nodemailer from 'nodemailer';
import 'dotenv/config';

async function test() {
    const tr = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await tr.verify();
        console.log('Transporter is ready');
        await tr.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test verification',
            text: 'Test message body'
        });
        console.log('Test email sent successfully!');
    } catch (err) {
        console.error('Error testing nodemailer:', err);
    }
}

test();
