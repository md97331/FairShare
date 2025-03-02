const admin = require('firebase-admin');
const db = admin.firestore();

// Helper function to get user document reference by email.
const getUserDocRefByEmail = async (email) => {
  const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].ref;
};

// Get all friends for a specific user
exports.getFriends = async (req, res) => {
  const email = req.params.userId; // userId now is the email
  try {
    const userDocRef = await getUserDocRefByEmail(email);
    if (!userDocRef) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();
    const friendIds = userData.friends || [];
    
    // Retrieve full information for each friend (assuming friend IDs are document IDs)
    const friendDocs = await Promise.all(
      friendIds.map(id => db.collection('users').doc(id).get())
    );
    const friendsData = friendDocs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(friendsData);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: error.message });
  }
};

// Updated search endpoint in controllers/friendsController.js
exports.searchUser = async (req, res) => {
  const q = req.query.q;
  // If no query is provided, simply return an empty array
  if (!q) {
    return res.status(200).json([]);
  }
  try {
    let query;
    // If the query contains an '@', assume it's an email
    if (q.includes('@')) {
      query = db.collection('users').where('email', '==', q);
    } else {
      // Otherwise, search by name using range queries
      query = db.collection('users')
        .where('name', '>=', q)
        .where('name', '<=', q + '\uf8ff');
    }
    // Limit to 3 results
    const snapshot = await query.limit(3).get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a friend to a user's friend list
exports.addFriend = async (req, res) => {
  const email = req.params.userId; // userId is the email
  const { friendId } = req.body;
  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }
  try {
    // Ensure the friend exists (friendId is assumed to be the document ID for the friend)
    const friendDoc = await db.collection('users').doc(friendId).get();
    if (!friendDoc.exists) {
      return res.status(404).json({ error: 'Friend not found' });
    }
    // Get the current user's document reference by email.
    const userDocRef = await getUserDocRefByEmail(email);
    if (!userDocRef) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Update the user's friend list using an atomic array union operation
    await userDocRef.update({
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
  const email = req.params.userId; // userId is the email
  const friendId = req.params.friendId;
  try {
    // Get the current user's document reference by email.
    const userDocRef = await getUserDocRefByEmail(email);
    if (!userDocRef) {
      return res.status(404).json({ error: 'User not found' });
    }
    await userDocRef.update({
      friends: admin.firestore.FieldValue.arrayRemove(friendId)
    });
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: error.message });
  }
};

