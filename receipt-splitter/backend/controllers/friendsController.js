// controllers/friendsController.js
const admin = require('firebase-admin');
const db = admin.firestore();

// Get all friends for a specific user
exports.getFriends = async (req, res) => {
  const userId = req.params.userId;
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    const friendIds = userData.friends || [];
    
    // Retrieve full information for each friend
    const friendDocs = await Promise.all(friendIds.map(id => db.collection('users').doc(id).get()));
    const friendsData = friendDocs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(friendsData);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: error.message });
  }
};

// Search for a user by email or name
exports.searchUser = async (req, res) => {
  const { email, name } = req.query;
  try {
    let query = db.collection('users');
    if (email) {
      query = query.where('email', '==', email);
    } else if (name) {
      // A basic search on name using range queries
      query = query.where('name', '>=', name).where('name', '<=', name + '\uf8ff');
    } else {
      return res.status(400).json({ error: 'Please provide email or name query parameter' });
    }
    const snapshot = await query.limit(10).get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a friend to a user's friend list
exports.addFriend = async (req, res) => {
  const userId = req.params.userId;
  const { friendId } = req.body;
  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }
  try {
    // Ensure the friend exists
    const friendDoc = await db.collection('users').doc(friendId).get();
    if (!friendDoc.exists) {
      return res.status(404).json({ error: 'Friend not found' });
    }
    // Update the user's friend list using an atomic array union operation
    await db.collection('users').doc(userId).update({
      friends: admin.firestore.FieldValue.arrayUnion(friendId)
    });
    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove a friend from a user's friend list
exports.removeFriend = async (req, res) => {
  const userId = req.params.userId;
  const friendId = req.params.friendId;
  try {
    await db.collection('users').doc(userId).update({
      friends: admin.firestore.FieldValue.arrayRemove(friendId)
    });
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: error.message });
  }
};