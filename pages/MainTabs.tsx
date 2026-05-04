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
import Notifications from './Notifications';
import TravelHistoryDriver from './TravelHistoryDriver';
import MyWallet from './MyWallet';
import TripManager from './TripManager';
import TripPax from './TripPax';
import AdvanceSearch from './AdvanceSearch';
import AdvSearchResult from './AdvSearchResult';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();
const TripStackNav = createNativeStackNavigator();
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
      <HomeStackNav.Screen name="TravelHistoryDriver" component={TravelHistoryDriver} />
      <HomeStackNav.Screen name="Notifications" component={Notifications} />
      <HomeStackNav.Screen name="MyWallet" component={MyWallet} />
      {/* Nueva pantalla para ver todos los viajes */}
      <HomeStackNav.Screen name="ViewAllTrips" component={require('./ViewAllTrips').default} />
      <HomeStackNav.Screen name="AdvanceSearch" component={AdvanceSearch} />
      <HomeStackNav.Screen name="AdvSearchResult" component={require('./AdvSearchResult').default} />
    </HomeStackNav.Navigator>
  );
}

function TripStack() {
  return (
    <TripStackNav.Navigator screenOptions={{ headerShown: false }}>
      <TripStackNav.Screen name="TripManager" component={TripManager} />
      <TripStackNav.Screen
        name="TripPax"
        component={TripPax}
        options={{ headerShown: true, title: 'Passenger list' }}
      />
    </TripStackNav.Navigator>
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
        name="MyWallet"
        component={MyWallet}
        options={{ title: 'My Wallet' }}
      />
      <ProfileStackNav.Screen
        name="TravelHistory"             
        component={TravelHistory}
        options={{ headerTitle: 'My Trips' }}
      />

      {/*
      <ProfileStackNav.Screen
        name="TravelHistoryDriver"             
        component={TravelHistoryDriver}
        options={{ headerTitle: 'Trips to be taken or taken' }}
      />
      */}
      <ProfileStackNav.Screen
        name="Notifications"             
        component={Notifications}
        options={{ headerTitle: 'Notifications' }}
      />
      <ProfileStackNav.Screen
        name="Car"
        component={Car}
        options={{ title: 'My vehicles' }}
      />
      <ProfileStackNav.Screen
        name="AddVehicle"
        component={AddVehicle}
        options={{ title: 'Add vehicle' }}
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
          if (route.name === 'TripManager')  name = focused ? 'navigate'   : 'navigate-outline';
          if (route.name === 'Profile')      name = focused ? 'person'     : 'person-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      {/* Orden: 1-Home, 2-Publish ride, 3-Trip Manager, 4-Profile */}
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Publish ride" component={Publish} options={{ tabBarLabel: 'Publish ride' }} />
      <Tab.Screen name="TripManager" component={TripStack} options={{ tabBarLabel: 'Trip Manager' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />      
    </Tab.Navigator>
  );
}