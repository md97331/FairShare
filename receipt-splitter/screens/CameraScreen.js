import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from 'react-native-text-recognition';
import { useState,useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  cameraButton: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
  },
});

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
      </View>
    );
  };

  export default CameraScreen;