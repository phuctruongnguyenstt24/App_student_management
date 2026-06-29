const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courses');
const updateRequestRoutes = require('./routes/updateRequestRoutes');
const studentRoutes = require('./routes/studentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
 

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', updateRequestRoutes);
app.use('/api', studentRoutes);
app.use('/api/schedules', scheduleRoutes);
 

// Test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server OK'
  });
});

// CONNECT DB → START SERVER
async function startServer() {
  try {
    console.log('⏳ Connecting MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running: ${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  }
}

startServer();