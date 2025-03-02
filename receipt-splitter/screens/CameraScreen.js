import React, { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from 'react-native-text-recognition';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_BASE_URL } from '@env';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [scannedText, setScannedText] = useState('');
  const [title, setTitle] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Search for friends as user types
  useEffect(() => {
    if (searchQuery.length > 0) {
      searchFriends(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Search friends API
  const searchFriends = async (query) => {
    try {
      setIsLoading(true);
      const friendsURL = API_BASE_URL+'/api/friends';
      const response = await fetch(`${friendsURL}/search?name=${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.users || []);
      } else {
        console.error('Error searching friends:', data.error);
      }
    } catch (error) {
      console.error('Error searching friends:', error);
      // Don't show alert for every search error to avoid spamming the user
      console.log('Network request failed. Check your API_BASE_URL:', API_BASE_URL);
    } finally {
      setIsLoading(false);
    }
  };

  // Add friend to selected list
  const addFriend = (friend) => {
    if (!selectedFriends.some(f => f.id === friend.id)) {
      setSelectedFriends([...selectedFriends, friend]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove friend from selected list
  const removeFriend = (friendId) => {
    setSelectedFriends(selectedFriends.filter(friend => friend.id !== friendId));
  };

  // Open camera and capture image
  const openCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Scan receipt using API
  const scanReceipt = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please take or upload a receipt image first');
      return;
    }

    try {
      setIsScanning(true);
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('receipt', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      });

      const receiptURL = API_BASE_URL+'/api/scan-receipt';
      const response = await fetch(receiptURL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setReceiptData(data);
        setScannedText(JSON.stringify(data, null, 2)); // Display the JSON for now
      } else {
        Alert.alert('Error', data.error || 'Failed to scan receipt');
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      Alert.alert('Error', 'Failed to scan receipt. Please check your network connection and try again.');
      console.log('Network request failed. Check your API_BASE_URL:', API_BASE_URL);
    } finally {
      setIsScanning(false);
    }
  };

  // Continue to split screen
  const continueToSplit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for this split');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend to split with');
      return;
    }

    if (!receiptData) {
      Alert.alert('Error', 'Please scan a receipt first');
      return;
    }

    // Navigate to analysis screen with data
    navigation.navigate('Analysis', {
      title,
      friends: selectedFriends,
      receiptData,
      imageUri,
    });
  };

  // Reset everything
  const resetScan = () => {
    setImageUri(null);
    setScannedText('');
    setReceiptData(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Split</Text>

      {/* Input for Split Title */}
      <TextInput
        style={styles.input}
        placeholder="Enter Split Title"
        value={title}
        onChangeText={setTitle}
      />

      {/* Friend Search */}
      <Text style={styles.subtitle}>Add Friends to Split</Text>
      <TextInput
        style={styles.input}
        placeholder="Search friends by name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Search Results */}
      {isLoading ? (
        <ActivityIndicator size="small" color="#007bff" />
      ) : (
        searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            style={styles.searchResults}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => addFriend(item)}
              >
                <Text style={styles.friendText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )
      )}

      {/* Selected Friends */}
      {selectedFriends.length > 0 && (
        <>
          <Text style={styles.subtitle}>Selected Friends</Text>
          <FlatList
            data={selectedFriends}
            keyExtractor={(item) => item.id}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.selectedFriendChip}
                onPress={() => removeFriend(item.id)}
              >
                <Text style={styles.selectedFriendText}>{item.name} ✕</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Image Display */}
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          
          {!receiptData && (
            <TouchableOpacity 
              style={[styles.button, styles.scanButton]} 
              onPress={scanReceipt}
              disabled={isScanning}
            >
              <Text style={styles.buttonText}>
                {isScanning ? 'Scanning...' : '🔍 Scan Receipt'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.placeholderText}>Scan a receipt to get details</Text>
      )}

      {/* Scanned Receipt Data */}
      {receiptData && (
        <View style={styles.receiptDataContainer}>
          <Text style={styles.subtitle}>Receipt Details</Text>
          <Text style={styles.receiptText}>
            Total: ${receiptData.total || 'N/A'}
          </Text>
          <Text style={styles.receiptText}>
            Items: {receiptData.items ? receiptData.items.length : 0} items detected
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.button} onPress={resetScan}>
              <Text style={styles.buttonText}>Retake Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.continueButton]} 
              onPress={continueToSplit}
            >
              <Text style={styles.buttonText}>Continue to Split</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Buttons for Camera & Gallery */}
      {!imageUri && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={openCamera}>
            <Text style={styles.buttonText}>📷 Open Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>📂 Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  searchResults: {
    maxHeight: 150,
    width: '100%',
    marginBottom: 10,
  },
  searchResultItem: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedFriendChip: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
  },
  selectedFriendText: {
    color: 'white',
    fontWeight: 'bold',
  },
  friendText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: 'gray',
    marginVertical: 30,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  image: {
    width: 300,
    height: 400,
    borderRadius: 10,
    marginBottom: 10,
  },
  scanButton: {
    width: '80%',
  },
  receiptDataContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 15,
  },
  receiptText: {
    fontSize: 16,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  continueButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraScreen;
