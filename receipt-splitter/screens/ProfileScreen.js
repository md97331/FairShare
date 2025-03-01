import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const ProfileScreen = () => {
  // User details state
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+1234567890',
  });

  const [isEditing, setIsEditing] = useState(false); // Toggle between edit and view mode

  // Function to handle user input changes
  const handleChange = (key, value) => {
    setUser({ ...user, [key]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Display/Edit Name */}
      <Text style={styles.label}>Name:</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={user.name}
          onChangeText={(text) => handleChange('name', text)}
        />
      ) : (
        <Text style={styles.info}>{user.name}</Text>
      )}

      {/* Display/Edit Email */}
      <Text style={styles.label}>Email:</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={user.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
        />
      ) : (
        <Text style={styles.info}>{user.email}</Text>
      )}

      {/* Display/Edit Phone */}
      <Text style={styles.label}>Phone:</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={user.phone}
          onChangeText={(text) => handleChange('phone', text)}
          keyboardType="phone-pad"
        />
      ) : (
        <Text style={styles.info}>{user.phone}</Text>
      )}

      {/* Edit / Save Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsEditing(!isEditing)}
      >
        <Text style={styles.buttonText}>{isEditing ? 'Save' : 'Edit'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  info: {
    fontSize: 16,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
