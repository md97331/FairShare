// routes/transactions.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// GET all transactions (existing endpoint)
router.get('/', transactionController.getTransactions);

// GET transaction by transaction name
router.get('/name/:transactionName', transactionController.getTransactionByName);

// GET a range of transactions for a specific user using query parameters
router.get('/userRange/:userId', transactionController.getTransactionsRangeByUser);

// GET monthly transactions for a specific user
router.get('/monthly/:userId', transactionController.getMonthlyTransactionsByUser);

// POST a new transaction (existing endpoint)
router.post('/', transactionController.createTransaction);

// GET count of transactions for a user
router.get('/count/:userId', transactionController.getTransactionCountByUser);

module.exports = router;