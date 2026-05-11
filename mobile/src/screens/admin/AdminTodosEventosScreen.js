import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { eventosApi } from '../../api/eventos';

const ESTADO = {
  Publicado: { bg: '#D1FAE5', text: '#065F46' },
  Borrador: { bg: '#FEF3C7', text: '#92400E' },
  Cancelado: { bg: '#FEE2E2', text: '#991B1B' },
  Finalizado: { bg: '#DBEAFE', text: '#1E40AF' },
};

export default function AdminTodosEventosScreen({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try { setEventos(await eventosApi.getTodos()); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { const u = navigation.addListener('focus', cargar); return u; }, [navigation, cargar]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.title}>Todos los eventos</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={eventos}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => {
          const ec = ESTADO[item.estado] || ESTADO.Borrador;
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminEventoEstadisticas', { eventoId: item.id })} activeOpacity={0.9}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={styles.cardOrg}>{item.organizador}</Text>
                </View>
                <View style={[styles.estado, { backgroundColor: ec.bg }]}><Text style={[styles.estadoText, { color: ec.text }]}>{item.estado}</Text></View>
              </View>
              <View style={styles.cardRow}>
                <View style={styles.cardTag}><Ionicons name="pricetag" size={13} color={COLORS.textLight} /><Text style={styles.cardTagText}>{item.categoria}</Text></View>
                <View style={styles.cardTag}><Ionicons name="location" size={13} color={COLORS.textLight} /><Text style={styles.cardTagText}>{item.lugar}</Text></View>
                <View style={styles.cardTag}><Ionicons name="calendar" size={13} color={COLORS.textLight} /><Text style={styles.cardTagText}>{new Date(item.fecha).toLocaleDateString('es-ES', { day:'numeric', month:'short' })}</Text></View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="calendar-outline" size={56} color={COLORS.textLight} /><Text style={styles.emptyText}>Sin eventos</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOWS.light },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  cardOrg: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  estado: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  estadoText: { fontSize: 11, fontWeight: '700' },
  cardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cardTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTagText: { fontSize: 12, color: COLORS.textLight },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textLight, marginTop: 12 },
});
