const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// Initialize GridFS
const initGridFS = () => {
  const conn = mongoose.connection;
  
  let bucket;
  conn.once('open', () => {
    bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
    //console.log('GridFS initialized');
  });
};

module.exports = { initGridFS };