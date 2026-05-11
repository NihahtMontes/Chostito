import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, RefreshControl, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { eventosApi } from '../../api/eventos';
import { categoriasApi } from '../../api/categorias';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import ProfileDrawer from '../../components/ProfileDrawer';

const { width } = Dimensions.get('window');
const CARD_W = (width - 56) / 2;

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catSel, setCatSel] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const params = { estado: 'Publicado' };
      if (catSel) params.categoriaId = catSel;
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      const [ev, cat] = await Promise.all([eventosApi.getAll(params), categoriasApi.getAll()]);
      setEventos(ev);
      setCategorias(cat);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [catSel, busqueda]);

  const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');
  useEffect(() => { setLoading(true); cargar(); }, [cargar]);


  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hola, {user?.nombre?.split(' ')[0] || 'Usuario'}</Text>
            <Text style={styles.subtitle}>Descubrí eventos increíbles</Text>
          </View>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user?.nombre?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.textLight} />
            <TextInput style={styles.searchInput} placeholder="Buscar eventos..." placeholderTextColor={COLORS.textLight} value={busqueda} onChangeText={setBusqueda} returnKeyType="search" />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {categorias.length > 0 && (
          <View style={styles.chipWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipList}
            >
              <TouchableOpacity style={[styles.chip, !catSel && styles.chipSel]} onPress={() => setCatSel(null)}>
                <Text style={styles.chipIcon}>🌟</Text>
                <Text style={[styles.chipText, !catSel && styles.chipTextSel]}>Todos</Text>
              </TouchableOpacity>
              {categorias.map((item) => {
                const sel = catSel === item.id;
                return (
                  <TouchableOpacity key={item.id} style={[styles.chip, sel && styles.chipSel]} onPress={() => setCatSel(sel ? null : item.id)}>
                    <Text style={styles.chipIcon}>{item.icono || '🎫'}</Text>
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>{item.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={eventos}
          keyExtractor={(i) => i.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('EventoDetalle', { eventoId: item.id })}>
              <View style={styles.cardImgWrap}>
                {item.imagenUrl ? (
                  <Image source={{ uri: `${API_BASE}${item.imagenUrl}` }} style={styles.cardImg} />
                ) : (
                  <View style={styles.cardImgPlaceholder}><Ionicons name="ticket" size={36} color={COLORS.primaryLight} /></View>
                )}
                <View style={styles.cardBadge}>
                  <Ionicons name="calendar" size={10} color={COLORS.surface} />
                  <Text style={styles.cardBadgeText}>{new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.titulo}</Text>
                <View style={styles.cardInfoRow}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textLight} />
                  <Text style={styles.cardInfoText} numberOfLines={1}>{item.lugar}, {item.ciudad}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.catBadge}><Text style={styles.catBadgeText}>{item.categoria}</Text></View>
                  <Ionicons name="arrow-forward-circle" size={26} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}><Ionicons name="search-outline" size={64} color={COLORS.textLight} /><Text style={styles.emptyTitle}>Sin resultados</Text></View>
            )
          }
        />
      </View>
      <ProfileDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} user={user} onLogout={logout} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 58, paddingHorizontal: SPACING.lg, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: COLORS.primaryLight },
  avatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.surface },
  searchWrap: { paddingHorizontal: SPACING.lg, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 4, ...SHADOWS.small },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 15, color: COLORS.text },
  chipWrapper: { height: 52, marginBottom: 4 },
  chipList: { paddingHorizontal: SPACING.lg, gap: 8, alignItems: 'flex-start' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, marginRight: 8, borderWidth: 1.5, borderColor: 'transparent', ...SHADOWS.small },
  chipSel: { backgroundColor: '#EEEAFF', borderColor: COLORS.primary },
  chipIcon: { fontSize: 15, marginRight: 5 },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextSel: { color: COLORS.primary },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', paddingHorizontal: 4 },
  card: { width: CARD_W, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 16, overflow: 'hidden', ...SHADOWS.light },
  cardImgWrap: { position: 'relative' },
  cardImg: { width: '100%', height: 135, resizeMode: 'cover' },
  cardImgPlaceholder: { width: '100%', height: 135, backgroundColor: '#F0EDFF', justifyContent: 'center', alignItems: 'center' },
  cardBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassDark, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 3 },
  cardBadgeText: { color: COLORS.surface, fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 6, lineHeight: 19 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 3 },
  cardInfoText: { fontSize: 11, color: COLORS.textLight, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { backgroundColor: '#EEEAFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 60, width: width - 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 12 },
});
