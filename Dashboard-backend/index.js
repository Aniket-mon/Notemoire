const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const port = 5000;

connectToMongo();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// Request logging 
app.use(morgan("combined"));

// rate limiter
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100, 
  message: "Too many requests from this IP, please try again later."
});

app.use(limiter);

// Login brute-force protection
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: "Too many login attempts. Please try again later."
});

app.use('/api/auth/login', loginLimiter);

// CORS configuration
app.use(cors({
  origin: "https://notemoire-social-media.vercel.app",
  credentials: true
}));

// JSON parsing
app.use(express.json());

// Simple IP firewall
app.use((req, res, next) => {
  const blockedIPs = [
    "1.2.3.4",
    "5.6.7.8"
  ];

  if (blockedIPs.includes(req.ip)) {
    return res.status(403).send("Access denied");
  }

  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

app.listen(port, () => {
  console.log(`Server listening locally on http://localhost:${port}`);
});

module.exports = app;