import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Dimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import ProfileDrawer from '../../components/ProfileDrawer';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');

  const cargar = useCallback(async () => {
    try {
      const [statsData, ventasData] = await Promise.all([
        user?.rol === 'Admin' ? dashboardApi.getStats().catch(() => null) : null,
        dashboardApi.misVentas().catch(() => []),
      ]);
      setStats(statsData);
      setVentas(ventasData || []);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, [user?.rol]);

  useEffect(() => { cargar(); }, [cargar]);

  const formatBs = (v) => v ? `${Number(v).toLocaleString('es-ES', { maximumFractionDigits: 0 })}` : '0';

  const QUICK_ACTIONS = [
    { icon: 'albums', color: COLORS.primary, bg: '#EDE9FE', label: 'Categorías', route: 'AdminCategorias' },
    { icon: 'business', color: COLORS.success, bg: '#D1FAE5', label: 'Lugares', route: 'AdminLugares' },
    { icon: 'people', color: COLORS.info, bg: '#DBEAFE', label: 'Usuarios', route: 'AdminUsuarios' },
    { icon: 'person-add', color: '#EC4899', bg: '#FCE7F3', label: 'Registrar', route: 'AdminRegistrarUsuario' },
  ];

  const renderHeader = () => (
    <>
      {/* ── HERO ── */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>Hola, {user?.nombre?.split(' ')[0]}</Text>
            <Text style={styles.heroRole}>{user?.rol === 'Admin' ? 'Administrador' : 'Organizador'}</Text>
          </View>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.avatarWrap}>
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{user?.nombre?.charAt(0)?.toUpperCase() || 'A'}</Text>
            </View>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </View>

        {/* Stats dentro del hero */}
        {stats && (
          <View style={styles.heroStats}>
            {[
              { icon: 'calendar', val: stats.totalEventos, label: 'Eventos', color: '#A5B4FC' },
              { icon: 'ticket', val: stats.entradasVendidas, label: 'Vendidas', color: '#6EE7B7' },
              { icon: 'people', val: stats.totalUsuarios, label: 'Usuarios', color: '#FCD34D' },
            ].map((s, i) => (
              <View key={i} style={styles.heroStat}>
                <Ionicons name={s.icon} size={20} color={s.color} />
                <Text style={styles.heroStatVal}>{s.val}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── RECAUDADO ── */}
      {stats && (
        <View style={styles.recaudadoCard}>
          <View style={styles.recaudadoLeft}>
            <Text style={styles.recaudadoLabel}>Total Recaudado</Text>
            <Text style={styles.recaudadoVal}>Bs {formatBs(stats.totalRecaudado)}</Text>
          </View>
          <View style={styles.recaudadoIcon}>
            <Ionicons name="trending-up" size={28} color={COLORS.success} />
          </View>
        </View>
      )}

      {/* ── ACCIONES RÁPIDAS ── */}
      {user?.rol === 'Admin' && (
        <>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('AdminCategorias')}>
              <View style={[styles.qaIcon, { backgroundColor: '#EDE9FE' }]}><Ionicons name="albums-outline" size={20} color={COLORS.primary} /></View>
              <Text style={styles.qaText}>Categorías</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('AdminLugares')}>
              <View style={[styles.qaIcon, { backgroundColor: '#D1FAE5' }]}><Ionicons name="business-outline" size={20} color={COLORS.success} /></View>
              <Text style={styles.qaText}>Lugares</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('AdminUsuarios')}>
              <View style={[styles.qaIcon, { backgroundColor: '#DBEAFE' }]}><Ionicons name="people-outline" size={20} color={COLORS.info} /></View>
              <Text style={styles.qaText}>Usuarios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('AdminRegistrarUsuario')}>
              <View style={[styles.qaIcon, { backgroundColor: '#FEE2E2' }]}><Ionicons name="person-add-outline" size={20} color={COLORS.error} /></View>
              <Text style={styles.qaText}>Registrar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('AdminTodosEventos')}>
              <View style={[styles.qaIcon, { backgroundColor: '#EDE9FE' }]}><Ionicons name="eye-outline" size={20} color={COLORS.primary} /></View>
              <Text style={styles.qaText}>Ver todos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qaBtn} onPress={() => navigation.navigate('AdminGanancias')}>
              <View style={[styles.qaIcon, { backgroundColor: '#D1FAE5' }]}><Ionicons name="trending-up-outline" size={20} color={COLORS.success} /></View>
              <Text style={styles.qaText}>Ganancias</Text>
            </TouchableOpacity>
            <View style={[styles.qaBtn, { opacity: 0 }]}><View style={styles.qaIcon} /></View>
            <View style={[styles.qaBtn, { opacity: 0 }]}><View style={styles.qaIcon} /></View>
          </View>
        </>
      )}

      <Text style={styles.eventosTitle}>Tus eventos</Text>
    </>
  );


  const getEstadoStyle = (estado) => {
    if (estado === 'Publicado') return { bg: '#D1FAE5', text: '#065F46' };
    if (estado === 'Borrador') return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#FEE2E2', text: '#991B1B' };
  };

  return (
    <>
      <FlatList
        data={ventas}
        keyExtractor={(i) => i.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          const est = getEstadoStyle(item.estado);
          return (
            <View style={styles.ventaCard}>
              {item.imagenUrl ? (
                <Image source={{ uri: `${API_BASE}${item.imagenUrl}` }} style={styles.ventaImg} />
              ) : (
                <View style={[styles.ventaImg, styles.ventaImgPlaceholder]}>
                  <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
                </View>
              )}
              <View style={styles.ventaBody}>
                <View style={styles.ventaHead}>
                  <Text style={styles.ventaTitulo} numberOfLines={1}>{item.titulo}</Text>
                  <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                    <Text style={[styles.estadoText, { color: est.text }]}>{item.estado}</Text>
                  </View>
                </View>
                <View style={styles.ventaMetrics}>
                  <View style={styles.metric}>
                    <Ionicons name="ticket" size={18} color={COLORS.primary} />
                    <Text style={styles.metricVal}>{item.entradasVendidas || 0}</Text>
                    <Text style={styles.metricLbl}>vendidas</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metric}>
                    <Ionicons name="layers" size={18} color={COLORS.secondary} />
                    <Text style={styles.metricVal}>{item.entradasTotales || 0}</Text>
                    <Text style={styles.metricLbl}>total</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metric}>
                    <Ionicons name="cash" size={18} color={COLORS.success} />
                    <Text style={styles.metricVal}>Bs {formatBs(item.totalRecaudado)}</Text>
                    <Text style={styles.metricLbl}>recaudado</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargar(); }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Sin eventos aún</Text>
            <Text style={styles.emptyText}>Crea tu primer evento desde la pestaña Mis Eventos</Text>
          </View>
        }
      />
      <ProfileDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} user={user} onLogout={logout} />
    </>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', top: -30, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  heroGreeting: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroRole: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.6)' },
  avatarFallback: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: '#fff',
  },
  heroStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8,
  },
  heroStat: { alignItems: 'center', gap: 4 },
  heroStatVal: { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Recaudado
  recaudadoCard: {
    margin: SPACING.lg,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.medium,
  },
  recaudadoLeft: {},
  recaudadoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 4 },
  recaudadoVal: { fontSize: 30, fontWeight: '900', color: COLORS.success },
  recaudadoIcon: {
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, marginTop: 12, marginBottom: 4,
  },
  qaBtn: { alignItems: 'center', width: '22%' },
  qaIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  qaText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },

  // Eventos
  eventosTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, paddingHorizontal: SPACING.lg, marginTop: 24, marginBottom: 12 },
  listContent: { paddingBottom: 110 },
  ventaCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.lg, marginBottom: 14, overflow: 'hidden', ...SHADOWS.light,
  },
  ventaImg: { width: '100%', height: 120, resizeMode: 'cover' },
  ventaImgPlaceholder: { backgroundColor: '#F0EDFF', justifyContent: 'center', alignItems: 'center' },
  ventaBody: { padding: 16 },
  ventaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  ventaTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  estadoText: { fontSize: 11, fontWeight: '700' },
  ventaMetrics: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  metric: { alignItems: 'center', gap: 3 },
  metricVal: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  metricLbl: { fontSize: 10, color: COLORS.textLight, textTransform: 'uppercase' },
  metricDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
