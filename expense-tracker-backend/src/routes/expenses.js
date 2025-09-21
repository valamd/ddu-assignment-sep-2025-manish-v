const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure uploads directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/receipts';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(/\s+/g, '-').replace(ext, '');
    cb(null, `${unique}-${name}${ext}`);
  }
});

// File filter for security
function fileFilter(req, file, cb) {
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
  }
}

// Configure multer
const upload = multer({ 
  storage, 
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }, 
  fileFilter 
});

// Routes
router.get('/', auth, expensesController.list);
router.get('/export', auth, expensesController.exportCSV);
router.post('/', auth, upload.single('receipt'), expensesController.create);
router.put('/:id', auth, upload.single('receipt'), expensesController.update);
router.delete('/:id', auth, expensesController.remove);
router.post('/bulk-delete', auth, expensesController.bulkDelete);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size too large. Maximum size is 5MB.'
        }
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: error.message
      }
    });
  }
  
  next(error);
});

module.exports = router;