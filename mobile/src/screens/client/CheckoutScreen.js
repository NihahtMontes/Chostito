import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { reservasApi } from '../../api/reservas';
import { pagosApi } from '../../api/pagos';

export default function CheckoutScreen({ route, navigation }) {
  const { items, evento, vipAsientos } = route.params;
  const { user } = useAuth();
  const [step, setStep] = useState('resumen');
  const [reserva, setReserva] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);

  const handleCrearReserva = async () => {
    setLoading(true);
    try {
      const payload = { 
        items: items.filter(i => i.tipo !== 'VIP').map(({ idEvento, tipo, cantidad }) => ({ idEvento, tipo, cantidad })),
        idsEntradas: vipAsientos && vipAsientos.length > 0 ? vipAsientos : null
      };
      const res = await reservasApi.crearReserva(payload);
      setReserva(res);
      const qr = await pagosApi.generarQR(res.id);
      setQrData(qr);
      setStep('pago');
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Error al crear reserva'); }
    finally { setLoading(false); }
  };

  const handlePagar = async () => {
    setLoading(true);
    try { await pagosApi.simularPago(reserva.id, 'QR'); setStep('exito'); }
    catch (e) { Alert.alert('Error', e.response?.data?.message || 'Error al pagar'); }
    finally { setLoading(false); }
  };

  if (step === 'exito') {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successCard}>
          <View style={styles.successCircle}><Ionicons name="checkmark" size={44} color={COLORS.surface} /></View>
          <Text style={styles.successTitle}>Pago exitoso</Text>
          <Text style={styles.successSub}>Tus entradas han sido confirmadas</Text>
          <View style={styles.successInfo}>
            {[
              ['Transacción', reserva?.pago?.codigoTransaccion?.substring(0, 12) + '...'],
              ['Evento', evento.titulo],
              ['Entradas', String(reserva?.cantidadEntradas)],
            ].map(([label, val], i, arr) => (
              <View key={i}>
                <View style={styles.sRow}><Text style={styles.sLabel}>{label}</Text><Text style={styles.sVal}>{val}</Text></View>
                {i < arr.length - 1 && <View style={styles.sDiv} />}
              </View>
            ))}
            <View style={styles.sDiv} />
            <View style={styles.sRow}><Text style={styles.sLabel}>Total</Text><Text style={styles.sPrice}>Bs {reserva?.total?.toFixed(2)}</Text></View>
          </View>
        </View>
        <TouchableOpacity style={styles.verBtn} onPress={() => navigation.navigate('ClientHome', { screen: 'Mis Reservas' })}><Ionicons name="ticket-outline" size={20} color={COLORS.surface} /><Text style={styles.verBtnText}>Ver mis entradas</Text></TouchableOpacity>
        <TouchableOpacity style={styles.volverBtn} onPress={() => navigation.navigate('ClientHome')}><Text style={styles.volverText}>Volver al inicio</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 'resumen' ? 'Resumen de compra' : 'Pago'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.eventoTag}><Ionicons name="ticket" size={16} color={COLORS.primary} /><Text style={styles.eventoTagText}>{evento.titulo}</Text></View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalle de entradas</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemLeft}><View style={styles.itemDot} /><View><Text style={styles.itemTipo}>{item.tipo}</Text><Text style={styles.itemCant}>{item.cantidad} x Bs {item.precio.toFixed(2)}</Text></View></View>
              <Text style={styles.itemSub}>Bs {(item.precio * item.cantidad).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.div} />
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>Bs {total.toFixed(2)}</Text></View>
        </View>
        {step === 'pago' && qrData && (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Código QR de pago</Text>
            <View style={styles.qrWrap}><QRCode value={qrData.qrData} size={190} color={COLORS.text} backgroundColor={COLORS.surface} /></View>
            <Text style={styles.qrCode} numberOfLines={1}>{qrData.codigoTransaccion}</Text>
            <Text style={styles.qrMonto}>Bs {Number(qrData.monto).toFixed(2)}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <View><Text style={styles.footerItems}>{totalItems} entradas</Text><Text style={styles.footerTotal}>Bs {total.toFixed(2)}</Text></View>
        <TouchableOpacity style={[styles.actionBtn, loading && { opacity: 0.6 }]} onPress={step === 'resumen' ? handleCrearReserva : handlePagar} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.surface} /> : <><Text style={styles.actionText}>{step === 'resumen' ? 'Crear reserva' : 'Pagar'}</Text><Ionicons name="arrow-forward" size={18} color={COLORS.surface} /></>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  scroll: { flex: 1, paddingHorizontal: SPACING.lg },
  eventoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEEAFF', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, marginBottom: 14 },
  eventoTagText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 20, ...SHADOWS.light, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  itemTipo: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  itemCant: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  itemSub: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  div: { height: 1, backgroundColor: '#E8ECF0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  totalVal: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  qrCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', ...SHADOWS.light, marginBottom: 24 },
  qrTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  qrWrap: { padding: 14, backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 2, borderColor: '#EEEAFF' },
  qrCode: { fontSize: 12, color: COLORS.textLight, fontFamily: 'monospace', marginTop: 12 },
  qrMonto: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 34, backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, ...SHADOWS.large },
  footerItems: { fontSize: 11, color: COLORS.textLight },
  footerTotal: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.lg, gap: 6, ...SHADOWS.glow },
  actionText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
  successWrap: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.lg, paddingTop: 80 },
  successCard: { backgroundColor: COLORS.surface, borderRadius: 32, padding: 28, alignItems: 'center', ...SHADOWS.large, marginBottom: 20 },
  successCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  successSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  successInfo: { width: '100%' },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  sLabel: { fontSize: 13, color: COLORS.textLight },
  sVal: { fontSize: 13, fontWeight: '600', color: COLORS.text, maxWidth: '60%' },
  sPrice: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sDiv: { height: 1, backgroundColor: '#E8ECF0' },
  verBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.lg, gap: 8, ...SHADOWS.glow, marginBottom: 12 },
  verBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
  volverBtn: { alignItems: 'center', paddingVertical: 10 },
  volverText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
});
