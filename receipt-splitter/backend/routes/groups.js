// routes/groups.js
const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groupsController');

// Create a new group: POST /api/groups
router.post('/', groupsController.createGroup);

// Get group details: GET /api/groups/:groupId
router.get('/:groupId', groupsController.getGroup);

// Get groups for a specific user: GET /api/groups/user/:userId
router.get('/user/:userId', groupsController.getGroupsByUser);

// Add a member to a group: POST /api/groups/:groupId/add with body { "memberId": "..." }
router.post('/:groupId/add', groupsController.addMember);

// Remove a member from a group: DELETE /api/groups/:groupId/remove/:memberId
router.delete('/:groupId/remove/:memberId', groupsController.removeMember);

// Invite a member to a group: POST /api/groups/:groupId/invite with body { "memberId": "..." }
router.post('/:groupId/invite', groupsController.inviteMember);

// Get invitations for a specific user: GET /api/groups/invitations/:userId
router.get('/invitations/:userId', groupsController.getInvitationsForUser);

module.exports = router;