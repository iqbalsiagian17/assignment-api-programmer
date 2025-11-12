require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/database');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Integration Test API',
    status: 'running'
  });
});

const membershipRoutes = require('./routes/membershipRoutes');
const informationRoutes = require('./routes/informationRoutes');
const transactionRoutes = require('./routes/transactionRoutes.js');

app.use(membershipRoutes);
app.use(informationRoutes);
app.use(transactionRoutes);

app.use((req, res, next) => {
  return res.status(404).json({
    status: 404,
    message: 'Endpoint not found',
    data: null
  });
});

app.use((err, req, res, next) => {
  console.error('=== ERROR CAUGHT ===');
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  
  if (res.headersSent) {
    return next(err);
  }
  
  if (!res || typeof res.status !== 'function') {
    console.error('❌ res object invalid, skipping standard error response');
    return;
  }
  res.status(err.status || 500).json({

    status: err.status || 500,
    message: err.message || 'Internal server error',
    data: null
  });
});

const PORT = process.env.PORT || 3000;

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
  
  console.log('Database connected successfully');
  
  const server = app.listen(PORT, () => {
    console.log('Server running on port', PORT);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    });
  });
});