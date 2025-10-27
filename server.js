require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const userRoutes = require('./routes/userRoutes');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const auth = require('./routes/auth');
require('./cron/offerExpiryCron');

const app = express();

// Suppress mongoose deprecation & AWS SDK warnings
process.env.AWS_SDK_LOAD_CONFIG = '0';
process.env.NODE_NO_WARNINGS = '1';

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', auth);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/users', userRoutes);

// Test route
app.get('/', (req, res) => res.send('SignaVox Careers API'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err.message);
  res.status(500).json({ message: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.clear(); // clears console for clean output
  console.log(`✅ Server running on port ${PORT}`);
});