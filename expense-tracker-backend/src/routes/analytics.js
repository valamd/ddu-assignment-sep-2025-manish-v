
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', auth, analyticsController.overview);
router.get('/charts/spending-by-category', auth, analyticsController.spendingByCategory);
router.get('/charts/monthly-trends', auth, analyticsController.monthlyTrends);
router.get('/predictions/forecast', auth, analyticsController.forecast);

module.exports = router;
