import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { AuthContext } from '../AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API endpoints
const USER_PROFILE_URL = 'http://10.10.1.136:3080/api/auth/profile';
const UPDATE_PROFILE_URL = 'http://10.10.1.136:3080/api/auth/update';

const ProfileScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // User profile state
  const [profile, setProfile] = useState({
    name: user?.name || 'User',
    email: user?.email || '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!user || !user.email) {
      console.log('No user data available');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log(`Fetching profile for user: ${user.email}`);
      
      const response = await fetch(`${USER_PROFILE_URL}/${user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Profile API response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Profile data received:', userData);
        
        setProfile({
          ...profile,
          name: userData.name || user.name || 'User',
          email: userData.email || user.email || '',
          // Don't set password fields from API
          password: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        console.log('Failed to fetch profile, using local data');
        // If API fails, use data from context
        setProfile({
          ...profile,
          name: user.name || 'User',
          email: user.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If API fails, use data from context
      setProfile({
        ...profile,
        name: user.name || 'User',
        email: user.email || '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setProfile({ ...profile, [key]: value });
  };

  const validateForm = () => {
    // Check if name and email are filled
    if (!profile.name.trim() || !profile.email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return false;
    }
    
    // If changing password, validate password fields
    if (profile.newPassword) {
      if (!profile.password) {
        Alert.alert('Error', 'Current password is required to set a new password');
        return false;
      }
      
      if (profile.newPassword !== profile.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return false;
      }
      
      if (profile.newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters');
        return false;
      }
    }
    
    return true;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      const updateData = {
        email: profile.email,
        name: profile.name,
      };
      
      // Only include password fields if changing password
      if (profile.newPassword) {
        updateData.currentPassword = profile.password;
        updateData.newPassword = profile.newPassword;
      }
      
      console.log('Sending profile update:', JSON.stringify(updateData));
      
      const response = await fetch(UPDATE_PROFILE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      console.log('Update profile response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Profile update successful:', responseData);
        
        // Update user in context
        const updatedUser = {
          ...user,
          name: profile.name,
          email: profile.email,
        };
        
        setUser(updatedUser);
        
        // Update AsyncStorage
        try {
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (storageError) {
          console.error('Error updating user in AsyncStorage:', storageError);
        }
        
        // Clear password fields
        setProfile({
          ...profile,
          password: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        let errorMessage = 'Failed to update profile';
        
        try {
          const errorData = await response.json();
          console.error('Profile update error:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              console.log('Logging out user');
              
              // Clear user from context
              setUser(null);
              
              // Clear AsyncStorage
              await AsyncStorage.removeItem('user');
              
              console.log('User data cleared, navigating to Auth screen');
              
              // Navigate to Auth screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Get the first letter of the user's name for the profile image
  const getInitial = () => {
    return profile.name ? profile.name.charAt(0).toUpperCase() : '?';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>{getInitial()}</Text>
          </View>
        </View>
        
        <View style={styles.card}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.value}>{profile.name}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profile.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.value}>{profile.email}</Text>
            )}
          </View>
          
          {isEditing && (
            <>
              <View style={styles.passwordSection}>
                <Text style={styles.passwordTitle}>Change Password (Optional)</Text>
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={profile.password}
                  onChangeText={(text) => handleChange('password', text)}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={profile.newPassword}
                  onChangeText={(text) => handleChange('newPassword', text)}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={profile.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>
            </>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={saveProfile}
              >
                <Icon name="check" size={20} color="white" />
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setIsEditing(false);
                  // Reset form
                  fetchUserProfile();
                }}
              >
                <Icon name="close" size={20} color="white" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.editButton]} 
                onPress={() => setIsEditing(true)}
              >
                <Icon name="edit" size={20} color="white" />
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.logoutButton]} 
                onPress={handleLogout}
              >
                <Icon name="logout" size={20} color="white" />
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  passwordSection: {
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  passwordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
});

export default ProfileScreen;