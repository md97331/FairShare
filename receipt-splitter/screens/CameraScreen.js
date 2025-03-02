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
} from 'react-native';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [scannedText, setScannedText] = useState('');
  const [title, setTitle] = useState('');
  const [friends, setFriends] = useState([
    { id: '1', name: 'Alice', selected: false },
    { id: '2', name: 'Bob', selected: false },
    { id: '3', name: 'Charlie', selected: false },
  ]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Open camera and capture image
  const openCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImageUri(result.uri);
      processImage(result.uri);
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

    if (!result.cancelled) {
      setImageUri(result.uri);
      processImage(result.uri);
    }
  };

  // Process the image and extract text
  const processImage = async (uri) => {
    const text = await TextRecognition.recognize(uri);
    setScannedText(text.join('\n'));
  };

  // Toggle friend selection
  const toggleFriendSelection = (id) => {
    setFriends((prevFriends) =>
      prevFriends.map((friend) =>
        friend.id === id ? { ...friend, selected: !friend.selected } : friend
      )
    );
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

      {/* Friend Selection */}
      <Text style={styles.subtitle}>Select Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.friendItem, item.selected && styles.selectedFriend]}
            onPress={() => toggleFriendSelection(item.id)}
          >
            <Text style={styles.friendText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Image Display */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <Text style={styles.placeholderText}>Scan a receipt to get details</Text>
      )}

      {/* Extracted Text Display */}
      {scannedText ? <Text style={styles.scannedText}>{scannedText}</Text> : null}

      {/* Buttons for Camera & Gallery */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={openCamera}>
          <Text style={styles.buttonText}>📷 Open Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>📂 Upload from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
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
  friendItem: {
    width: '100%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    elevation: 3,
    alignItems: 'center',
  },
  selectedFriend: {
    backgroundColor: '#007bff',
  },
  friendText: {
    fontSize: 16,
    color: 'black',
  },
  placeholderText: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  scannedText: {
    fontSize: 16,
    color: 'black',
    marginTop: 10,
    textAlign: 'center',
  },
  image: {
    width: 300,
    height: 400,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraScreen;
