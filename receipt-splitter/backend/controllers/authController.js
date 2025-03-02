// needs to have name of the user,
// amount he ows
// status of paymente in a specefic trasaction based on its name

// get users from databased based on its nickname

// controllers/authController.js
// controllers/authController.js
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const db = admin.firestore();

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    // Check if a user with the same email already exists
    const userQuerySnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!userQuerySnapshot.empty) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword, // store the hashed password
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save the new user to Firestore
    const userRef = await db.collection('users').add(userData);
    res.status(201).json({ message: 'User registered successfully.', userId: userRef.id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    
    // Query Firestore for the user with the matching email.
    const userQuerySnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
      
    if (userQuerySnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    const userDoc = userQuerySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Compare the provided password with the stored hashed password.
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    // For a simple login, we just return a success message.
    res.status(200).json({ message: 'Login successful.', userId: userDoc.id });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
};