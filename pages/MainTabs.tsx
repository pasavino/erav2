// pages/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import Profile from './Profile';
import Car from './Car';
import Publish from './Publish';
import Home from './Home'; // Search page
import TripFindResult from './TripFindResult';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      {/* Default: search page */}
      <HomeStackNav.Screen name="Home" component={Home} />
      {/* Mantener resultados dentro del stack de Home para conservar la tab bar */}
      <HomeStackNav.Screen name="TripFindResult" component={TripFindResult} />
    </HomeStackNav.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home" // la app abre en Home (búsqueda)
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarHideOnKeyboard: false,
        tabBarStyle: { height: 60 },
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarIcon: ({ focused, size, color }) => {
          let name: keyof typeof Ionicons.glyphMap = 'ellipse';

          if (route.name === 'Home')        name = focused ? 'home'        : 'home-outline';         // casita
          if (route.name === 'Publish ride')name = focused ? 'add-circle'  : 'add-circle-outline';
          if (route.name === 'Car')         name = focused ? 'car'         : 'car-outline';
          if (route.name === 'Profile')     name = focused ? 'person'      : 'person-outline';

          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      {/* Orden: 1-Home, 2-Publish ride, 3-Car, 4-Profile */}
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Publish ride" component={Publish} options={{ tabBarLabel: 'Publish ride' }} />
      <Tab.Screen name="Car" component={Car} options={{ tabBarLabel: 'Car' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}