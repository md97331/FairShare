import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl
} from 'react-native';
import { AuthContext } from '../AuthContext'; 
import { API_BASE_URL } from '@env';
console.log(API_BASE_URL);

const CURRENT_USER_ID = "Mario";
const friendsURL = 'http://10.10.1.136:3080'+'/api/friends';


const FriendsScreen = () => {
  const { user } = useContext(AuthContext);
  const currentUserId = user ? user.email : "Mario";
  
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [buttonEnabled, setButtonEnabled] = useState(false);

  // Animated value for search container movement.
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Load friends for the current user.
  const loadFriends = async () => {
    try {
      setFriendsLoading(true);
      const url = `${friendsURL}/${encodeURIComponent(currentUserId)}`;
      console.log('Fetching friends from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      } else {
        console.error('Error fetching friends, status:', response.status);
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setFriendsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [currentUserId]);

  // Enable/disable the search button based on input.
  useEffect(() => {
    setButtonEnabled(searchQuery.trim().length > 0);
    if (searchQuery.trim().length === 0) {
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Animate the search container upward when search is triggered.
  const animateSearchUp = () => {
    Animated.timing(searchAnim, {
      toValue: -20, // moves up 20 pixels
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Search for users by name or email using the 'q' parameter.
  const searchFriends = async () => {
    if (searchQuery.trim() === '') return;
    animateSearchUp();
    try {
      const url = `${friendsURL}/search?q=${encodeURIComponent(searchQuery)}`;
      console.log('Searching users with URL:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filter out users already in friends list.
        const filtered = data.filter(item => !friends.some(f => f.id === item.id));
        setSearchResults(filtered);
      } else {
        console.error('Error searching for users, status:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching for users:', error);
      setSearchResults([]);
    }
  };

  // Add friend using friendId (from search result).
  const addFriend = async (friendId) => {
    if (!friendId) return;
    try {
      const url = `${friendsURL}/${encodeURIComponent(currentUserId)}/add`;
      console.log('Adding friend via URL:', url, 'with friendId:', friendId);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', data.message || 'Friend added successfully');
        setSearchResults([]);
        setSearchQuery('');
        loadFriends();
      } else {
        console.error('Error adding friend, status:', response.status);
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  // Remove friend by friendId.
  const removeFriend = async (friendId) => {
    try {
      const url = `${friendsURL}/${encodeURIComponent(currentUserId)}/remove/${friendId}`;
      console.log('Removing friend via URL:', url);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', data.message || 'Friend removed successfully');
        loadFriends();
      } else {
        console.error('Error removing friend, status:', response.status);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  // Render an individual friend item.
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

  // Render an individual search result item: name on left, email on right.
  const renderSearchItem = ({ item }) => (
    <View style={styles.searchItem}>
      <View style={styles.searchInfo}>
        <Text style={styles.searchName}>{item.name}</Text>
        <Text style={styles.searchEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#28a745' }]}
        onPress={() => addFriend(item.id)}
      >
        <Text style={styles.actionButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  // Pull-to-refresh for the friends list.
  const onRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  return (
    <View style={styles.container}>
      {/* "Your Friends" title is moved down */}
      <Text style={[styles.title, { marginTop: 80 , marginBottom:20}]}>Your Friends</Text>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFriend}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={friendsLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !friendsLoading && (
            <View style={styles.noFriendsContainer}>
              <Text style={styles.noFriendsText}>No friends! Let's add some!</Text>
            </View>
          )
        }
      />

      {/* Extra space between the friends list and search section */}

      {/* Search Section at the bottom */}
      <Animated.View style={[styles.searchContainer, { transform: [{ translateY: searchAnim }] }]}>
        <Text style={[styles.title, styles.subTitle]}>Search Users</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter name or email to search"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={[styles.actionButton, !buttonEnabled && { opacity: 0.5 }]}
            onPress={searchFriends}
            disabled={!buttonEnabled}
          >
            <Text style={styles.actionButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        {searchResults.length === 0 && searchQuery.trim() !== '' ? (
          <Text style={[styles.noFriendsText, { marginTop: -10, marginBottom: 20 }]}>No results available</Text>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSearchItem}
            style={styles.list}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subTitle: {
    fontSize: 18,
    marginVertical: 8,
    textAlign: 'center',
    color: '#333',
  },
  noFriendsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  noFriendsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  reloadButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 16,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  friendText: {
    fontSize: 14,
    color: '#333',
  },
  list: {
    marginBottom: 16,
  },
  // Styles for search result items.
  searchContainer: {
    marginTop: 20,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  searchInfo: {
    flex: 1,
  },
  searchName: {
    fontSize: 14,
    color: '#333',
  },
  searchEmail: {
    fontSize: 12,
    color: 'grey',
    textAlign: 'right',
    marginTop: 2,
  },
});

export default FriendsScreen;