const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return this.authProvider === 'local'; } },
  authProvider: { type: String, enum: ['google', 'local'], default: 'local' },
  profilePhotoKey: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  // Google OAuth specific fields
  googleId: { type: String, sparse: true },
  googleProfilePhoto: { type: String, default: null },
}, { timestamps: true });

// Hash password only for local authentication
userSchema.pre('save', async function (next) {
  if (this.authProvider === 'local' && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  if (this.authProvider !== 'local') {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 