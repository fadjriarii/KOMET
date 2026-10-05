const path = require('path');
const express = require('express');
const { statsLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.get('/', statsLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

module.exports = router;
