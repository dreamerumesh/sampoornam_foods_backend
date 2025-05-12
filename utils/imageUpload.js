const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create the multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = {
  uploadProductImages: upload.array('images', 7), // Allow up to 7 images
  
  // Helper to get image URLs after upload
  getImageUrls: (req) => {
    if (!req.files || req.files.length === 0) {
      return [];
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    return req.files.map((file, index) => ({
      url: `${baseUrl}/uploads/products/${file.filename}`,
      isMain: index === 0 // First image is main by default
    }));
  },
  
  // Helper to delete images
  deleteImage: (imageUrl) => {
    try {
      // Extract filename from URL
      const filename = imageUrl.split('/').pop();
      const filePath = path.join(uploadsDir, filename);
      
      // Check if file exists before deleting
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
};