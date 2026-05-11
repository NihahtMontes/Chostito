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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { categoriasApi } from '../../api/categorias';

export default function AdminCategoriasScreen() {
  const [categorias, setCategorias] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [icono, setIcono] = useState('');

  const cargar = useCallback(async () => {
    try {
      setCategorias(await categoriasApi.getAll());
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const openCreate = () => {
    setEditing(null);
    setNombre('');
    setDescripcion('');
    setIcono('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    try {
      // Simple POST usando apiClient directamente
      const { apiClient } = require('../../api/client');
      if (editing) {
        await apiClient.put(`/categorias/${editing.id}`, { id: editing.id, nombre, descripcion, icono });
      } else {
        await apiClient.post('/categorias', { nombre, descripcion, icono });
      }
      setModalVisible(false);
      cargar();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar');
    }
  };

  const handleDelete = (cat) => {
    Alert.alert('Eliminar', `Eliminar "${cat.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            const { apiClient } = require('../../api/client');
            await apiClient.delete(`/categorias/${cat.id}`);
            cargar();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categorías</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={24} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categorias}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.icono}>{item.icono || '🎫'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.nombre}</Text>
              {item.descripcion && <Text style={styles.cardDesc}>{item.descripcion}</Text>}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => {
                setEditing(item); setNombre(item.nombre); setDescripcion(item.descripcion || ''); setIcono(item.icono || ''); setModalVisible(true);
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
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={56} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Sin categorías</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Editar' : 'Nueva'} categoría</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor={COLORS.textLight} />
            <TextInput style={styles.input} value={descripcion} onChangeText={setDescripcion} placeholder="Descripción" placeholderTextColor={COLORS.textLight} />
            <TextInput style={styles.input} value={icono} onChangeText={setIcono} placeholder="Ícono emoji (ej: 🎵)" placeholderTextColor={COLORS.textLight} maxLength={2} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
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
  icono: { fontSize: 32, marginRight: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  delBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.errorLight, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textLight, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.large },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: 14, fontSize: 15, color: COLORS.text, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: { flex: 1, padding: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: COLORS.surface },
});
