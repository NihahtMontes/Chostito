import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { eventosApi } from '../../api/eventos';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');

const ESTADO = {
  Publicado: { bg: '#D1FAE5', text: '#065F46' },
  Borrador: { bg: '#FEF3C7', text: '#92400E' },
  Cancelado: { bg: '#FEE2E2', text: '#991B1B' },
  Finalizado: { bg: '#DBEAFE', text: '#1E40AF' },
};

export default function AdminMisEventosScreen({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try { setEventos(await eventosApi.misEventos()); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { const u = navigation.addListener('focus', cargar); return u; }, [navigation, cargar]);

  const handleDelete = (ev) => {
    Alert.alert('Eliminar', `Borrar "${ev.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await eventosApi.delete(ev.id); cargar(); } catch (e) { Alert.alert('Error', e.response?.data?.message || 'No se pudo'); } } },
    ]);
  };

  const handlePublicar = async (ev) => {
    try { const fd = new FormData(); fd.append('estado', 'Publicado'); await eventosApi.update(ev.id, fd); cargar(); }
    catch (e) { Alert.alert('Error', e.response?.data?.message || 'No se pudo'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Eventos</Text>
        <TouchableOpacity style={styles.crearBtn} onPress={() => navigation.navigate('AdminEventoForm', { eventoId: null })}>
          <Ionicons name="add" size={22} color={COLORS.surface} />
          <Text style={styles.crearBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={eventos}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => {
          const ec = ESTADO[item.estado] || ESTADO.Borrador;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {item.imagenUrl ? (
                  <Image source={{ uri: `${API_BASE}${item.imagenUrl}` }} style={styles.cardImg} />
                ) : (
                  <View style={[styles.cardImg, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={24} color={COLORS.textLight} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.titulo}</Text>
                  <Text style={styles.cardDate}>{new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                </View>
                <View style={[styles.estado, { backgroundColor: ec.bg }]}><Text style={[styles.estadoText, { color: ec.text }]}>{item.estado}</Text></View>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardInfoItem}><Ionicons name="pricetag" size={14} color={COLORS.textLight} /><Text style={styles.cardInfoText}>{item.categoria}</Text></View>
                <View style={styles.cardInfoItem}><Ionicons name="location" size={14} color={COLORS.textLight} /><Text style={styles.cardInfoText}>{item.lugar}</Text></View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.act} onPress={() => navigation.navigate('AdminEventoForm', { eventoId: item.id })}>
                  <Ionicons name="create-outline" size={15} color={COLORS.primary} /><Text style={styles.actText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.act} onPress={() => navigation.navigate('AdminEventoEstadisticas', { eventoId: item.id })}>
                  <Ionicons name="stats-chart-outline" size={15} color={COLORS.success} /><Text style={[styles.actText, { color: COLORS.success }]}>Stats</Text>
                </TouchableOpacity>
                {item.estado === 'Borrador' && (
                  <TouchableOpacity style={[styles.act, { backgroundColor: '#D1FAE5' }]} onPress={() => handlePublicar(item)}>
                    <Ionicons name="rocket-outline" size={15} color="#065F46" /><Text style={[styles.actText, { color: '#065F46' }]}>Publicar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.act, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={15} color="#991B1B" /><Text style={[styles.actText, { color: '#991B1B' }]}>Elim</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}><Ionicons name="calendar-outline" size={64} color={COLORS.textLight} /><Text style={styles.emptyTitle}>Sin eventos</Text><Text style={styles.emptyText}>Crea tu primer evento</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  crearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, gap: 6, ...SHADOWS.glow },
  crearBtnText: { color: COLORS.surface, fontWeight: '700', fontSize: 14 },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, ...SHADOWS.light },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardImg: { width: 50, height: 50, borderRadius: 10, marginRight: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginRight: 8 },
  cardDate: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  estado: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  estadoText: { fontSize: 11, fontWeight: '700' },
  cardInfo: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  cardInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardInfoText: { fontSize: 12, color: COLORS.textLight },
  actions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  act: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEEAFF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  actText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
});
