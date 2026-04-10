const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  medicalHistory: [{
    date: { type: Date, default: Date.now },
    details: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
