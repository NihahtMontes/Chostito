import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Modal, Animated, FlatList, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { eventosApi } from '../../api/eventos';
import { favoritosApi } from '../../api/favoritos';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');

// ── Selector de asientos VIP ──────────────────────────────────────
function VipSeatSelector({ visible, onClose, precio, asientosBD, onConfirm }) {
  const [sel, setSel] = useState(new Set());
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setSel(new Set());
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const toggle = (id) => setSel(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={ss.overlay}>
        <TouchableOpacity style={ss.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[ss.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={ss.handle} />
          <Text style={ss.sheetTitle}>Seleccionar asientos VIP</Text>
          <Text style={ss.sheetSub}>Bs {precio?.toFixed(2)} por asiento · {sel.size} seleccionado{sel.size !== 1 ? 's' : ''}</Text>

          {/* Escenario */}
          <View style={ss.stage}><Text style={ss.stageText}>ESCENARIO</Text></View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ss.mapScroll}>
            <View style={{ gap: 24 }}>
              {asientosBD?.map((sec, secIdx) => (
                <View key={secIdx} style={ss.seccionCard}>
                  <Text style={ss.seccionTitle}>{sec.seccion}</Text>
                  <View style={ss.seatGrid}>
                    {Array.from({ length: Math.ceil(sec.asientos.length / 8) }).map((_, filaIdx) => {
                      const filaAsientos = sec.asientos.slice(filaIdx * 8, (filaIdx + 1) * 8);
                      const filaNombre = String.fromCharCode(65 + filaIdx);
                      return (
                        <View key={filaIdx} style={ss.seatRow}>
                          <Text style={ss.filaLabel}>{filaNombre}</Text>
                          {filaAsientos.map(ast => {
                            const ocupado = ast.estado !== 'Activa';
                            const num = ast.numero.split('-')[1] || ast.numero;
                            return (
                              <TouchableOpacity
                                key={ast.id}
                                style={[
                                  ss.seat, 
                                  ocupado && ss.seatOcupado, 
                                  sel.has(ast.id) && ss.seatSel
                                ]}
                                onPress={() => { if(!ocupado) toggle(ast.id); }}
                                activeOpacity={0.7}
                                disabled={ocupado}
                              >
                                <Text style={[
                                  ss.seatTxt, 
                                  ocupado && ss.seatTxtOcupado, 
                                  sel.has(ast.id) && ss.seatTxtSel
                                ]}>
                                  {num}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Leyenda */}
          <View style={ss.legend}>
            <View style={ss.legendItem}><View style={ss.legendDot} /><Text style={ss.legendTxt}>Disponible</Text></View>
            <View style={ss.legendItem}><View style={[ss.legendDot, { backgroundColor: COLORS.error, borderColor: COLORS.error }]} /><Text style={ss.legendTxt}>Ocupado</Text></View>
            <View style={ss.legendItem}><View style={[ss.legendDot, { backgroundColor: COLORS.primary }]} /><Text style={ss.legendTxt}>Seleccionado</Text></View>
          </View>

          <TouchableOpacity
            style={[ss.confirmBtn, sel.size === 0 && { opacity: 0.4 }]}
            onPress={() => { onConfirm(Array.from(sel)); onClose(); }}
            disabled={sel.size === 0}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={ss.confirmTxt}>Confirmar {sel.size > 0 ? `${sel.size} asiento${sel.size > 1 ? 's' : ''}` : 'asientos'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Pantalla principal ──────────────────────────────────────────────────────
export default function EventoDetalleScreen({ route, navigation }) {
  const { eventoId } = route.params;
  const { user } = useAuth();
  const [evento, setEvento] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [vipModalVisible, setVipModalVisible] = useState(false);
  const [vipAsientos, setVipAsientos] = useState([]);
  const [asientosBD, setAsientosBD] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const [ev, ent] = await Promise.all([
          eventosApi.getById(eventoId),
          eventosApi.getEntradas(eventoId),
        ]);
        setEvento(ev);
        setEntradas(ent);
        const init = {};
        ent.forEach(e => (init[e.tipo] = 0));
        setCantidades(init);
        // Cargar asientos VIP si existe ese tipo
        if (ent.some(e => e.tipo === 'VIP')) {
          try {
            const secciones = await eventosApi.getAsientos(eventoId);
            setAsientosBD(secciones);
          } catch (err) { console.error('Asientos error:', err); }
        }
        if (user) {
          try {
            const favs = await favoritosApi.getAll();
            setIsFav(favs.some(f => f.evento.id === eventoId));
          } catch {}
        }
      } catch (e) { console.error(e); }
      finally {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    })();
  }, [eventoId]);

  const toggleFav = async () => {
    if (!user) return;
    setFavLoading(true);
    try {
      if (isFav) { await favoritosApi.eliminar(eventoId); setIsFav(false); }
      else { await favoritosApi.agregar(eventoId); setIsFav(true); }
    } catch (e) { console.error(e); }
    finally { setFavLoading(false); }
  };

  const updateC = (tipo, d) => setCantidades(p => {
    const e = entradas.find(en => en.tipo === tipo);
    const max = e ? e.cantidadDisponible : 0;
    return { ...p, [tipo]: Math.max(0, Math.min(max, (p[tipo] || 0) + d)) };
  });

  const setCantidadDirecta = (tipo, val) => {
    const e = entradas.find(en => en.tipo === tipo);
    const max = e ? e.cantidadDisponible : 0;
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    setCantidades(p => ({ ...p, [tipo]: Math.max(0, Math.min(max, num)) }));
  };

  const vipEntrada = entradas.find(e => e.tipo === 'VIP');
  const totalVip = vipAsientos.length;
  const totalNormal = Object.entries(cantidades)
    .filter(([tipo]) => tipo !== 'VIP')
    .reduce((s, [, c]) => s + c, 0);
  const totalItems = totalNormal + totalVip;
  const totalPrecio = entradas.reduce((s, e) => {
    if (e.tipo === 'VIP') return s + e.precio * totalVip;
    return s + e.precio * (cantidades[e.tipo] || 0);
  }, 0);

  const handleComprar = () => {
    if (!user) { navigation.navigate('Login'); return; }
    const items = [];
    entradas.forEach(e => {
      if (e.tipo === 'VIP' && totalVip > 0) {
        items.push({ idEvento: evento.id, tipo: 'VIP', cantidad: totalVip, precio: e.precio });
      } else if (e.tipo !== 'VIP' && (cantidades[e.tipo] || 0) > 0) {
        items.push({ idEvento: evento.id, tipo: e.tipo, cantidad: cantidades[e.tipo], precio: e.precio });
      }
    });
    navigation.navigate('Checkout', { items, evento, vipAsientos });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!evento) return <View style={styles.center}><Text style={{ color: COLORS.textLight }}>Evento no encontrado</Text></View>;

  return (
    <View style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {/* Imagen de portada */}
          <View style={styles.imgWrap}>
            {evento.imagenUrl
              ? <Image source={{ uri: `${API_BASE}${evento.imagenUrl}` }} style={styles.cover} />
              : <View style={styles.coverPlaceholder}><Ionicons name="ticket" size={56} color={COLORS.primaryLight} /></View>
            }
            <View style={styles.imgOverlay} />
            <View style={styles.topBtns}>
              <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              {user && (
                <TouchableOpacity style={styles.circleBtn} onPress={toggleFav} disabled={favLoading}>
                  <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? COLORS.error : '#fff'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{evento.categoria}</Text></View>
              {evento.estado === 'Publicado' && (
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Disponible</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{evento.titulo}</Text>
            <Text style={styles.slogan}>{evento.eslogan}</Text>

            {/* Info grid */}
            <View style={styles.infoGrid}>
              {[
                ['calendar', COLORS.primary, 'Fecha', new Date(evento.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })],
                ['time', COLORS.secondary, 'Hora', (evento.hora || '').substring(0, 5) + ' hs'],
                ['location', COLORS.success, 'Lugar', evento.lugar],
                ['globe', COLORS.warning, 'Ciudad', `${evento.ciudad}, ${evento.pais}`],
              ].map(([icon, color, label, val], i) => (
                <View key={i} style={styles.infoItem}>
                  <View style={[styles.infoIcon, { backgroundColor: COLORS.background }]}>
                    <Ionicons name={icon} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>{val}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Acerca del evento</Text>
            <Text style={styles.desc}>{evento.descripcion}</Text>

            {/* Entradas */}
            <Text style={styles.sectionTitle}>Entradas disponibles</Text>
            {entradas.length === 0 ? (
              <View style={styles.noEnt}>
                <Ionicons name="alert-circle-outline" size={22} color={COLORS.textLight} />
                <Text style={styles.noEntText}>No hay entradas disponibles aún</Text>
              </View>
            ) : entradas.map((ent, i) => (
              <View key={i} style={styles.entCard}>
                <View style={styles.entInfo}>
                  <View style={styles.entTipoBadge}>
                    <Text style={styles.entTipoText}>{ent.tipo}</Text>
                  </View>
                  <Text style={styles.entDisp}>{ent.cantidadDisponible} disponibles</Text>
                  <Text style={styles.entPrecio}>Bs {ent.precio.toFixed(2)}</Text>
                </View>

                {ent.tipo === 'VIP' ? (
                  /* Botón especial para VIP */
                  <TouchableOpacity
                    style={styles.vipBtn}
                    onPress={() => setVipModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="grid-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.vipBtnText}>
                      {totalVip > 0 ? `${totalVip} asiento${totalVip > 1 ? 's' : ''}` : 'Elegir asientos'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  /* Selector numérico para otros tipos */
                  <View style={styles.qtyCtrl}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, !cantidades[ent.tipo] && { opacity: 0.3 }]}
                      onPress={() => updateC(ent.tipo, -1)}
                      disabled={!cantidades[ent.tipo]}
                    >
                      <Ionicons name="remove" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.qtyNum}
                      value={String(cantidades[ent.tipo] || 0)}
                      onChangeText={(v) => setCantidadDirecta(ent.tipo, v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={[styles.qtyBtn, cantidades[ent.tipo] >= ent.cantidadDisponible && { opacity: 0.3 }]}
                      onPress={() => updateC(ent.tipo, 1)}
                      disabled={cantidades[ent.tipo] >= ent.cantidadDisponible}
                    >
                      <Ionicons name="add" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {/* Asientos VIP seleccionados */}
            {totalVip > 0 && (
              <View style={styles.vipResumen}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.vipResumenText}>{totalVip} asiento{totalVip > 1 ? 's' : ''} VIP seleccionado{totalVip > 1 ? 's' : ''}</Text>
                <TouchableOpacity onPress={() => setVipModalVisible(true)}>
                  <Text style={styles.vipResumenEdit}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>Bs {totalPrecio.toFixed(2)}</Text>
          <Text style={styles.footerItems}>{totalItems} entrada{totalItems !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={[styles.buyBtn, totalItems === 0 && { opacity: 0.4 }]}
          onPress={handleComprar}
          disabled={totalItems === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.buyBtnText}>{user ? 'Comprar' : 'Iniciar sesión'}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de asientos VIP */}
      {vipEntrada && (
        <VipSeatSelector
          visible={vipModalVisible}
          onClose={() => setVipModalVisible(false)}
          precio={vipEntrada.precio}
          asientosBD={asientosBD}
          onConfirm={(ids) => setVipAsientos(ids)}
        />
      )}
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  imgWrap: { position: 'relative' },
  cover: { width: '100%', height: 300, resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: 300, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  imgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'transparent' },
  topBtns: { position: 'absolute', top: 54, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: COLORS.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, padding: SPACING.lg, ...SHADOWS.medium },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  badgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  statusText: { color: '#065F46', fontWeight: '600', fontSize: 11 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text, lineHeight: 32, marginBottom: 4 },
  slogan: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  infoItem: { flexDirection: 'row', width: (width - 72) / 2, backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', gap: 10 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase' },
  infoValue: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 24 },
  noEnt: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: 14, borderRadius: RADIUS.md, gap: 8 },
  noEntText: { color: COLORS.textLight, fontSize: 14 },

  // Entradas
  entCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.background, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  entInfo: { flex: 1 },
  entTipoBadge: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 4 },
  entTipoText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  entDisp: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  entPrecio: { fontSize: 18, fontWeight: '900', color: COLORS.primary },

  // Control cantidad normal
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  qtyNum: { fontSize: 18, fontWeight: '800', color: COLORS.text, minWidth: 32, textAlign: 'center', padding: 0 },

  // VIP
  vipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EDE9FE', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  vipBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  vipResumen: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.successLight, padding: 12, borderRadius: RADIUS.md, marginTop: 4,
  },
  vipResumenText: { flex: 1, fontSize: 13, color: COLORS.success, fontWeight: '600' },
  vipResumenEdit: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18, paddingBottom: 34,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.large,
  },
  footerLabel: { fontSize: 11, color: COLORS.textLight },
  footerTotal: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  footerItems: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 15,
    borderRadius: RADIUS.lg, gap: 8, ...SHADOWS.glow,
  },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ── Estilos del selector de asientos ──────────────────────────────────────
const ss = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    maxHeight: '85%', ...SHADOWS.large,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 4 },
  sheetSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  stage: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 8, alignItems: 'center', marginBottom: 16, opacity: 0.85 },
  stageText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  mapScroll: { marginBottom: 12 },
  seatGrid: { paddingBottom: 8 },
  seatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  filaLabel: { width: 20, fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginRight: 6, textAlign: 'center' },
  seat: {
    width: 32, height: 32, borderRadius: 8, marginHorizontal: 3,
    backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  seatSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark },
  seatOcupado: { backgroundColor: COLORS.error, borderColor: COLORS.error, opacity: 0.85 },
  seatTxt: { fontSize: 10, fontWeight: '600', color: COLORS.primary },
  seatTxtSel: { color: '#fff' },
  seatTxtOcupado: { color: '#fff' },
  seccionCard: { marginBottom: 16 },
  seccionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8, letterSpacing: 1 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 4, backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: COLORS.border },
  legendTxt: { fontSize: 12, color: COLORS.textSecondary },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, gap: 8,
    ...SHADOWS.glow,
  },
  confirmTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
