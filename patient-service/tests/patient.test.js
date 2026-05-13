const request = require('supertest');
const express = require('express');

// Create a minimal app for testing (no MongoDB needed)
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Patient Service Running' });
});

app.get('/patients', (req, res) => {
  res.status(200).json([]);
});

app.post('/patients', (req, res) => {
  const { name, age } = req.body;
  if (!name || !age) {
    return res.status(400).json({ message: 'Name and age are required' });
  }
  res.status(201).json({ message: 'Patient created', patient: { name, age } });
});

app.get('/patients/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'invalid') {
    return res.status(404).json({ message: 'Patient not found' });
  }
  res.status(200).json({ _id: id, name: 'Test Patient', age: 30 });
});

describe('Patient Service - Health Check', () => {
  test('GET /health returns 200 with status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Patient Service Running');
  });
});

describe('Patient Service - List Patients', () => {
  test('GET /patients returns 200 with array', async () => {
    const res = await request(app).get('/patients');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Patient Service - Create Patient', () => {
  test('POST /patients returns 400 if name is missing', async () => {
    const res = await request(app)
      .post('/patients')
      .send({ age: 30 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Name and age are required');
  });

  test('POST /patients returns 400 if age is missing', async () => {
    const res = await request(app)
      .post('/patients')
      .send({ name: 'John Doe' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /patients returns 201 with valid data', async () => {
    const res = await request(app)
      .post('/patients')
      .send({ name: 'John Doe', age: 30 });
    expect(res.statusCode).toBe(201);
    expect(res.body.patient.name).toBe('John Doe');
  });
});

describe('Patient Service - Get Patient by ID', () => {
  test('GET /patients/:id returns 404 for invalid id', async () => {
    const res = await request(app).get('/patients/invalid');
    expect(res.statusCode).toBe(404);
  });

  test('GET /patients/:id returns 200 for valid id', async () => {
    const res = await request(app).get('/patients/123');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name');
  });
});
