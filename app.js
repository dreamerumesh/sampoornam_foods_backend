
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

// Route imports 
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const addressRoutes = require('./routes/address.routes');

// Initialize app
const app = express();
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL,
              methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
              allowedHeaders: ["Content-Type", "Authorization"],
              credentials: true }));

// Connect to database
connectDB();

// Initialize GridFS
mongoose.connection.once('open', () => {
  global.gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  console.log('GridFS initialized');
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Set static folder for uploads 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes 
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/history', require('./routes/history.routes'));

app.use(errorHandler);

module.exports = app;


