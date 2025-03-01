// server.js
require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK using the service account key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // If using Realtime Database, uncomment the next line and set your URL:
  // databaseURL: process.env.FIREBASE_DB_URL,
});

// Use Firestore as our database
const db = admin.firestore();

// Test Route
app.get('/', (req, res) => {
  res.send('Spending Splitter Tracker API using Firebase');
});

// Sample Endpoint: Create a New User Document
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body; // Expect JSON with user details (e.g., name, email)
    const userRef = await db.collection('users').add(userData);
    res.status(201).json({ id: userRef.id });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sample Endpoint: Create a New Expense Document
app.post('/api/expenses', async (req, res) => {
  try {
    const expenseData = req.body; // Expect fields like groupId, amount, description, etc.
    const expenseRef = await db.collection('expenses').add(expenseData);
    res.status(201).json({ id: expenseRef.id });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});