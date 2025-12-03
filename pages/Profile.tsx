// /pages/Profile.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Input from '../components/input';
import Boton from '../components/boton';
import AppAlert from '../components/appAlert';
import { useAuth } from '../context/Auth';
import { requestForm, setAuthToken } from '../services/http';
import AvatarSvg from '../assets/avatar.svg';

type ProfileData = {
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  email: string;
  biometric_enabled?: boolean;
};

const Tab = createMaterialTopTabNavigator();

export default function Profile() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          tabBarIndicatorStyle: { height: 3 },
          tabBarLabelStyle: { fontWeight: '600' },
          tabBarStyle: { backgroundColor: '#fff' },
        }}
      >
        <Tab.Screen name="Personal Info" component={PersonalInfoTab} />
        <Tab.Screen name="Account" component={AccountTab} />        
      </Tab.Navigator>
    </View>
  );
}

/* -------- data hook -------- */
function useProfileData() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // helper: cache-busting para avatar
  const bust = (u?: string | null) => (u ? `${u}${u.includes('?') ? '&' : '?'}v=${Date.now()}` : null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setAuthToken(token || '');
        const out = await requestForm<{ data: ProfileData; msg?: string; error?: number }>('/ax_get_profile.php',{});
        if (!out.error && out.data) {
          const d: ProfileData = {
            ...out.data,
            avatar_url: bust(out.data.avatar_url),
          };
          mounted && setData(d);
        } else mounted && setError(out?.msg || 'Could not load profile');
      } catch (e: any) {
        mounted && setError(e?.message || 'Network error');
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  return { loading, data, setData, error, setError };
}

/* -------- UI blocks -------- */
function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  );
}

function HeaderAvatar({
  avatar, name, onPick, onSelfie, uploading,
}: { avatar?: string | null; name: string; onPick: () => void; onSelfie: () => void; uploading?: boolean; }) {
  const disabled = !!uploading;
  return (
    <View style={styles.header}>
      <View style={styles.avatarCol}>
        <TouchableOpacity onPress={onPick} accessibilityLabel="Change profile photo" disabled={disabled}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <AvatarSvg width={84} height={84} />
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.changePhoto, disabled && { opacity: 0.4 }]}>
          <Text onPress={!disabled ? onPick : undefined}>Change photo</Text>
          <Text> / </Text>
          <Text onPress={!disabled ? onSelfie : undefined}>Take selfie</Text>
        </Text>
      </View>

      <View style={{ flex: 1, marginLeft: 8, alignSelf: 'flex-start' }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>

    </View>
  );
}

/* -------- Personal Info -------- */
type TouchedPI = { first: boolean; last: boolean; email: boolean; phone: boolean };

