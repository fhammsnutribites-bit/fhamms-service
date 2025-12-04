// Vercel Serverless Function Entry Point
// This file routes all API requests to the Express app
const app = require('../app');
const mongoose = require('mongoose');

// Connect to MongoDB (connection is cached across invocations in serverless)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('MongoDB connected (serverless)');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
  });
}

// Export the Express app as a Vercel serverless function
module.exports = app;

