// pages/Gate.tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/Auth';
import MainTabs from './MainTabs';
import AuthStack from './AuthStack';

export default function Gate() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return token ? <MainTabs /> : <AuthStack />;
}