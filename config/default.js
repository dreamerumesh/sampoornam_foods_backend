require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    
    // JWT Config
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

    // Email SMTP Config (for sending OTPs)
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail', // Change if using another provider
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: process.env.EMAIL_PORT || 587, // 465 for SSL, 587 for TLS
    EMAIL_USER: process.env.EMAIL_USER ,
    EMAIL_PASS: process.env.EMAIL_PASS ,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@sampoornamfoods.com',

    // Admin Email
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@sampoornamfoods.com',

    // OTP Expiry
    OTP_EXPIRE: process.env.OTP_EXPIRE || 10, // in minutes
    // Frontend url
    FRONTEND_URL:process.env.FRONTEND_URL,

    // Cloudinary Config
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};
