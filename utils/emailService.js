const nodemailer = require('nodemailer');
const config = require('../config/default');

const sendEmail = async ({ to, subject, html }) => {
    try {
        let transporter = nodemailer.createTransport({
            service: config.EMAIL_SERVICE,
            host: config.EMAIL_HOST,
            port: config.EMAIL_PORT,
            secure: false, // Use `true` for port 465, `false` for 587
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `From Sampoornam Foods <${config.EMAIL_FROM}>`,
            to,
            subject,
            html
        });

        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Email could not be sent');
    }
};

module.exports = sendEmail;
