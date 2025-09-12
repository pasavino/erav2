import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RideList, { type Ride as RideRow } from '../components/rideList';
import AppAlert from '../components/appAlert';

export default function TripFindResult({ route, navigation }: any) {
  const { rides = [], from, to, date } = route?.params || {};
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Normaliza por las dudas (id string y time opcional)
  const data = useMemo<RideRow[]>(
    () => (Array.isArray(rides) ? rides : []).map((r: any) => ({
      id: String(r.id),
      from: r.from,
      to: r.to,
      date: r.date,
      time: r.time,
      price: r.price,
    })),
    [rides]
  );

  useEffect(() => {
    navigation?.setOptions?.({ title: 'Trip results' });
  }, [navigation]);

  const onPressRide = (ride: RideRow) => {
    // TODO: navegar a detalle cuando exista
    setAlertMsg('Ride details coming soon');
    // navigation.navigate('RideDetails', { rideId: ride.id, ride });
  };

  const subtitle = useMemo(() => {
    const parts = [];
    if (from && to) parts.push(`${from} → ${to}`);
    if (date) parts.push(date);
    return parts.join(' • ');
  }, [from, to, date]);

  return (
    <View style={styles.wrap}>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}

      <RideList
        data={data}
        loading={false}
        onPress={onPressRide}
        emptyText="No rides found"
      />

      {alertMsg ? (
        <AppAlert message={alertMsg} onClose={() => setAlertMsg(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff', padding: 12 },
  sub: { textAlign: 'center', marginBottom: 8, color: '#555' },
});