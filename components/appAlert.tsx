import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';

type Props = {
  message: string;
  onClose: () => void;
};

export default function AppAlert({ message, onClose }: Props) {
  const visible = !!message;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'center', alignItems:'center' }}>
        <View style={{ backgroundColor:'#fff', padding:16, borderRadius:12, width:'80%' }}>
          <Text style={{ fontWeight:'700', fontSize:16, marginBottom:8 }}>Error</Text>
          <Text style={{ marginBottom:12 }}>{message}</Text>
          <Pressable onPress={onClose} style={{ alignSelf:'flex-end' }}>
            <Text style={{ fontWeight:'600' }}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}