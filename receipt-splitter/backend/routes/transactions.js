
// routes/transactions.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// GET all transactions
router.get('/', transactionController.getTransactions);

// POST a new transaction
router.post('/', transactionController.createTransaction);

module.exports = router;