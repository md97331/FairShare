import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from 'react-native-text-recognition';

const CameraScreen = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const [imageUri, setImageUri] = useState(null);
    const [scannedText, setScannedText] = useState('');
  
    useEffect(() => {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }, []);
  
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
  
    const processImage = async (uri) => {
      const text = await TextRecognition.recognize(uri);
      setScannedText(text.join('\n'));
    };
  
    return (
      <View style={styles.container}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text>Scan a receipt to get details</Text>
        )}
        {scannedText ? <Text>{scannedText}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={openCamera}>
          <Text style={styles.buttonText}>📷 Open Camera</Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      padding: 20,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    button: {
      backgroundColor: '#007bff',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  export default CameraScreen;