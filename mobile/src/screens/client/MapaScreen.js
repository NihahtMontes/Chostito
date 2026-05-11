import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { lugaresApi } from '../../api/lugares';

export default function MapaScreen() {
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async () => {
    try {
      const data = await lugaresApi.getAll();
      setLugares(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirMapa = (lugar) => {
    if (lugar.latitud && lugar.longitud) {
      const lat = Number(lugar.latitud);
      const lng = Number(lugar.longitud);
      const label = encodeURIComponent(lugar.nombre);
      let url;
      if (Platform.OS === 'ios') {
        url = `http://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar.direccion + ' ' + lugar.ciudad)}`);
      });
    } else {
      const query = encodeURIComponent(`${lugar.nombre} ${lugar.direccion} ${lugar.ciudad} ${lugar.pais}`);
      const url = Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url);
    }
  };

  const renderLugar = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.numBadge, index === 0 && styles.numBadgeFirst]}>
          <Text style={[styles.numText, index === 0 && styles.numTextFirst]}>
            {index + 1}
          </Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.nombre}</Text>
        <View style={styles.cardInfo}>
          <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.cardAddress} numberOfLines={2}>
            {item.direccion}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Ionicons name="globe-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.cardCity}>
            {item.ciudad}, {item.pais}
          </Text>
        </View>
        <View style={styles.cardTags}>
          <View style={styles.tag}>
            <Ionicons name="business-outline" size={12} color={COLORS.primary} />
            <Text style={styles.tagText}>{item.ambiente}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="people-outline" size={12} color={COLORS.success} />
            <Text style={styles.tagText}>{item.capacidadTotal} pers.</Text>
          </View>
          {item.latitud && item.longitud && (
            <View style={[styles.tag, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="pin-outline" size={12} color={COLORS.success} />
              <Text style={[styles.tagText, { color: COLORS.success }]}>GPS</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.mapBtn} onPress={() => abrirMapa(item)} activeOpacity={0.7}>
        <Ionicons name="navigate-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const ListFooter = () => (
    <View style={styles.hintRow}>
      <Ionicons name="information-circle-outline" size={15} color={COLORS.textLight} />
      <Text style={styles.hintText}>Tocá el ícono de navegación para abrir Google Maps</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ubicaciones</Text>
        <Text style={styles.subtitle}>
          {lugares.length} lugares en el mapa
        </Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={lugares}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLugar}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<ListFooter />}
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
              <Ionicons name="business-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>Sin lugares</Text>
              <Text style={styles.emptyText}>No hay ubicaciones registradas aún</Text>
            </View>
          }
        />
      )}
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: 20,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
    opacity: 0.7,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  cardLeft: {
    marginRight: 14,
  },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  numBadgeFirst: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  numTextFirst: {
    color: COLORS.surface,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  cardAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardCity: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEAFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEEAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});
