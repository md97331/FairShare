// controllers/transactionController.js
const admin = require('firebase-admin');
const db = admin.firestore();

exports.createTransaction = async (req, res) => {
  try {
    const transactionData = req.body;

    // Validate required fields
    if (!transactionData.date || !Array.isArray(transactionData.users)) {
      return res.status(400).json({ error: 'Missing required fields: date and users array' });
    }

    // Process each user entry
    transactionData.users = transactionData.users.map(userEntry => {
      if (!userEntry.items || !Array.isArray(userEntry.items)) {
        throw new Error(`Missing items for user ${userEntry.userId || 'unknown'}`);
      }
      
      // Calculate user's total if not provided
      if (typeof userEntry.total !== 'number') {
        userEntry.total = userEntry.items.reduce((sum, item) => sum + (item.price || 0), 0);
      }
      
      // Calculate splitAmount (here we assume it's the same as the user's total,
      // but you can implement any splitting logic you require)
      if (typeof userEntry.splitAmount !== 'number') {
        userEntry.splitAmount = userEntry.total;
      }
      
      return userEntry;
    });

    // Compute overall transaction total if not provided
    if (typeof transactionData.total !== 'number') {
      transactionData.total = transactionData.users.reduce((sum, userEntry) => sum + userEntry.total, 0);
    }

    // Add a server timestamp for when the transaction was created
    transactionData.createdAt = admin.firestore.FieldValue.serverTimestamp();

    // Save the transaction document to Firestore
    const docRef = await db.collection('transactions').add(transactionData);
    res.status(201).json({ id: docRef.id, message: 'Transaction created successfully.' });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    // Retrieve transactions, optionally ordering by creation time
    const snapshot = await db.collection('transactions').orderBy('createdAt', 'desc').get();
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