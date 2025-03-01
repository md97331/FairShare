// controllers/transactionController.js
const admin = require('firebase-admin');
const db = admin.firestore();

// Get all transactions from Firestore
exports.getTransactions = async (req, res) => {
  try {
    const snapshot = await db.collection('transactions').get();
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new transaction document in Firestore
exports.createTransaction = async (req, res) => {
  try {
    const transactionData = req.body;
    // Expected fields could include: amount, description, date, etc.
    const docRef = await db.collection('transactions').add(transactionData);
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
};