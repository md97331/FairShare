// routes/friends.js
const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');

// Search for a user by email or name: GET /api/friends/search?email=... or ?name=...
router.get('/search', friendsController.searchUser);

// Get all friends for a specific user: GET /api/friends/:userId
router.get('/:userId', friendsController.getFriends);

// Add a friend: POST /api/friends/:userId/add with body { "friendId": "ID_OF_FRIEND" }
router.post('/:userId/add', friendsController.addFriend);

// Remove a friend: DELETE /api/friends/:userId/remove/:friendId
router.delete('/:userId/remove/:friendId', friendsController.removeFriend);

module.exports = router;