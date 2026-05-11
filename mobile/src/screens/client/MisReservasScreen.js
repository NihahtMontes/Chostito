import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, Share, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { reservasApi } from '../../api/reservas';
import { useAuth } from '../../context/AuthContext';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const TABS = ['Todas', 'Pendiente', 'Confirmada', 'Cancelada'];
const EC = {
  Pendiente: { bg: '#FEF3C7', text: '#92400E', icon: 'time-outline' },
  Confirmada: { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle-outline' },
  Cancelada: { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle-outline' },
};

export default function MisReservasScreen() {
  const [reservas, setReservas] = useState([]);
  const [tab, setTab] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrVis, setQrVis] = useState(false);
  const [qrE, setQrE] = useState(null);
  const [facturaVis, setFacturaVis] = useState(false);
  const [facturaRes, setFacturaRes] = useState(null);
  const { user } = useAuth();
  const facturaRef = useRef();

  const cargar = useCallback(async () => {
    try { setReservas(await reservasApi.misReservas()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCancelar = (r) => {
    Alert.alert('Cancelar reserva', 'No se puede deshacer', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: async () => { try { await reservasApi.cancelar(r.id); cargar(); } catch (e) { Alert.alert('Error', e.response?.data?.message || 'No se pudo'); } } },
    ]);
  };

  const filtradas = tab === 'Todas' ? reservas : reservas.filter((r) => r.estado === tab);

  const mostrarFactura = (r) => { setFacturaRes(r); setFacturaVis(true); };

  const compartirFactura = async () => {
    if (!facturaRes) return;
    try {
      const uri = await captureRef(facturaRef, { format: 'png', quality: 0.9, backgroundColor: COLORS.surface });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri);
      else Alert.alert('Aviso', 'Tu dispositivo no soporta compartir esta imagen');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo generar la factura como imagen');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Mis Reservas</Text></View>
      <View style={styles.tabs}>{TABS.map((t) => (
        <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
          <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}</View>
      <FlatList
        data={filtradas}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => {
          const es = EC[item.estado] || EC.Pendiente;
          return (
            <View style={styles.card}>
              <View style={styles.cardH}><View style={[styles.estBadge, { backgroundColor: es.bg }]}><Ionicons name={es.icon} size={14} color={es.text} /><Text style={[styles.estText, { color: es.text }]}>{item.estado}</Text></View><Text style={styles.fecha}>{new Date(item.fechaReserva).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</Text></View>
              {item.entradas?.map((ent) => (
                <View key={ent.id} style={styles.entItem}>
                  <View style={styles.entLeft}><View style={styles.entBadge}><Text style={styles.entBadgeText}>{ent.tipo}</Text></View><View><Text style={styles.entEvento}>{ent.evento}</Text>{ent.numeroAsiento ? <Text style={styles.entAsiento}>Asiento: {ent.numeroAsiento}</Text> : null}<Text style={styles.entFecha}>{new Date(ent.fechaEvento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text></View></View>
                  {item.estado === 'Confirmada' && ent.estado === 'Activa' && (
                    <TouchableOpacity style={styles.qrBtn} onPress={() => { setQrE(ent); setQrVis(true); }}><Ionicons name="qr-code" size={20} color={COLORS.primary} /></TouchableOpacity>
                  )}
                </View>
              ))}
              <View style={styles.cardF}>
                <View>
                  <Text style={styles.cardCant}>{item.cantidadEntradas} entrada{item.cantidadEntradas !== 1 ? 's' : ''}</Text>
                  <Text style={styles.cardTotal}>Bs {item.total.toFixed(2)}</Text>
                </View>
                <View style={styles.cardFBtns}>
                  {(item.estado === 'Confirmada' || item.pago) && (
                    <TouchableOpacity style={styles.facturaBtn} onPress={() => mostrarFactura(item)}>
                      <Ionicons name="receipt-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.facturaBtnText}>Factura</Text>
                    </TouchableOpacity>
                  )}
                  {item.estado === 'Pendiente' && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelar(item)}>
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={!loading && <View style={styles.empty}><Ionicons name="ticket-outline" size={64} color={COLORS.textLight} /><Text style={styles.emptyText}>Sin reservas</Text></View>}
      />
      <Modal visible={qrVis} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tu entrada</Text>
            {qrE && (
              <>
                <View style={styles.modalQr}><QRCode value={qrE.codigoQR} size={180} color={COLORS.text} backgroundColor={COLORS.surface} /></View>
                <Text style={styles.modalEvento}>{qrE.evento}</Text>
                <Text style={styles.modalTipo}>{qrE.tipo}</Text>
                <Text style={styles.modalFecha}>{new Date(qrE.fechaEvento).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setQrVis(false)}><Text style={styles.modalCloseText}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={facturaVis} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollCont}>
            <View style={styles.facturaCardWrap} ref={facturaRef} collapsable={false}>
              <View style={styles.facturaCard}>
                <Text style={styles.facturaTitle}>FACTURA ELECTRONICA</Text>
                <Text style={styles.facturaBrand}>Chostito</Text>
                {facturaRes && (
                  <>
                    <View style={styles.facturaRow}><Text style={styles.facturaLabel}>Cliente</Text><Text style={styles.facturaVal}>{user?.nombre || user?.email}</Text></View>
                    <View style={styles.facturaRow}><Text style={styles.facturaLabel}>N° Transaccion</Text><Text style={styles.facturaVal}>{facturaRes.pago?.codigoTransaccion?.substring(0,12) || facturaRes.id}</Text></View>
                  <View style={styles.facturaRow}><Text style={styles.facturaLabel}>Fecha</Text><Text style={styles.facturaVal}>{new Date(facturaRes.fechaReserva).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}</Text></View>
                  <View style={styles.facturaRow}><Text style={styles.facturaLabel}>Estado</Text><Text style={[styles.facturaVal,{color:COLORS.success}]}>{facturaRes.estado}</Text></View>
                  <Text style={styles.facturaSection}>Entradas</Text>
                  {facturaRes.entradas?.map((e,i) => (
                    <View key={i} style={styles.facturaEnt}>
                      <Text style={styles.facturaEntTipo}>{e.tipo}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.facturaEntEv} numberOfLines={1}>{e.evento}</Text>
                        {e.numeroAsiento ? <Text style={{ fontSize: 10, color: COLORS.textLight, fontWeight: '700' }}>Asiento {e.numeroAsiento}</Text> : null}
                      </View>
                      <Text style={styles.facturaEntFecha}>{new Date(e.fechaEvento).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</Text>
                      <Text style={styles.facturaEntPrec}>Bs {e.precio.toFixed(0)}</Text>
                    </View>
                  ))}
                  <View style={styles.facturaTotalLine} /><View style={styles.facturaRow}><Text style={styles.facturaTotalLabel}>TOTAL</Text><Text style={styles.facturaTotalVal}>Bs {facturaRes.total.toFixed(2)}</Text></View>
                </>
              )}
              </View>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={compartirFactura}><Ionicons name="share-outline" size={18} color={COLORS.surface} /><Text style={styles.shareBtnText}>Compartir factura</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setFacturaVis(false)}><Text style={styles.modalCloseText}>Cerrar</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  tabs: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: COLORS.surface, ...SHADOWS.small },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.surface },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 18, marginBottom: 14, ...SHADOWS.light },
  cardH: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  estBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  estText: { fontSize: 11, fontWeight: '700' },
  fecha: { fontSize: 12, color: COLORS.textLight },
  entItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: 12, marginBottom: 6 },
  entLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  entBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  entBadgeText: { color: COLORS.surface, fontSize: 10, fontWeight: '700' },
  entEvento: { fontSize: 13, fontWeight: '600', color: COLORS.text, maxWidth: 180 },
  entAsiento: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginTop: 1 },
  entFecha: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  qrBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEEAFF', justifyContent: 'center', alignItems: 'center' },
  cardF: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCant: { fontSize: 12, color: COLORS.textLight },
  cardTotal: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  cancelBtn: { backgroundColor: COLORS.errorLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  cancelBtnText: { color: '#991B1B', fontWeight: '700', fontSize: 13 },
  cardFBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  facturaBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EEEAFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  facturaBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: 32, padding: 28, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  modalQr: { padding: 14, backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 3, borderColor: '#EEEAFF', marginBottom: 16 },
  modalEvento: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  modalTipo: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  modalFecha: { fontSize: 12, color: COLORS.textLight, marginTop: 4, marginBottom: 20 },
  modalClose: { backgroundColor: COLORS.primary, paddingHorizontal: 36, paddingVertical: 12, borderRadius: RADIUS.md },
  modalCloseText: { color: COLORS.surface, fontWeight: '700', fontSize: 14 },
  facturaBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  facturaBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  facturaCardWrap: { padding: 4, backgroundColor: COLORS.surface, borderRadius: 24, marginBottom: 16 },
  facturaCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 2, borderColor: COLORS.primaryLight },
  facturaTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textAlign: 'center', letterSpacing: 2, marginBottom: 2 },
  facturaBrand: { fontSize: 24, fontWeight: '900', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  facturaLabel: { fontSize: 13, color: COLORS.textLight },
  facturaVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  facturaSection: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  facturaEnt: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 6, gap: 8 },
  facturaEntTipo: { fontSize: 11, fontWeight: '700', color: COLORS.surface, backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  facturaEntEv: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.text },
  facturaEntFecha: { fontSize: 11, color: COLORS.textLight },
  facturaEntPrec: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  facturaTotalLine: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  facturaTotalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  facturaTotalVal: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success, paddingVertical: 14, borderRadius: RADIUS.md, gap: 8, marginTop: 16, marginBottom: 8 },
  shareBtnText: { color: COLORS.surface, fontWeight: '700', fontSize: 15 },
  modalScroll: { maxHeight: '80%' },
  modalScrollCont: { flexGrow: 1, justifyContent: 'center' },
});
