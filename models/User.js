//server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Address = require('./Address'); // Import Address model

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  isAdmin: { type: Boolean, default: false },
  phone: { type: String },
  otp: {
    code: String,
    expiresAt: Date,
    isPasswordReset: Boolean
  },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// CASCADE DELETE: Delete addresses when user is deleted
userSchema.pre('remove', async function (next) {
  await Address.deleteMany({ userEmail: this.email }); // Delete all addresses linked to this user
  next();
});

module.exports = mongoose.model('User', userSchema);