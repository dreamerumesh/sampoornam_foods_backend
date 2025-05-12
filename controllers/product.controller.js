// server/controllers/product.controller.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const Product = require('../models/Product');

// Use the global GridFS bucket
const getBucket = () => {
  if (!global.gfsBucket) {
    throw new Error('GridFS is not initialized');
  }
  return global.gfsBucket;
};

// @desc    Create a new product with images
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      //console.log("Files check")
      return res.status(400).json({ error: 'At least one product image is required' });
    }

    // Instead of parsing JSON, read directly from form fields
    const {
      name,
      description,
      price,
      orderBefore,
      deliveryDate,
      category,
      unit,
      size,
      isActive,
      featured,
      stock
    } = req.body;
    
    // Validate required fields
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!description) return res.status(400).json({ error: 'description is required' });
    if (!price) return res.status(400).json({ error: 'price is required' });
    if (!category) return res.status(400).json({ error: 'category is required' });

    // Create a new product
    const product = new Product({
      name,
      description,
      price: Number(price),
      orderBefore: orderBefore ? new Date(orderBefore) : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      category,
      unit: unit || 'kg', // Use default if not provided
      size: size ? Number(size) : 1, // Use default if not provided
      isActive: isActive !== undefined ? isActive === 'true' : true,
      featured: featured === 'true' || false,
      stock: stock ? Number(stock) : 0,
      images: []
    });
    //console.log("This is checking ");
    //console.log(req.files); // array of files
    //console.log(req.body);  // form fields

    // Process each image file
    const uploadPromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        let fileId;
        
        const uploadStream = getBucket().openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        
        fileId = uploadStream.id;
        uploadStream.end(file.buffer);

        uploadStream.on('finish', () => {
          // Set the first image as main if none specified
          const isMain = index === 0 ? true : false;
          
          product.images.push({
            fileId: fileId,
            filename: file.originalname,
            isMain: isMain
          });
          resolve();
        });

        uploadStream.on('error', (err) => {
          reject(err);
        });
      });
    });

    // Wait for all files to be processed
    await Promise.all(uploadPromises);
    
    // Save the product with all images
    await product.save();

    res.status(201).json({ 
      success: true,
      message: 'Product created successfully', 
      data: product
    });
  } catch (error) {
    console.error('Product creation error:', error);
    next(error);
  }
};

// @desc    Get all products with search functionality
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { 
      category, 
      featured,  
      sortBy = 'createdAt', 
      sortOrder = -1,
      page = 1,
      limit = 10,
      search, // Added search query
      unit    // Added unit filter
    } = req.query;
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (featured !== undefined) query.featured = featured === 'true';
    if (unit) query.unit = unit;
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, // Case-insensitive search on name
        { description: { $regex: search, $options: 'i' } } // Case-insensitive search on description
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product
      .find(query)
      .sort({ [sortBy]: parseInt(sortOrder) })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      },
      message: products.length === 0 ? 'No products found' : undefined
    });
    ;
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    // Read directly from form fields instead of parsing JSON
    const {
      name,
      description,
      price,
      orderBefore,
      deliveryDate,
      category,
      unit,
      size,
      isActive,
      featured,
      stock,
      deletedImages,
      mainImageId
    } = req.body;
    
    // Update basic product fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (orderBefore) product.orderBefore = new Date(orderBefore);
    if (deliveryDate) product.deliveryDate = new Date(deliveryDate);
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (size !== undefined) product.size = Number(size);
    if (isActive !== undefined) product.isActive = isActive === 'true';
    if (featured !== undefined) product.featured = featured === 'true';
    if (stock !== undefined) product.stock = Number(stock);
    
    // Handle deleted images
    if (deletedImages) {
      // Convert string to array if it's a string
      const deletedImagesArray = typeof deletedImages === 'string' 
        ? deletedImages.split(',') 
        : Array.isArray(deletedImages) ? deletedImages : [];
      
      for (const fileId of deletedImagesArray) {
        try {
          // Delete from GridFS
          await getBucket().delete(new ObjectId(fileId));
        } catch (err) {
          console.error(`Failed to delete file ${fileId} from GridFS:`, err);
        }
      }
      
      // Filter out deleted images
      product.images = product.images.filter(
        img => !deletedImagesArray.includes(img.fileId.toString())
      );
    }
    
    // Handle main image changes
    if (mainImageId) {
      product.images.forEach(img => {
        img.isMain = img.fileId.toString() === mainImageId;
      });
    }
    
    // Add new images if any
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          let fileId;
          
          const uploadStream = getBucket().openUploadStream(file.originalname, {
            contentType: file.mimetype,
          });
          
          fileId = uploadStream.id;
          uploadStream.end(file.buffer);

          uploadStream.on('finish', () => {
            // Only set as main if no images exist or explicitly requested
            const isMain = product.images.length === 0 || 
                          (req.body.newMainFilename && req.body.newMainFilename === file.originalname);
            
            product.images.push({
              fileId: fileId,
              filename: file.originalname,
              isMain: isMain
            });
            resolve();
          });

          uploadStream.on('error', (err) => {
            reject(err);
          });
        });
      });

      await Promise.all(uploadPromises);
    }
    
    // Ensure at least one image is marked as main
    if (product.images.length > 0 && !product.images.some(img => img.isMain)) {
      product.images[0].isMain = true;
    }
    
    // Save the updated product
    await product.save();

    res.json({ 
      success: true,
      message: 'Product updated successfully', 
      data: product
    });
  } catch (error) {
    console.error('Product update error:', error);
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    // Delete all product images from GridFS
    const deletePromises = product.images.map(img => {
      return getBucket().delete(img.fileId).catch(err => {
        console.error(`Failed to delete file ${img.fileId} from GridFS:`, err);
      });
    });
    
    await Promise.all(deletePromises);
    
    // Delete the product
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: 'Product and related images deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific image by its file ID
// @route   GET /api/products/image/:id
// @access  Public
exports.getProductImage = async (req, res, next) => {
  try {
    const fileId = new ObjectId(req.params.id);
    const file = await mongoose.connection.db.collection('uploads.files').findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: 'Image not found' 
      });
    }

    const downloadStream = getBucket().openDownloadStream(fileId);
    res.set('Content-Type', file.contentType);
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};