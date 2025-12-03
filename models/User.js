const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  addresses: [
    {
      label: { type: String, default: '' },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
      phone: { type: String },
      isDefault: { type: Boolean, default: false },
      _id: false // prevents creation of subdocument _id
    }
  ],
  paymentMethods: [
    {
      type: { type: String },
      cardLast4: { type: String },
      brand: { type: String },
      isDefault: { type: Boolean, default: false },
      _id: false
    }
  ]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if(!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
