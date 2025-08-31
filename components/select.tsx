import React, { useState } from 'react';
import { Modal, View, Text, Pressable, FlatList } from 'react-native';

export type Option = { label: string; value: string };

type Props = {
  label?: string;
  options: Option[];
  value?: string;
  onChange: (val: string) => void;
};

export default function Select({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={{ marginBottom: 6, fontWeight: '600' }}>{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 }}
      >
        <Text>{current ? current.label : 'Select...'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', maxHeight: '60%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{label || 'Select'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  style={{ paddingVertical: 12 }}
                >
                  <Text>{item.label}</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
            />
            <Pressable onPress={() => setOpen(false)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
              <Text style={{ fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}