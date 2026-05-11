import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { favoritosApi } from '../../api/favoritos';

const { width } = Dimensions.get('window');
const CW = (width - 56) / 2;
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');

export default function FavoritosScreen({ navigation }) {
  const [favoritos, setFavoritos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try { setFavoritos(await favoritosApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { const u = navigation.addListener('focus', cargar); return u; }, [navigation, cargar]);

  const handleEliminar = (id, titulo) => {
    Alert.alert('Quitar favorito', `Eliminar "${titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await favoritosApi.eliminar(id); setFavoritos((p) => p.filter((f) => f.evento.id !== id)); } catch (e) { Alert.alert('Error', e.response?.data?.message || 'No se pudo'); } } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favoritos</Text>
        {favoritos.length > 0 && <Text style={styles.headerSub}>{favoritos.length} eventos guardados</Text>}
      </View>
      <FlatList
        data={favoritos}
        keyExtractor={(i) => i.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('EventoDetalle', { eventoId: item.evento.id })}>
            <View style={styles.imgWrap}>
              {item.evento.imagenUrl ? <Image source={{ uri: `${API_BASE}${item.evento.imagenUrl}` }} style={styles.cardImg} /> : <View style={styles.imgPlace}><Ionicons name="heart" size={30} color={COLORS.error} /></View>}
              <TouchableOpacity style={styles.heartBtn} onPress={() => handleEliminar(item.evento.id, item.evento.titulo)}>
                <Ionicons name="heart" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.evento.titulo}</Text>
              <View style={styles.cardRow}><Ionicons name="location-outline" size={11} color={COLORS.textLight} /><Text style={styles.cardSub}>{item.evento.lugar}, {item.evento.ciudad}</Text></View>
              <View style={styles.cardRow}><Ionicons name="calendar-outline" size={11} color={COLORS.textLight} /><Text style={styles.cardSub}>{new Date(item.evento.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text></View>
              <View style={styles.cardFooter}><View style={styles.badge}><Text style={styles.badgeText}>{item.evento.categoria}</Text></View></View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="heart-outline" size={64} color={COLORS.textLight} /><Text style={styles.emptyText}>Sin favoritos</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', paddingHorizontal: 4 },
  card: { width: CW, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 16, overflow: 'hidden', ...SHADOWS.light },
  imgWrap: { position: 'relative' },
  cardImg: { width: '100%', height: 120, resizeMode: 'cover' },
  imgPlace: { width: '100%', height: 120, backgroundColor: '#FDF2F8', justifyContent: 'center', alignItems: 'center' },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, lineHeight: 18 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 3 },
  cardSub: { fontSize: 10, color: COLORS.textLight, flex: 1 },
  cardFooter: { flexDirection: 'row', marginTop: 8 },
  badge: { backgroundColor: '#FCE7F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.error },
  empty: { alignItems: 'center', paddingTop: 80, width: width - 40 },
  emptyText: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 12 },
});
