import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { dashboardApi } from '../../api/dashboard';

export default function AdminGananciasScreen({ navigation }) {
  const [ganancias, setGanancias] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try { setGanancias(await dashboardApi.todasGanancias()); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    cargar();
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [cargar]);
  useEffect(() => { const u = navigation.addListener('focus', cargar); return u; }, [navigation, cargar]);

  const totalGlobal = ganancias.reduce((s, g) => s + (g.totalRecaudado || 0), 0);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ganancias</Text>
        <View style={{ width: 40 }} />
      </View>

      {ganancias.length > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total global recaudado</Text>
          <Text style={styles.totalVal}>Bs {totalGlobal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Text>
          <View style={styles.totalMeta}>
            <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.totalMetaTxt}>{ganancias.length} evento{ganancias.length > 1 ? 's' : ''}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={ganancias}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => {
          const pct = item.entradasTotales > 0 ? Math.round((item.entradasVendidas / item.entradasTotales) * 100) : 0;
          const barColor = pct > 70 ? COLORS.success : pct > 30 ? COLORS.warning : COLORS.error;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
                <Text style={styles.cardOrg}>{item.organizador}</Text>
              </View>
              <View style={styles.barWrap}>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={[styles.barPct, { color: barColor }]}>{pct}%</Text>
              </View>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Ionicons name="ticket" size={16} color={COLORS.primary} />
                  <Text style={styles.statVal}>{item.entradasVendidas}</Text>
                  <Text style={styles.statLbl}>de {item.entradasTotales}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                  <Ionicons name="cash" size={16} color={COLORS.success} />
                  <Text style={styles.statVal}>Bs {Number(item.totalRecaudado || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Text>
                  <Text style={styles.statLbl}>recaudado</Text>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="cash-outline" size={64} color={COLORS.textLight} /><Text style={styles.emptyTitle}>Sin datos aún</Text><Text style={styles.emptyText}>Los reportes aparecerán cuando haya ventas</Text></View>}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 58, paddingHorizontal: SPACING.lg, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  totalCard: {
    marginHorizontal: SPACING.lg, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl, padding: 22, marginBottom: 16, ...SHADOWS.glow,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  totalVal: { fontSize: 34, fontWeight: '900', color: '#fff' },
  totalMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  totalMetaTxt: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, ...SHADOWS.light },
  cardHeader: { marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  cardOrg: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  barWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  barBg: { flex: 1, height: 10, backgroundColor: COLORS.background, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  barPct: { fontSize: 13, fontWeight: '800', width: 42, textAlign: 'right' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  divider: { width: 1, height: 36, backgroundColor: COLORS.border },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  statLbl: { fontSize: 11, color: COLORS.textLight },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 6 },
});
