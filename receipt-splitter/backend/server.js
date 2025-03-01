// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account key
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Initialize Express App
const app = express();
app.use(cors());
app.use(express.json());

// Import Routes
const transactionRoutes = require('./routes/transactions');
const imageRecognitionRoutes = require('./routes/imageRecognition');

// Mount Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/image', imageRecognitionRoutes);

const PORT = process.env.PORT || 3080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});