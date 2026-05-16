const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const client = require('prom-client');
const winston = require('winston');
require('dotenv').config();

const patientRoutes = require('./routes/patients');

// ── Winston Logger (JSON to stdout → Filebeat → ELK) ──
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'patient-service' },
  transports: [
    new winston.transports.Console(),
  ],
});

// ── Prometheus Metrics ────────────────────────
const register = new client.Registry();
register.setDefaultLabels({ service: 'patient-service' });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to track request metrics + logging
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    end({ method: req.method, route, status_code: res.statusCode });
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
    logger.info('HTTP Request', {
      method: req.method,
      route,
      status: res.statusCode,
      ip: req.ip,
    });
  });
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Patient Service connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error', { error: err.message }));

// Routes
app.use('/patients', patientRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Patient Service Running' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  logger.info(`Patient Service running on port ${PORT}`);
});

module.exports = app;

