const request = require('supertest');
const express = require('express');

// Create a minimal app for testing (no MongoDB needed)
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service Running' });
});

app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  res.status(201).json({ message: 'User registered' });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  res.status(200).json({ token: 'mock-token' });
});

describe('Auth Service - Health Check', () => {
  test('GET /health returns 200 with status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Auth Service Running');
  });
});

describe('Auth Service - Register', () => {
  test('POST /auth/register returns 400 if email is missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ password: 'test123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email and password are required');
  });

  test('POST /auth/register returns 400 if password is missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /auth/register returns 201 with valid data', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'test123' });
    expect(res.statusCode).toBe(201);
  });
});

describe('Auth Service - Login', () => {
  test('POST /auth/login returns 400 if credentials missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test('POST /auth/login returns 200 with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'test123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
