import mongoose, { model } from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  displayName: { type: String },  // For guests, we use displayName
  email: { type: String, default: null },
  password: { type: String, default: null },
  roles: { type: [String], default: ['user'] },  // Can be ['user'], ['guest'], ['admin']
  guest: { type: Boolean, default: false },
  provider: { type: String, enum: ['local', 'google', 'github', null], default: 'local' },
  isVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  walletAddress: { type: String, default: null },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
});


// Automatically update "updatedAt" field on save
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

userSchema.pre('save', async function (next) {
  // Hash password if it's being modified
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Automatically update "updatedAt" field on save
  this.updatedAt = new Date();
  next();
});

const User = model("User", userSchema);

export default User;
