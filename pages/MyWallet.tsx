import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type KeyboardTypeOptions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { requestForm } from '../services/http';
import Boton from '../components/boton';
import Input from '../components/input';
import AppAlert from '../components/appAlert';
import AppModal from '../components/appModal';

type MyWalletItem = {
  WalletDriver: number;
  Wallet_pass: number;
  FechaUpdate: string;
};

type MyWalletResponse = {
  error: number;
  message: string;
  items: MyWalletItem[];
};

// ✅ Ajustá si tus endpoints se llaman distinto
const TOPUP_INIT_ENDPOINT = 'ax_wallet_topup_init.php';
const TOPUP_STATUS_ENDPOINT = 'ax_wallet_topup_status.php';
const TRANSFER_ENDPOINT = 'ax_transfer_wallet.php';

type AmountMode = 'TOPUP' | 'TRANSFER';

type TopupInitResponse = {
  error: number;
  msg?: string;
  message?: string;
  reference?: string;
  authorization_url?: string;
};

type TopupStatusResponse = {
  error: number;
  msg?: string;
  message?: string;
  status?: 'INIT' | 'PENDING' | 'SUCCESS' | 'FAILED';
};

type TransferResponse = {
  error: number;
  msg?: string;
  message?: string;
};

const naira = (v: any) => {
  const n = Number(v);
  return isFinite(n)
    ? `₦ ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : String(v ?? '');
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MyWallet: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [walletDriver, setWalletDriver] = useState<number>(0);
  const [walletTraveler, setWalletTraveler] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Alerts
  const [alertMsg, setAlertMsg] = useState<string>('');          // ❌ solo errores
  const [successMsg, setSuccessMsg] = useState<string>('');      // ✅ solo success

  // Modal: Amount
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [amount, setAmount] = useState<string>(''); // NGN
  const [amountErr, setAmountErr] = useState<string>('');
  const [amountMode, setAmountMode] = useState<AmountMode>('TOPUP');

  // Modal: WebView checkout
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(true);

  // Estado transacción
  const [reference, setReference] = useState<string>('');
  const [confirming, setConfirming] = useState<boolean>(false);
  const [paystackBusy, setPaystackBusy] = useState<boolean>(false);

  const webRef = useRef<WebView>(null);

  // ✅ Teclado numérico sin romper TypeScript
  const kbType: KeyboardTypeOptions = Platform.OS === 'ios' ? 'number-pad' : 'numeric';

  const loadWallet = async () => {
    try {
      setLoading(true);
      const resp = (await requestForm('ax_MyWallet.php', {})) as MyWalletResponse;

      if (!resp || resp.error !== 0 || !resp.items || resp.items.length === 0) {
        setLoading(false);
        return;
      }

      const item = resp.items[0];

      const driver = Number(parseFloat(String(item.WalletDriver)).toFixed(2));
      const traveler = Number(parseFloat(String(item.Wallet_pass)).toFixed(2));

      setWalletDriver(driver);
      setWalletTraveler(traveler);
      setLastUpdate(item.FechaUpdate || '');
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, []),
  );

  const handleViewTravelerHistory = () => {
    // TODO
  };

  const handleViewDriverHistory = () => {
    // TODO
  };

  const handleTransferToPassengerWallet = () => {
    if (walletDriver <= 0 || paystackBusy) return;
    setAmountMode('TRANSFER');
    setAmount('');
    setAmountErr('');
    setAmountModalVisible(true);
  };

  // ----------------------------
  // RECHARGE: flujo principal
  // ----------------------------
  const openRecharge = () => {
    setAmountMode('TOPUP');
    setAmount('');
    setAmountErr('');
    setAmountModalVisible(true);
  };

  const parsedAmount = useMemo(() => {
    const n = Number(amount.replace(',', '.'));
    return isFinite(n) ? n : NaN;
  }, [amount]);

  const validateAmountTopup = () => {
    if (!amount.trim()) {
      setAmountErr('Enter an amount');
      return false;
    }
    if (!isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountErr('Invalid amount');
      return false;
    }
    if (parsedAmount < 100) {
      setAmountErr('Minimum is ₦ 100');
      return false;
    }
    setAmountErr('');
    return true;
  };

  const validateAmountTransfer = () => {
    if (!amount.trim()) {
      setAmountErr('Enter an amount');
      return false;
    }
    if (!isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountErr('Invalid amount');
      return false;
    }
    if (parsedAmount > walletDriver) {
      setAmountErr('Amount exceeds driver wallet');
      return false;
    }
    setAmountErr('');
    return true;
  };

  const startTopup = async () => {
    if (!validateAmountTopup()) return;

    try {
      setPaystackBusy(true);
      setAmountModalVisible(false);
      setConfirming(false);

      const resp = (await requestForm(TOPUP_INIT_ENDPOINT, {
        amount_naira: String(parsedAmount),
      })) as TopupInitResponse;

      const msg = resp?.msg || resp?.message || 'Topup init error';
      if (!resp || resp.error !== 0 || !resp.authorization_url || !resp.reference) {
        setPaystackBusy(false);
        setAlertMsg(msg); // ❌ error
        return;
      }

      setReference(resp.reference);
      setCheckoutUrl(resp.authorization_url);
      setCheckoutLoading(true);
      setCheckoutVisible(true);
      setPaystackBusy(false);
    } catch (e) {
      setPaystackBusy(false);
      setAlertMsg('Network error starting topup'); // ❌ error
    }
  };

  // ----------------------------
  // TRANSFER: driver -> traveler
  // ----------------------------
  const startTransfer = async () => {
  if (!validateAmountTransfer()) return;

  try {
    setPaystackBusy(true);
    setAmountModalVisible(false);

    const resp = (await requestForm(TRANSFER_ENDPOINT, {
      amount_naira: String(parsedAmount),
    })) as TransferResponse;

    const msg = resp?.msg || resp?.message || 'Transfer error';

    if (!resp || resp.error !== 0) {
      setSuccessMsg('');     // opcional: por si quedó éxito previo
      setAlertMsg(msg);
      setPaystackBusy(false);
      return;
    }

    await loadWallet();

    setAlertMsg('');         // <-- clave: limpia el error viejo
    setSuccessMsg(msg || 'Transfer successful');

    setPaystackBusy(false);
  } catch (e) {
    setSuccessMsg('');       // opcional
    setPaystackBusy(false);
    setAlertMsg('Network error transferring funds');
  }
};

  const closeCheckout = async () => {
    setCheckoutVisible(false);

    if (!reference) return;

    setPaystackBusy(true);
    setConfirming(true);

    try {
      // Poll corto: 10 intentos * 2s = 20s
      for (let i = 0; i < 10; i++) {
        const st = (await requestForm(TOPUP_STATUS_ENDPOINT, {
          reference,
        })) as TopupStatusResponse;

        if (st && st.error === 0) {
          if (st.status === 'SUCCESS') {
            setConfirming(false);
            setReference('');
            await loadWallet();

            // ✅ SUCCESS YA NO USA AppAlert
            setSuccessMsg('Wallet recharged successfully');

            setPaystackBusy(false);
            return;
          }
          if (st.status === 'FAILED') {
            setConfirming(false);
            setReference('');
            setAlertMsg('Payment failed or was cancelled'); // ❌ error
            setPaystackBusy(false);
            return;
          }
        }

        await sleep(2000);
      }

      setConfirming(false);
      setAlertMsg('Payment pending. Please refresh your wallet in a moment.'); // ❌ error/aviso (lo dejo en AppAlert por mínimo cambio)
      setPaystackBusy(false);
    } catch (e) {
      setConfirming(false);
      setAlertMsg('Could not confirm payment. Please try refresh later.'); // ❌ error
      setPaystackBusy(false);
    }
  };

  const disabledWhilePaystack = paystackBusy;
  const canTransfer = walletDriver > 0 && !disabledWhilePaystack;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        {lastUpdate ? <Text style={styles.lastUpdate}>Last update: {lastUpdate}</Text> : null}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            {/* Traveler card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Traveler</Text>
                <Text
                  style={styles.linkText}
                  onPress={disabledWhilePaystack ? undefined : handleViewTravelerHistory}
                >
                  View record
                </Text>
              </View>
              <Text style={styles.amountText}>{naira(walletTraveler)}</Text>
            </View>

            {/* Driver card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Driver</Text>
                <Text
                  style={styles.linkText}
                  onPress={disabledWhilePaystack ? undefined : handleViewDriverHistory}
                >
                  View record
                </Text>
              </View>
              <Text style={styles.amountText}>{naira(walletDriver)}</Text>
            </View>

            {/* Buttons */}
            <View
              style={[styles.buttonsContainer, disabledWhilePaystack && { opacity: 0.6 }]}
            >
              {/* No cambiamos estilo: sólo bloqueamos el touch si no hay saldo */}
              <Boton label="Transfer to passenger wallet" onPress={handleTransferToPassengerWallet} />
              <View style={{ height: 12 }} />
              <Boton label="Recharge wallet credit/debit card" onPress={openRecharge} />

              {confirming ? (
                <View style={styles.confirmBox}>
                  <ActivityIndicator />
                  <Text style={styles.confirmText}>Confirming payment…</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      {/* ❌ Error alert (sólo errores) */}
      {alertMsg ? <AppAlert message={alertMsg} onClose={() => setAlertMsg('')} /> : null}

      {/* ✅ Success modal (no sale como "Error") */}
      {successMsg ? (
        <AppModal
          visible={true}
          variant="info"
          title="Success"
          message={successMsg}
          onClose={() => setSuccessMsg('')}
        />
      ) : null}

      {/* Modal: amount */}
      <Modal visible={amountModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            // En Android, 'height' funciona mejor para bottom-sheets.
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            // Ajuste típico: header + safe area. Si tu Layout agrega un Header fijo, subilo.
            keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            style={styles.kav}
          >
            <View style={styles.modalCard}>
              {/* Scroll interno: si el teclado tapa, podés scrollear y ver lo que escribís */}
             <KeyboardAwareScrollView
                enableOnAndroid
                enableAutomaticScroll
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={80}   // 👈 subí esto (probá 80–140)
                extraHeight={80}         // 👈 subí esto (probá 80–140)
                keyboardOpeningTime={0}  // 👈 en algunos android ayuda 0 o 50
                contentContainerStyle={{ paddingBottom: 140 }} // 👈 importante para que pueda “subir” más
              >
                <Text style={styles.modalTitle}>
                  {amountMode === 'TOPUP' ? 'Recharge wallet' : 'Transfer to passenger wallet'}
                </Text>
                <Text style={styles.modalSub}>
                  {amountMode === 'TOPUP'
                    ? 'Enter amount in NGN'
                    : `Enter amount in NGN (max ${naira(walletDriver)})`}
                </Text>

                <Input
                  label="Amount"
                  value={amount}
                  onChangeText={(t: string) => {
                    setAmount(t);
                    if (amountErr) setAmountErr('');
                  }}
                  // numeric en Android a veces no sube bien el KAV; number-pad suele comportarse mejor.
                  // Nota TS: nuestro componente Input puede no exponer el tipo exacto de keyboardType.
                  // Forzamos el tipo acá para evitar error de compilación sin tocar el componente Input.
                  keyboardType={kbType}
                  placeholder="e.g. 5000"
                  error={amountErr ? amountErr : undefined}
                />

                <View style={{ height: 12 }} />

                <View style={[disabledWhilePaystack && { opacity: 0.6 }]}>
                  <Boton
                    label={amountMode === 'TOPUP' ? 'Continue to Paystack' : 'Transfer'}
                    onPress={amountMode === 'TOPUP' ? startTopup : startTransfer}
                  />
                  <View style={{ height: 10 }} />
                  <Boton label="Cancel" onPress={() => setAmountModalVisible(false)} />
                </View>
              </KeyboardAwareScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: Paystack checkout */}
      <Modal visible={checkoutVisible} animationType="slide">
        <View style={styles.checkoutHeader}>
          <Pressable onPress={closeCheckout} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          <Text style={styles.checkoutTitle}>Paystack</Text>
          <View style={{ width: 60 }} />
        </View>

        {checkoutLoading ? (
          <View style={styles.webLoading}>
            <ActivityIndicator size="large" />
            <Text style={styles.webLoadingText}>Loading checkout…</Text>
          </View>
        ) : null}

        <WebView
          ref={webRef}
          source={{ uri: checkoutUrl }}
          javaScriptEnabled
          domStorageEnabled
          onLoadStart={() => setCheckoutLoading(true)}
          onLoadEnd={() => setCheckoutLoading(false)}
          onError={() => {
            setAlertMsg('Checkout failed to load. Check your internet and retry.');
          }}
        />
      </Modal>

      {/* ✅ Modal bloqueante mientras Paystack init/confirm */}
      <AppModal
        visible={paystackBusy}
        variant="info"
        onClose={() => {}}
        actions={[]}
        message={
          <View style={{ alignItems: 'center', gap: 12 }}>
            <ActivityIndicator size="large" />
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>
              Please wait.....
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MyWallet;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  lastUpdate: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  loadingContainer: { marginTop: 32, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  linkText: { fontSize: 12, color: '#2563EB', textDecorationLine: 'underline' },
  amountText: { fontSize: 20, fontWeight: '700', color: '#111827' },

  buttonsContainer: { marginTop: 24 },

  confirmBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmText: { color: '#111827', fontSize: 14 },

  // Modal amount
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  kav: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSub: { marginTop: 4, marginBottom: 12, fontSize: 13, color: '#6B7280' },

  // Checkout
  checkoutHeader: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  closeBtn: { width: 60 },
  closeText: { color: '#2563EB', fontSize: 16 },
  checkoutTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  webLoading: { padding: 16, alignItems: 'center', gap: 10 },
  webLoadingText: { color: '#6B7280' },
});