function PersonalInfoTab() {
  const { loading, data, setData, error, setError } = useProfileData();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');

  // Mensajes
  const [inlineInfo, setInlineInfo] = useState<string | null>(null); // éxitos/info
  const [alertMsg, setAlertMsg] = useState<string | null>(null);     // HTTP/servidor/red

  // Bubbles
  const [touched, setTouched] = useState<TouchedPI>({ first: false, last: false, email: false, phone: false });
  const markOnly = (k: keyof TouchedPI) =>
    setTouched({ first: false, last: false, email: false, phone: false, [k]: true });

  useEffect(() => {
    if (data) {
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
    }
  }, [data]);

  // onChange con límites
  const onChangeFirst = (t: string) => setFirstName(t.slice(0, 50));
  const onChangeLast  = (t: string) => setLastName(t.slice(0, 50));
  const onChangeEmail = (t: string) => setEmail(t.slice(0, 50));
  const onChangePhone = (t: string) => setPhone(t.replace(/\D+/g, '').slice(0, 50));

  const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);

  // Errores por campo (bubbles) — Nombre → Apellido → Email → Teléfono
  const errFirst = useMemo(() => {
    if (!touched.first) return undefined;
    const v = firstName.trim();
    if (!v) return 'First name required';
    if (v.length > 50) return 'Max 50 characters';
    return undefined;
  }, [touched.first, firstName]);

  const errLast = useMemo(() => {
    if (!touched.last) return undefined;
    const v = lastName.trim();
    if (!v) return 'Last name required';
    if (v.length > 50) return 'Max 50 characters';
    return undefined;
  }, [touched.last, lastName]);

  const errEmail = useMemo(() => {
    if (!touched.email) return undefined;
    const em = email.trim();
    if (!em) return 'Email is required';
    if (em.length > 50) return 'Max 50 characters';
    if (!isEmail(em)) return 'Enter a valid email';
    return undefined;
  }, [touched.email, email]);

  const errPhone = useMemo(() => {
    if (!touched.phone) return undefined;
    const p = phone.trim();
    if (p && !/^\d+$/.test(p)) return 'Digits only';
    if (p && p.length < 6) return 'At least 6 digits';
    if (p.length > 50) return 'Max 50 digits';
    return undefined;
  }, [touched.phone, phone]);

  const onPickAvatar = async () => {
    if (saving || uploadingAvatar) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setAlertMsg('We need access to your photos to change the avatar.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (res.canceled || !res.assets?.length) return;
      await uploadAndSet(res.assets[0]);
    } catch (e: any) {
      setAlertMsg(e?.message || 'Image picker error');
    }
  };

  const onTakeSelfie = async () => {
    if (saving || uploadingAvatar) return;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setAlertMsg('We need camera access to take a selfie.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (res.canceled || !res.assets?.length) return;
      await uploadAndSet(res.assets[0]);
    } catch (e: any) {
      setAlertMsg(e?.message || 'Camera error');
    }
  };

  // Subir como multipart usando requestForm (que arma FormData internamente si le pasamos un archivo)
  const uploadAndSet = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingAvatar(true);

      const extFromName = asset.fileName?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
      const guessedExt = extFromName || (asset.mimeType === 'image/png' ? 'png' : 'jpg');
      const name = asset.fileName || `avatar-${Date.now()}.${guessedExt}`;
      const type = asset.mimeType || (guessedExt === 'png' ? 'image/png' : 'image/jpeg');

      const file: any = { uri: asset.uri, name, type };

      const up = await requestForm<{ url?: string; error?: number; msg?: string }>(
        '/ax_upload_avatar.php',
        { avatar: file }
      );

      if (!up.error && up.url) {
        const bust = `${up.url}${up.url.includes('?') ? '&' : '?'}v=${Date.now()}`;
        setData?.(prev => ({ ...(prev ?? {} as any), avatar_url: bust }));
        setInlineInfo('Photo updated');
      } else setAlertMsg(up.msg || 'Could not update photo'); // HTTP -> AppAlert
    } catch (e: any) {
      setAlertMsg(e?.message || 'Upload error'); // HTTP -> AppAlert
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSave = async () => {
    if (saving || loading || uploadingAvatar) return;
    setInlineInfo(null);

    // Validación secuencial: Nombre -> Apellido -> Email -> Teléfono
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const ph = phone.trim();

    if (!fn || fn.length > 50) { markOnly('first'); return; }
    if (!ln || ln.length > 50) { markOnly('last');  return; }
    if (!em || em.length > 50 || !isEmail(em)) { markOnly('email'); return; }
    if (ph && (!/^\d+$/.test(ph) || ph.length < 6 || ph.length > 50)) { markOnly('phone'); return; }

    // sin cambios
    const dirty = !!data && (
      fn !== (data.first_name || '') ||
      ln !== (data.last_name  || '') ||
      em !== (data.email      || '') ||
      ph !== (data.phone      || '')
    );
    if (!dirty) { setInlineInfo('No changes to save.'); return; }

    try {
      setSaving(true);
      const out = await requestForm<{ error?: number; msg?: string }>(
        '/ax_update_profile.php',
        { first_name: fn, last_name: ln, email: em, phone: ph }
      );
      if (!out.error) {
        setData?.(prev => ({ ...(prev ?? {} as any), first_name: fn, last_name: ln, email: em, phone: ph }));
        setInlineInfo('Profile updated');
      } else setAlertMsg(out.msg || 'Could not save changes'); // HTTP -> AppAlert
    } catch (e: any) {
      setAlertMsg(e?.message || 'Network error'); // HTTP -> AppAlert
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.container, { paddingBottom: 140 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={140}
      extraHeight={140}
    >
      {/* HTTP/servidor/red */}
      {!!error && <AppAlert message={error} onClose={() => setError(null)} />}
      {!!alertMsg && <AppAlert message={alertMsg} onClose={() => setAlertMsg(null)} />}
      {/* info inline */}
      {!!inlineInfo && <Text style={styles.inlineInfo}>{inlineInfo}</Text>}

      <HeaderAvatar
        avatar={data?.avatar_url || null}
        name={`${data?.first_name ?? ''} ${data?.last_name ?? ''}`.trim() || (data?.email ?? '')}
        onPick={onPickAvatar}
        onSelfie={onTakeSelfie}
        uploading={uploadingAvatar}
      />

      <Input
        label="First name"
        value={firstName}
        onChangeText={onChangeFirst}
        placeholder="Your first name"
        autoCapitalize="words"
        maxlenght={50}
        onBlur={() => setTouched(v => ({ ...v, first: true }))}
        error={errFirst}
        errorMode="bubble"
      />
      <Input
        label="Last name"
        value={lastName}
        onChangeText={onChangeLast}
        placeholder="Your last name"
        autoCapitalize="words"
        maxlenght={50}
        onBlur={() => setTouched(v => ({ ...v, last: true }))}
        error={errLast}
        errorMode="bubble"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={onChangeEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        maxlenght={50}
        onBlur={() => setTouched(v => ({ ...v, email: true }))}
        error={errEmail}
        errorMode="bubble"
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={onChangePhone}
        placeholder="+54..."
        keyboardType="phone-pad"
        maxlenght={50}
        onBlur={() => setTouched(v => ({ ...v, phone: true }))}
        error={errPhone}
        errorMode="bubble"
      />

      <View style={{ marginTop:12, marginBottom:4 }}>
        <Boton
          label={saving ? 'Saving…' : 'Save'}
          onPress={() => { if (!saving) onSave(); }}
        />
      </View>

      {/* Overlay bloqueante durante el guardado (igual a Home) */}
      {saving && (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.overlayText}>Saving… please wait</Text>
        </View>
      )}

      <View style={{ height: 32 }} />

      {/* Overlay centrado mientras sube el avatar */}
      {uploadingAvatar && (
        <View style={styles.fullscreenOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.overlayCenterText}>Wait…</Text>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}

/* -------- Account (links de Settings) -------- */
function AccountTab() {
  const navigation = useNavigation<any>();
  const { loading, data, error, setError } = useProfileData();
  const [inlineInfo, setInlineInfo] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // ---- Helper para “links” de navegación ----
  const NavItem = ({ title, to, rightText }: { title: string; to: string; rightText?: string }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate(to)}
      style={[styles.row, { justifyContent: 'space-between' }]}
      accessibilityRole="button"
    >
      <Text style={{ flex: 1 }}>{title}</Text>
      <Text style={{ opacity: 0.5 }}>{rightText ?? '›'}</Text>
    </TouchableOpacity>
  );

  if (loading) return <Loading />;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={120}
      extraHeight={120}
    >
      {/* HTTP/servidor/red */}
      {!!error && <AppAlert message={error} onClose={() => setError(null)} />}
      {!!alertMsg && <AppAlert message={alertMsg} onClose={() => setAlertMsg(null)} />}
      {/* info inline */}
      {!!inlineInfo && <Text style={styles.inlineInfo}>{inlineInfo}</Text>}

      <View style={{ height: 24 }} />
      <Text style={styles.sectionTitle}>Settings</Text>

      {/* LINKS / ACCESOS a otras pantallas */}
      <NavItem title="My vehicles" to="Car" />
      <NavItem title="Trip preferences" to="TripPreferences" />
      <NavItem title="My wallet" to="MyWallet" />
      <NavItem title="Travel history" to="TravelHistory" />
      <NavItem title="Travel history driver" to="TravelHistoryDriver" />
      <NavItem title="Notifications" to="Notifications" />
      <NavItem title="Privacy & Terms" to="PrivacyTerms" />
      <NavItem title="About" to="About" />

      <View style={{ height: 32 }} />
    </KeyboardAwareScrollView>
  );
}

/* -------- styles -------- */
const styles = StyleSheet.create({
  container: { padding: 16 },
  // styles
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatarCol: { width: 84, alignItems: 'center', marginRight: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  changePhoto: { marginLeft: 100, fontSize: 12, textAlign: 'center', marginTop: 6, opacity: 0.7, width: 200 },
  name: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inlineInfo: { color: '#08660b', marginBottom: 8 },
  fullscreenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  overlayCenterText: { color: '#fff', marginTop: 10, fontWeight: '600' },
  // overlay estilo Home.tsx
  overlay: { position:'absolute', left:0, top:0, right:0, bottom:0, backgroundColor:'rgba(255, 255, 255, 0.25)', alignItems:'center', justifyContent:'center' },
  overlayText: { marginTop:8, color:'#fff', fontSize:14 },
});