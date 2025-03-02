import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ImageBackground 
} from 'react-native';
import { API_BASE_URL } from '@env';
import { AuthContext } from '../AuthContext'; 

const LOGIN_URL = new URL('api/auth/login', API_BASE_URL).toString();
const REGISTER_URL = new URL('api/auth/register', API_BASE_URL).toString();

const AuthScreen = ({ navigation }) => {
  const APP_NAME = "Fair Share";
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get setUser from context
  const { setUser } = useContext(AuthContext);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const url = isLogin ? LOGIN_URL : REGISTER_URL;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // Save user info (e.g., email) to context
        setUser({ email });
        Alert.alert(
          'Success', 
          isLogin ? 'Logged in successfully!' : 'User registered successfully!', 
          [{ text: 'OK', onPress: () => navigation.replace('MainApp') }]
        );
      } else {
        Alert.alert('Error', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Auth Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/auth.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{APP_NAME}</Text>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', 
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 10, 
    borderRadius: 8, 
    backgroundColor: 'white', 
    marginBottom: 15 
  },
  button: { 
    backgroundColor: '#007bff', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10, 
    width: '100%' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  switchText: { 
    color: '#007bff', 
    marginTop: 10, 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});

export default AuthScreen;