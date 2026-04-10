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
  medicalHistory: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
