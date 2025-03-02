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
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { API_BASE_URL } from '@env';

// Define API endpoints using the same pattern as FriendsScreen
const friendsURL = 'http://172.16.6.84:3080/api/friends';
const SCAN_RECEIPT_URL = 'http://172.16.49.114:3080/api/scan-receipt';

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
  const [scanningProgress, setScanningProgress] = useState(0);
  const [scanningInterval, setScanningInterval] = useState(null);

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

  // Cleanup scanning interval on unmount
  useEffect(() => {
    return () => {
      if (scanningInterval) {
        clearInterval(scanningInterval);
      }
    };
  }, [scanningInterval]);

  // Search friends API - Updated to match FriendsScreen
  const searchFriends = async (query) => {
    if (query.trim() === '') return;
    
    try {
      setIsLoading(true);
      // Use the same pattern as in FriendsScreen
      const url = `${friendsURL}/search?q=${encodeURIComponent(query)}`;
      console.log('Searching users with URL:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // Filter out users already in selected friends list
        const filtered = data.filter(item => 
          !selectedFriends.some(f => f.id === item.id)
        );
        setSearchResults(filtered);
      } else {
        console.error('Error searching for users, status:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching friends:', error);
      console.log('Network request failed. API URL:', url);
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

  // Retake photo
  const retakePhoto = () => {
    setImageUri(null);
  };

  // Start fake progress for scanning
  const startScanningProgress = () => {
    setScanningProgress(0);
    const interval = setInterval(() => {
      setScanningProgress((prev) => {
        // Slowly increase up to 90% to give impression of progress
        if (prev < 90) {
          return prev + Math.random() * 5;
        }
        return prev;
      });
    }, 300);
    setScanningInterval(interval);
  };

  // Cancel scanning
  const cancelScanning = () => {
    if (scanningInterval) {
      clearInterval(scanningInterval);
      setScanningInterval(null);
    }
    setIsScanning(false);
    setScanningProgress(0);
  };

  // Scan receipt using API
  const scanReceipt = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please take or upload a receipt image first');
      return;
    }

    try {
      setIsScanning(true);
      startScanningProgress();
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('receipt', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      });

      // Use the direct URL like in HomeScreen
      const response = await fetch(SCAN_RECEIPT_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Clear the interval
      if (scanningInterval) {
        clearInterval(scanningInterval);
        setScanningInterval(null);
      }
      
      // Set progress to 100%
      setScanningProgress(100);

      // Always try to get the response text first
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Response is not valid JSON, using basic structure');
        // Create a basic structure with the response text
        data = {
          merchant: "Receipt Analysis",
          date: new Date().toLocaleDateString(),
          items: [{ name: "Item from receipt", price: 0 }],
          rawText: responseText,
          total: 0
        };
      }
      
      // Add a small delay to show 100% completion
      setTimeout(() => {
        setReceiptData(data);
        setScannedText(responseText);
        setIsScanning(false);
      }, 500);
      
    } catch (error) {
      console.error('Error scanning receipt:', error);
      
      // Even if network request fails, provide a basic structure
      const basicData = {
        merchant: "Receipt Analysis",
        date: new Date().toLocaleDateString(),
        items: [{ name: "Network error occurred", price: 0 }],
        rawText: "Could not connect to server. Please check your network connection.",
        total: 0
      };
      
      // Clear the interval
      if (scanningInterval) {
        clearInterval(scanningInterval);
        setScanningInterval(null);
      }
      
      // Set progress to 100%
      setScanningProgress(100);
      
      // Add a small delay to show 100% completion
      setTimeout(() => {
        setReceiptData(basicData);
        setScannedText(basicData.rawText);
        setIsScanning(false);
      }, 500);
    }
  };

  // Generate mock receipt data
  const generateMockReceiptData = () => {
    return {
      merchant: "Restaurant/Store",
      date: new Date().toLocaleDateString(),
      items: [
        { name: "Item 1", price: 9.99 },
        { name: "Item 2", price: 12.50 },
        { name: "Item 3", price: 7.25 },
      ],
      subtotal: 29.74,
      tax: 2.38,
      tip: 5.95,
      total: 38.07
    };
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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Create a Split</Text>

        {/* Input for Split Title */}
        <TextInput
          style={styles.input}
          placeholder="Enter Split Title"
          value={title}
          onChangeText={setTitle}
        />

        {/* Friend Search - Moved down and adjusted for center camera */}
        <View style={styles.friendSection}>
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
              <View style={styles.searchResults}>
                {searchResults.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultItem}
                    onPress={() => addFriend(item)}
                  >
                    <Text style={styles.friendText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}
        </View>

        {/* Selected Friends */}
        {selectedFriends.length > 0 && (
          <View style={styles.selectedFriendsContainer}>
            <Text style={styles.subtitle}>Selected Friends:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedFriends.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.selectedFriendChip}
                  onPress={() => removeFriend(item.id)}
                >
                  <Text style={styles.selectedFriendText}>{item.name} ✕</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Image Display */}
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            
            {!receiptData && !isScanning && (
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.retakeButton]} 
                  onPress={retakePhoto}
                >
                  <Text style={styles.buttonText}>📷 Retake Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.scanButton]} 
                  onPress={scanReceipt}
                >
                  <Text style={styles.buttonText}>🔍 Scan Receipt</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Scan a receipt to get details</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={openCamera}>
                <Text style={styles.buttonText}>📷 Open Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>📂 Upload from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scanning Progress Modal */}
        <Modal
          transparent={true}
          visible={isScanning}
          animationType="fade"
          onRequestClose={cancelScanning}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Scanning Receipt</Text>
              <Text style={styles.modalText}>Please wait while we analyze your receipt...</Text>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${scanningProgress}%` }
                  ]} 
                />
              </View>
              
              <Text style={styles.progressText}>{Math.round(scanningProgress)}%</Text>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelScanning}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Scanned Receipt Data */}
        {receiptData && (
          <View style={styles.receiptDataContainer}>
            <Text style={styles.subtitle}>Receipt Details</Text>
            
            {receiptData.merchant && (
              <Text style={styles.merchantName}>{receiptData.merchant}</Text>
            )}
            
            {receiptData.date && (
              <Text style={styles.receiptText}>Date: {receiptData.date}</Text>
            )}
            
            {/* Items List */}
            {receiptData.items && receiptData.items.length > 0 && (
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>Items:</Text>
                {receiptData.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                      {item.name || `Item ${index + 1}`}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.price)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Subtotal, Tax, and Total */}
            <View style={styles.totalSection}>
              {receiptData.subtotal !== undefined && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(receiptData.subtotal)}</Text>
                </View>
              )}
              
              {receiptData.tax !== undefined && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(receiptData.tax)}</Text>
                </View>
              )}
              
              {receiptData.tip !== undefined && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tip:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(receiptData.tip)}</Text>
                </View>
              )}
              
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(receiptData.total)}
                </Text>
              </View>
            </View>
            
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
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: StatusBar.currentHeight || 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
    marginTop: 10, // Added space at top
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 15,
    fontSize: 16,
  },
  friendSection: {
    marginTop: 15, // Added more space before friend section
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
    color: '#2c3e50',
  },
  searchResults: {
    maxHeight: 150,
    width: '100%',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchResultItem: {
    width: '100%',
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFriendsContainer: {
    marginBottom: 20,
    marginTop: 5,
  },
  selectedFriendChip: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 5,
    elevation: 2,
  },
  selectedFriendText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  friendText: {
    fontSize: 16,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: 300,
    height: 400,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  scanButton: {
    flex: 1,
    marginLeft: 5,
  },
  retakeButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: '#6c757d',
  },
  receiptDataContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  receiptText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#6c757d',
  },
  itemsContainer: {
    marginTop: 15,
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 15,
    flex: 1,
    paddingRight: 10,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 15,
    color: '#6c757d',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  continueButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#6c757d',
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007bff',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '500',
  },
});

export default CameraScreen;
