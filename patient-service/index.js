const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const patientRoutes = require('./routes/patients');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Patient Service connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/patients', patientRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Patient Service Running' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});
