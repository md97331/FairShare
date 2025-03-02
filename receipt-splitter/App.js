import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';
import { AuthProvider } from './AuthContext';

import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import FriendsScreen from './screens/FriendsScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import CameraScreen from './screens/CameraScreen';
import TransactionScreen from './screens/TransactionScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Floating Camera Button
const CameraButton = ({ onPress }) => (
  <TouchableOpacity style={styles.cameraButton} onPress={onPress}>
    <Icon name="camera" size={30} color="black" />
  </TouchableOpacity>
);

// Bottom Navigation (Main App)
const MainApp = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Analysis') {
          iconName = 'lightbulb';
        } else if (route.name === 'Friends') {
          iconName = 'group';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: 'blue',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Analysis" component={AnalysisScreen} />
    <Tab.Screen
      name="Camera"
      component={CameraScreen}
      options={{
        tabBarButton: (props) => <CameraButton {...props} />,
      }}
    />
    <Tab.Screen name="Friends" component={FriendsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Stack Navigation (Handles Authentication + App)
const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="MainApp" component={MainApp} />
          <Stack.Screen name="Transaction" component={TransactionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

// Styles for Floating Camera Button
const styles = {
  cameraButton: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
  },
};

export default App;