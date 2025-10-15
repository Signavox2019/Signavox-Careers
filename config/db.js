const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB (new syntax, no deprecated options)
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Stop the server if DB connection fails
  }
};

module.exports = connectDB;
