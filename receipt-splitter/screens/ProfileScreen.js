import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { AuthContext } from '../AuthContext';
import { API_BASE_URL } from '@env';

const ProfileScreen = () => {
  // Get the user's email from AuthContext.
  const { user } = useContext(AuthContext);
  const email = user?.email || "example@example.com";
  
  // Local state for full user info fetched from API.
  const [userInfo, setUserInfo] = useState({ name: "Loading...", email });
  const [loading, setLoading] = useState(true);

  // Build the base profile URL. (Make sure the endpoint is correct on your backend.)
  const profileURL = new URL('api/auth/userinfo', API_BASE_URL).toString();

  const fetchUserInfo = async () => {
    try {
      // Append the encoded email to the base profileURL.
      const url = `${profileURL}/${encodeURIComponent(email)}`;
      console.log('Fetching user info from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else {
        console.error('Error fetching user info, status:', response.status);
        setUserInfo({ name: "Unknown", email });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo({ name: "Unknown", email });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [email]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{userInfo.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{userInfo.email}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={() => { /* Add edit logic here */ }}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});