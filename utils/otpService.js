// utils/verifyOTP.js
// utils/verifyOTP.js

module.exports = function verifyOTP(storedOtpObject, enteredOtp) {
    if (!storedOtpObject || !enteredOtp) {
        return false;
    }

    const { code, expiresAt } = storedOtpObject; // Extract code and expiry time

    if (new Date() > new Date(expiresAt)) {
        return false; // OTP expired
    }

    return code === enteredOtp; // Check if OTP matches
};

