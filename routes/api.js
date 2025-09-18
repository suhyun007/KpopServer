const express = require('express');
const router = express.Router();

// API routes
router.get('/status', (req, res) => {
  res.json({
    message: 'API is working',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Placeholder routes for future features
router.get('/users', (req, res) => {
  res.json({
    message: 'Users endpoint - coming soon',
    data: []
  });
});

router.get('/calls', (req, res) => {
  res.json({
    message: 'Calls endpoint - coming soon',
    data: []
  });
});

module.exports = router;
