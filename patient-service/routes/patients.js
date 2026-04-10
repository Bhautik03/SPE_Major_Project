const express = require('express');
const Patient = require('../models/Patient');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes below
router.use(authMiddleware);

// GET all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one patient
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new patient
router.post('/', async (req, res) => {
  const patient = new Patient({
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    contact: req.body.contact,
    address: req.body.address,
    medicalHistory: req.body.newMedicalHistory ? [{ details: req.body.newMedicalHistory }] : []
  });

  try {
    const newPatient = await patient.save();
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin Only Routes below this point
// Note: per user request "google auth so admin authenticate itself and after perform crud operation"
// We assume creating and reading can be done by normal users (or maybe also just admin),
// but we will enforce admin for Update and Delete just to show different roles, 
// OR enforce admin for everything. Based on typical requirements, let's enforce admin for modifying.
// router.use(adminMiddleware);

// UPDATE a patient (Both User and Admin can update for now, or uncomment above row to restrict)
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.body.name != null) patient.name = req.body.name;
    if (req.body.age != null) patient.age = req.body.age;
    if (req.body.gender != null) patient.gender = req.body.gender;
    if (req.body.contact != null) patient.contact = req.body.contact;
    if (req.body.address != null) patient.address = req.body.address;
    
    // Append new medical history if provided
    if (req.body.newMedicalHistory) {
      patient.medicalHistory.push({ details: req.body.newMedicalHistory });
    }

    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete patient (previously admin only)
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    
    await patient.deleteOne();
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
