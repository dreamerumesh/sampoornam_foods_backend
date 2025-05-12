const mongoose = require('mongoose');
const config = require('./default');

const connectDB = async () => {
  try {
    console.log(config.MONGO_URI);
    const conn = await mongoose.connect(config.MONGO_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };