import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const FriendsScreen = () => {
  const [friends, setFriends] = useState([]);
  const [friendName, setFriendName] = useState('');

  // Function to add a new friend
  const addFriend = () => {
    if (friendName.trim() !== '') {
      setFriends([...friends, { id: Date.now().toString(), name: friendName }]);
      setFriendName('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Friends</Text>

      {/* Input for adding friends */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter friend's name"
          value={friendName}
          onChangeText={setFriendName}
        />
        <TouchableOpacity style={styles.addButton} onPress={addFriend}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* List of Friends */}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Text style={styles.friendText}>{item.name}</Text>
          </View>
        )}
      />
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
    marginTop: 45,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
  },
  friendText: {
    fontSize: 16,
  },
});

export default FriendsScreen;
