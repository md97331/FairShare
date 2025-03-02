import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { API_BASE_URL } from '@env';

//const friendsURL = new URL('api/friends', API_BASE_URL).toString();
const friendsURL = API_BASE_URL+'/api/friends';
const CURRENT_USER_ID = "Mario";

const FriendsScreen = () => {
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendToAdd, setFriendToAdd] = useState('');

  // Function to load friends for the current user
  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const response = await fetch(`${friendsURL}/${CURRENT_USER_ID}`);
      if (!response.ok) throw new Error('Error fetching friends');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      // Instead of an alert, you could log the error and let the UI show no friends message
      console.error('Error fetching friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  // Function to search for users by name
  const searchFriends = async () => {
    if (searchQuery.trim() === '') return;
    try {
      const response = await fetch(`${friendsURL}/search?name=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Error searching for users');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Function to add a friend using friendId
  const addFriend = async (friendId) => {
    if (!friendId) return;
    try {
      const response = await fetch(`${friendsURL}/${CURRENT_USER_ID}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      if (!response.ok) throw new Error('Error adding friend');
      const data = await response.json();
      Alert.alert('Success', data.message || 'Friend added successfully');
      setFriendToAdd('');
      loadFriends();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Function to remove a friend by friendId
  const removeFriend = async (friendId) => {
    try {
      const response = await fetch(`${friendsURL}/${CURRENT_USER_ID}/remove/${friendId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error removing friend');
      const data = await response.json();
      Alert.alert('Success', data.message || 'Friend removed successfully');
      loadFriends();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Render individual friend item
  const renderFriend = ({ item }) => (
    <View style={styles.friendItem}>
      <Text style={styles.friendText}>{item.name}</Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
        onPress={() => removeFriend(item.id)}
      >
        <Text style={styles.actionButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Friends</Text>
      
      <TouchableOpacity style={styles.reloadButton} onPress={loadFriends}>
        <Text style={styles.reloadButtonText}>Reload Friends</Text>
      </TouchableOpacity>

      {friendsLoading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 20 }} />
      ) : friends.length === 0 ? (
        <Text style={styles.noFriendsText}>No friends! Let's add some!</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFriend}
          style={styles.list}
        />
      )}

      <Text style={[styles.title, styles.subTitle]}>Search Users</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter name to search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.actionButton} onPress={searchFriends}>
          <Text style={styles.actionButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Text style={styles.friendText}>{item.name}</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#28a745' }]}
              onPress={() => addFriend(item.id)}
            >
              <Text style={styles.actionButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
      />

      <Text style={[styles.title, styles.subTitle]}>Add Friend Manually</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter friend ID"
          value={friendToAdd}
          onChangeText={setFriendToAdd}
        />
        <TouchableOpacity style={styles.actionButton} onPress={() => addFriend(friendToAdd)}>
          <Text style={styles.actionButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#333',
  },
  subTitle: {
    fontSize: 20,
    marginTop: 30,
    marginBottom: 10,
  },
  noFriendsText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
    marginVertical: 20,
  },
  reloadButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  friendText: {
    fontSize: 16,
    color: '#333',
  },
  list: {
    marginBottom: 20,
  },
});

export default FriendsScreen;