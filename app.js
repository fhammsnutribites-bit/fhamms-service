const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');

const app = express();

// CORS configuration - allow requests from frontend domain and localhost
const allowedOrigins = [
  'https://fhamms.vercel.app', // Frontend production URL
  'https://fhamms.vercel.app/', // With trailing slash
  process.env.FRONTEND_URL, // Frontend Vercel URL from environment variable
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  'http://localhost:5000' // Backend localhost
].filter(Boolean);

// CORS middleware - allow all origins for now to fix the issue
// In production, you can restrict this to specific origins
app.use(cors({
  origin: true, // Allow all origins (you can change this to allowedOrigins for production)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());

// Handle preflight OPTIONS requests
app.options('*', cors());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);

module.exports = app;
