// controllers/groupsController.js
const admin = require('firebase-admin');
const db = admin.firestore();

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, createdBy, description } = req.body;
    if (!name || !createdBy) {
      return res.status(400).json({ error: 'Group name and createdBy are required.' });
    }
    const groupData = {
      name,
      description: description || '',
      createdBy,
      members: [createdBy],
      invited: [], // Initially, no pending invitations
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const groupRef = await db.collection('groups').add(groupData);
    res.status(201).json({ message: 'Group created successfully.', groupId: groupRef.id });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get group details by groupId
exports.getGroup = async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.status(200).json({ id: groupDoc.id, ...groupDoc.data() });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get groups that a specific user is a member of
exports.getGroupsByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const snapshot = await db.collection('groups')
      .where('members', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups for user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a member to the group (they must already be a friend)
exports.addMember = async (req, res) => {
  const groupId = req.params.groupId;
  const { memberId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required.' });
  }
  try {
    // Optionally: Verify that the member is a friend of the requester (not shown here)
    await db.collection('groups').doc(groupId).update({
      members: admin.firestore.FieldValue.arrayUnion(memberId),
      // If they were previously invited, remove from invited list
      invited: admin.firestore.FieldValue.arrayRemove(memberId)
    });
    res.status(200).json({ message: 'Member added to group successfully.' });
  } catch (error) {
    console.error('Error adding member to group:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove a member from the group
exports.removeMember = async (req, res) => {
  const groupId = req.params.groupId;
  const memberId = req.params.memberId;
  try {
    await db.collection('groups').doc(groupId).update({
      members: admin.firestore.FieldValue.arrayRemove(memberId)
    });
    res.status(200).json({ message: 'Member removed from group successfully.' });
  } catch (error) {
    console.error('Error removing member from group:', error);
    res.status(500).json({ error: error.message });
  }
};

// Invite a member to the group
exports.inviteMember = async (req, res) => {
  const groupId = req.params.groupId;
  const { memberId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: 'memberId is required for invitation.' });
  }
  try {
    // Add the user to the "invited" list
    await db.collection('groups').doc(groupId).update({
      invited: admin.firestore.FieldValue.arrayUnion(memberId)
    });
    // Optionally trigger a notification (e.g., via Firebase Cloud Messaging)
    res.status(200).json({ message: 'Member invited successfully.' });
  } catch (error) {
    console.error('Error inviting member to group:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get invitations for a specific user (groups where the user is invited)
exports.getInvitationsForUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const snapshot = await db.collection('groups')
      .where('invited', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations for user:', error);
    res.status(500).json({ error: error.message });
  }
};