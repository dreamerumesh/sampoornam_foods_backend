const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/admin.middleware');
const productController = require('../controllers/product.controller');

// Multer setup for product images (max 6)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { files: 6 } // Limit to 6 files as per requirement
});

// Create a new product with images
router.post('/', 
  [auth, isAdmin], 
  upload.array('images', 6), 
  productController.createProduct
);

// Get all products with search functionality
router.get('/', productController.getProducts);

// Get a specific product
router.get('/:id', productController.getProductById);

// Update a product
router.put('/:id', 
  [auth, isAdmin], 
  upload.array('images', 6), 
  productController.updateProduct
);

// Delete a product
router.delete('/:id', 
  [auth, isAdmin], 
  productController.deleteProduct
);

// Get a specific image by its file ID
router.get('/image/:id', productController.getProductImage);

module.exports = router;