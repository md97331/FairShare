// server.js
require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Uncomment and set your database URL if you use the Realtime Database:
  // databaseURL: process.env.FIREBASE_DB_URL,
});

// Use Firestore as our database
const db = admin.firestore();

// A simple test route
app.get('/', (req, res) => {
  res.send('Spending Splitter Tracker API using Firebase');
});

// Example endpoint: Create a new user document in Firestore
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body; // Expect JSON data with user fields (name, email, etc.)
    const userRef = await db.collection('users').add(userData);
    res.status(201).json({ id: userRef.id });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// You can add more endpoints for groups, expenses, authentication, etc.
// For example, an endpoint to create an expense:
app.post('/api/expenses', async (req, res) => {
  try {
    const expenseData = req.body; // Should include group ID, amount, description, etc.
    const expenseRef = await db.collection('expenses').add(expenseData);
    res.status(201).json({ id: expenseRef.id });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});