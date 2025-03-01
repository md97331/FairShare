import React from 'react';
import {TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import FriendsScreen from './screens/FriendsScreen';
import AnalysisScreen from './screens/AnalysisScreen';

const Tab = createBottomTabNavigator();

const CameraButton = ({ onPress }) => (
  <TouchableOpacity
    style={{
      position: 'absolute',
      top: -30,
      alignSelf: 'center',
      backgroundColor: 'white',
      borderRadius: 30,
      padding: 10,
      elevation: 5,
    }}
    onPress={onPress}
  >
    <Icon name="camera" size={30} color="black" />
  </TouchableOpacity>
);

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            } 
            else if(route.name==='Friends'){
              iconName='group'
            }
            else if (route.name === 'Analysis') {
              iconName = 'lightbulb';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'blue',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen
          name="Camera"
          component={HomeScreen} // Replace with Camera Screen if available
          options={{
            tabBarButton: (props) => <CameraButton {...props} />,
          }} />
        <Tab.Screen name="Friends" component={FriendsScreen} />
        <Tab.Screen name="Analysis" component={AnalysisScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;