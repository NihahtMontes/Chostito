import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { lugaresApi } from '../../api/lugares';

export default function AdminLugaresScreen() {
  const [lugares, setLugares] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', direccion: '', pais: '', ciudad: '', ambiente: '', capacidadTotal: '', latitud: '', longitud: '' });

  const cargar = useCallback(async () => {
    try { setLugares(await lugaresApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', direccion: '', pais: '', ciudad: '', ambiente: '', capacidadTotal: '', latitud: '', longitud: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.direccion.trim()) {
      Alert.alert('Error', 'Nombre y dirección son obligatorios');
      return;
    }
    try {
      const { apiClient } = require('../../api/client');
      const data = {
        nombre: form.nombre, direccion: form.direccion,
        pais: form.pais, ciudad: form.ciudad, ambiente: form.ambiente,
        capacidadTotal: Number(form.capacidadTotal) || 0,
        latitud: form.latitud ? Number(form.latitud) : null,
        longitud: form.longitud ? Number(form.longitud) : null,
      };
      if (editing) {
        data.id = editing.id;
        await apiClient.put(`/lugares/${editing.id}`, data);
      } else {
        await apiClient.post('/lugares', data);
      }
      setModalVisible(false);
      cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
    }
  };

  const abrirMapaCoords = () => {
    const query = encodeURIComponent(`${form.direccion} ${form.ciudad} ${form.pais}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleDelete = (lugar) => {
    Alert.alert('Eliminar', `Eliminar "${lugar.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          const { apiClient } = require('../../api/client');
          await apiClient.delete(`/lugares/${lugar.id}`);
          cargar();
        } catch (e) {
          Alert.alert('Error', e.response?.data?.message || 'No se pudo eliminar');
        }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lugares</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={24} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={lugares}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="business-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.nombre}</Text>
              <Text style={styles.cardSub}>{item.direccion}</Text>
              <Text style={styles.cardSub}>{item.ciudad}, {item.pais}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => {
                setEditing(item);
                setForm({
                  nombre: item.nombre, direccion: item.direccion,
                  pais: item.pais, ciudad: item.ciudad, ambiente: item.ambiente,
                  capacidadTotal: String(item.capacidadTotal || ''),
                  latitud: item.latitud ? String(item.latitud) : '',
                  longitud: item.longitud ? String(item.longitud) : '',
                });
                setModalVisible(true);
              }}>
                <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}><Ionicons name="business-outline" size={56} color={COLORS.textLight} /><Text style={styles.emptyText}>Sin lugares</Text></View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Editar' : 'Nuevo'} lugar</Text>
            <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => setForm({...form, nombre: v})} placeholder="Nombre" placeholderTextColor={COLORS.textLight} />
            <TextInput style={styles.input} value={form.direccion} onChangeText={(v) => setForm({...form, direccion: v})} placeholder="Dirección" placeholderTextColor={COLORS.textLight} />
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.half]} value={form.ciudad} onChangeText={(v) => setForm({...form, ciudad: v})} placeholder="Ciudad" placeholderTextColor={COLORS.textLight} />
              <TextInput style={[styles.input, styles.half]} value={form.pais} onChangeText={(v) => setForm({...form, pais: v})} placeholder="País" placeholderTextColor={COLORS.textLight} />
            </View>
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.half]} value={form.ambiente} onChangeText={(v) => setForm({...form, ambiente: v})} placeholder="Ambiente" placeholderTextColor={COLORS.textLight} />
              <TextInput style={[styles.input, styles.half]} value={form.capacidadTotal} onChangeText={(v) => setForm({...form, capacidadTotal: v})} placeholder="Capacidad" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />
            </View>
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.half]} value={form.latitud} onChangeText={(v) => setForm({...form, latitud: v})} placeholder="Latitud (opc)" placeholderTextColor={COLORS.textLight} keyboardType="decimal-pad" />
              <TextInput style={[styles.input, styles.half]} value={form.longitud} onChangeText={(v) => setForm({...form, longitud: v})} placeholder="Longitud (opc)" placeholderTextColor={COLORS.textLight} keyboardType="decimal-pad" />
            </View>
            <TouchableOpacity style={styles.mapHint} onPress={abrirMapaCoords}>
              <Ionicons name="map-outline" size={16} color={COLORS.primary} />
              <Text style={styles.mapHintText}>Abrir Google Maps y pegar coordenadas</Text>
            </TouchableOpacity>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  addBtn: { width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.glow },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOWS.light },
  cardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEEAFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEEAFF', justifyContent: 'center', alignItems: 'center' },
  delBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.errorLight, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textLight, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.large, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: 14, fontSize: 14, color: COLORS.text, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  mapHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginBottom: 8 },
  mapHintText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  cancelBtn: { flex: 1, padding: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: { flex: 1, padding: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: COLORS.surface },
});
