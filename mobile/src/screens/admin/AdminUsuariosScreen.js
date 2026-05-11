import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { usuariosApi } from '../../api/usuarios';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');

const ROLE_COLORS = {
  Admin: { bg: '#DBEAFE', text: '#1E40AF' },
  Organizador: { bg: '#FEF3C7', text: '#92400E' },
  Cliente: { bg: '#D1FAE5', text: '#065F46' },
};

export default function AdminUsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try { setUsuarios(await usuariosApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <Text style={styles.subtitle}>{usuarios.length} registrados</Text>
      </View>

      <FlatList
        data={usuarios}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => {
          const rc = ROLE_COLORS[item.rol] || ROLE_COLORS.Cliente;
          return (
            <View style={styles.card}>
              {item.fotoUrl ? (
                <Image source={{ uri: `${API_BASE}${item.fotoUrl}` }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: rc.bg }]}>
                  <Text style={[styles.avatarText, { color: rc.text }]}>
                    {item.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.nombre}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.telefono && <Text style={styles.userPhone}>{item.telefono}</Text>}
              </View>
              <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                <Text style={[styles.roleText, { color: rc.text }]}>{item.rol}</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 12, ...SHADOWS.light,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14, borderWidth: 2, borderColor: COLORS.primaryLight },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, marginRight: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  userPhone: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '700' },
});
