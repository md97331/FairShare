// routes/imageRecognition.js
const express = require('express');
const router = express.Router();
const imageRecognitionController = require('../controllers/imageRecognitionController');

// POST endpoint to process image recognition
router.post('/recognize', imageRecognitionController.recognizeImage);

module.exports = router;