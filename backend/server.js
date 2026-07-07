const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); 
const fs = require('fs'); 

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courses');
const updateRequestRoutes = require('./routes/updateRequestRoutes');
const studentRoutes = require('./routes/studentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const newsRoutes = require("./routes/newsRoutes");

const app = express();

// ✅ Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads/avatars directory');
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (cho avatar)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use("/api/news", newsRoutes);
// Test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server OK'
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
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
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadDir}`);
    });

  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  }
}

startServer();