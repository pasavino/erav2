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
import AddVehicle from './AddVehicle';
import TripPreferences from './TripPreferences';
import BookTrip from './BookTrip';
import TravelHistory from './TravelHistory';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();
const CarStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      {/* Default: search page */}
      <HomeStackNav.Screen name="Home" component={Home} />
      {/* Resultados de búsqueda dentro del stack de Home para conservar la tab bar */}
      <HomeStackNav.Screen name="TripFindResult" component={TripFindResult} />
      <HomeStackNav.Screen name="BookTrip" component={BookTrip} />
      <HomeStackNav.Screen name="TravelHistory" component={TravelHistory} />
    </HomeStackNav.Navigator>
  );
}

function CarStack() {
  return (
    <CarStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CarStackNav.Screen name="Car" component={Car} />
      <CarStackNav.Screen name="AddVehicle" component={AddVehicle} />
    </CarStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator>
      {/* Pantalla principal del perfil (sin header propio) */}
      <ProfileStackNav.Screen
        name="ProfileHome"
        component={Profile}
        options={{ headerShown: false }}
      />
      {/* Preferencias: mantiene bottom tabs porque está dentro del stack del tab Profile */}
      <ProfileStackNav.Screen
        name="TripPreferences"
        component={TripPreferences}
        options={{ title: 'Trip preferences' }}
      />
      <ProfileStackNav.Screen
    name="TravelHistory"             
    component={TravelHistory}
    options={{ headerTitle: 'Travel history' }}
  />
    </ProfileStackNav.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarHideOnKeyboard: false,
        tabBarStyle: { height: 100 },
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarIcon: ({ focused, size, color }) => {
          let name: keyof typeof Ionicons.glyphMap = 'ellipse';
          if (route.name === 'Home')         name = focused ? 'home'       : 'home-outline';
          if (route.name === 'Publish ride') name = focused ? 'add-circle' : 'add-circle-outline';
          if (route.name === 'Car')          name = focused ? 'car'        : 'car-outline';
          if (route.name === 'Profile')      name = focused ? 'person'     : 'person-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      {/* Orden: 1-Home, 2-Publish ride, 3-Car, 4-Profile */}
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Publish ride" component={Publish} options={{ tabBarLabel: 'Publish ride' }} />
      <Tab.Screen name="Car" component={CarStack} options={{ tabBarLabel: 'My Car' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />      
    </Tab.Navigator>
  );
}