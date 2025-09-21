
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const expensesRoutes = require('./routes/expenses');
const categoriesRoutes = require('./routes/categories');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/user');
const path = require('path');
const app = express();
const fs = require('fs');


app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiter: general api (light). Login has its own stricter limiter in auth route.
app.use(rateLimit({ windowMs: 15*60*1000, max: 200 }));

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/analytics', analyticsRoutes);
// In your routes file
app.get('/uploads/receipts/:filename', (req, res) => {
  const filename = req.params.filename;
const uploadPath = path.join(process.cwd(), 'uploads', 'receipts');
console.log(uploadPath);
  // Check if file exists
  if (fs.existsSync(uploadPath)) {
    res.sendFile(uploadPath+'/'+filename);
  } else {
    res.status(404).send('File not found');
  }
});
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Expense Tracker Backend is running' });
});

module.exports = app;
