// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login for user login
router.post('/login', authController.login);

// POST /api/auth/register for user registration
router.post('/register', authController.register);

router.get('/userinfo/:userId', authController.getUserInfo);


module.exports = router;