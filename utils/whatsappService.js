// server/utils/whatsappService.js
// This function generates a WhatsApp link that opens a pre-filled message
const generateWhatsAppLink = (phone, message) => {
    // Format phone number (remove any non-numeric characters)
    const formattedPhone = 7731814520;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Generate WhatsApp web link
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };
  
  module.exports = { generateWhatsAppLink };