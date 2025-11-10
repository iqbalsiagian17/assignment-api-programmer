const express = require('express');
const cors = require('cors');
const path = require('path');
const membershipRoutes = require('./routes/membershipRoutes');
const informationRoutes = require('./routes/informationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Nutech Integration Test API',
    version: '1.0.0',
    status: 'running'
  });
});

// Routes
app.use('/', membershipRoutes);
app.use('/', informationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Endpoint not found',
    data: null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 500,
    message: err.message || 'Internal server error',
    data: null
  });
});

module.exports = app;