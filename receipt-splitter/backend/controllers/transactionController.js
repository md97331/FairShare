// controllers/transactionController.js
const admin = require('firebase-admin');
const db = admin.firestore();

// Create a new transaction (updated to support fees)
exports.createTransaction = async (req, res) => {
    try {
      const transactionData = req.body;
  
      // Validate required fields: name, date, and users array are required.
      if (!transactionData.name || !transactionData.date || !Array.isArray(transactionData.users)) {
        return res.status(400).json({ error: 'Transaction name, date, and users array are required.' });
      }
  
      // Process each user entry: calculate individual total if not provided.
      transactionData.users = transactionData.users.map(userEntry => {
        if (!userEntry.items || !Array.isArray(userEntry.items)) {
          throw new Error(`Missing items for user ${userEntry.userId || 'unknown'}`);
        }
        // Calculate user's total if not provided.
        if (typeof userEntry.total !== 'number') {
          userEntry.total = userEntry.items.reduce((sum, item) => sum + (item.price || 0), 0);
        }
        // Assume splitAmount is same as total unless provided.
        if (typeof userEntry.splitAmount !== 'number') {
          userEntry.splitAmount = userEntry.total;
        }
        return userEntry;
      });
  
      // Build an array of userIds from the users array.
      transactionData.userIds = transactionData.users.map(userEntry => userEntry.userId);
  
      // Compute overall subtotal from user totals.
      const subtotal = transactionData.users.reduce((sum, userEntry) => sum + userEntry.total, 0);
      // If a fees field is provided (and is a number), add it; otherwise, total equals the subtotal.
      if (typeof transactionData.fees === 'number') {
        transactionData.total = subtotal + transactionData.fees;
      } else {
        transactionData.total = subtotal;
      }
  
      // Add a server timestamp for when the transaction was created.
      transactionData.createdAt = admin.firestore.FieldValue.serverTimestamp();
  
      // Save the transaction document to Firestore.
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

exports.getTransactionsByUser = async (req, res) => {
    const userId = req.params.userId;
    try {
      const snapshot = await db.collection('transactions')
        .where('userIds', 'array-contains', userId)
        .orderBy('createdAt', 'desc')
        .get();
  
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions for user:', error);
      res.status(500).json({ error: error.message });
    }
  };

exports.getTransactionByName = async (req, res) => {
    const transactionName = req.params.transactionName;
    try {
      const snapshot = await db.collection('transactions')
        .where('name', '==', transactionName)
        .orderBy('createdAt', 'desc')  // Ensures a defined order (requires an index)
        .get();
  
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions by name:', error);
      res.status(500).json({ error: error.message });
    }
  };
  
exports.getTransactionsRangeByUser = async (req, res) => {
    const userId = req.params.userId;
    const startIndex = parseInt(req.query.startIndex) || 0;
    const endIndex = parseInt(req.query.endIndex) || 10;
    const limit = endIndex - startIndex;
    try {
      const snapshot = await db.collection('transactions')
        .where('userIds', 'array-contains', userId)
        .orderBy('createdAt', 'desc')
        .offset(startIndex)
        .limit(limit)
        .get();
  
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions range for user:', error);
      res.status(500).json({ error: error.message });
    }
  };
  
exports.getMonthlyTransactionsByUser = async (req, res) => {
    const userId = req.params.userId;
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month query parameters are required.' });
    }
    
    // Compute start and end dates for the month.
    const startDate = new Date(year, month - 1, 1); // month - 1 because JavaScript months are 0-indexed
    const endDate = new Date(year, month, 1);         // first day of next month
    
    try {
      const snapshot = await db.collection('transactions')
        .where('userIds', 'array-contains', userId)
        // Assumes the 'date' field is stored as an ISO string.
        .where('date', '>=', startDate.toISOString())
        .where('date', '<', endDate.toISOString())
        .orderBy('date', 'asc')
        .get();
  
      // Auto-number the results.
      let counter = 1;
      const transactions = snapshot.docs.map(doc => ({
        id: counter++,           // Auto-incremented ID in the returned result.
        name: doc.data().name,
        amount: doc.data().total, // Assuming total is the amount for the transaction.
        date: doc.data().date,
      }));
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching monthly transactions for user:', error);
      res.status(500).json({ error: error.message });
    }
  };

exports.getTransactionCountByUser = async (req, res) => {
    const userId = req.params.userId;
    try {
      // Use Firestore's count aggregation feature
      const countQuery = db.collection('transactions')
        .where('userIds', 'array-contains', userId)
        .count();
        
      const aggregateSnapshot = await countQuery.get();
      const totalCount = aggregateSnapshot.data().count;
      
      res.status(200).json({ totalCount });
    } catch (error) {
      console.error('Error fetching transaction count for user:', error);
      res.status(500).json({ error: error.message });
    }
  };