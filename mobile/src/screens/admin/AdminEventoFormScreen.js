import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { DatePickerButton, TimePickerButton } from '../../components/DatePicker';
import { eventosApi } from '../../api/eventos';
import { categoriasApi } from '../../api/categorias';
import { lugaresApi } from '../../api/lugares';

const ESTADOS = ['Borrador', 'Publicado', 'Cancelado', 'Finalizado'];
const TIPOS_ENTRADA = ['VIP', 'General', 'Platea', 'Palco', 'Campo'];

export default function AdminEventoFormScreen({ route, navigation }) {
  const eventoId = route.params?.eventoId || null;
  const esEdicion = !!eventoId;

  const [titulo, setTitulo] = useState('');
  const [eslogan, setEslogan] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [estado, setEstado] = useState('Borrador');
  const [idCategoria, setIdCategoria] = useState(null);
  const [idLugar, setIdLugar] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(esEdicion);
  const [entradas, setEntradas] = useState(esEdicion ? [] : [{ tipo: 'VIP', precio: '', cantidad: '' }]);
  const [imagen, setImagen] = useState(null);
  const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');

  useEffect(() => {
    (async () => {
      try {
        const [cats, lugs] = await Promise.all([categoriasApi.getAll(), lugaresApi.getAll()]);
        setCategorias(cats);
        setLugares(lugs);
        if (esEdicion) {
          const ev = await eventosApi.getById(eventoId);
          setTitulo(ev.titulo);
          setEslogan(ev.eslogan);
          setDescripcion(ev.descripcion);
          setFecha(ev.fecha ? new Date(ev.fecha).toISOString().split('T')[0] : '');
          setHora(ev.hora ? ev.hora.substring(0, 5) : '');
          setEstado(ev.estado);
          const cat = cats.find((c) => c.nombre === ev.categoria);
          const lug = lugs.find((l) => l.nombre === ev.lugar);
          if (cat) setIdCategoria(cat.id);
          if (lug) setIdLugar(lug.id);

          const entradasActuales = await eventosApi.getEntradas(eventoId);
          if (entradasActuales && entradasActuales.length > 0) {
            const mapped = entradasActuales.map((e) => ({
              tipo: e.tipo,
              precio: String(e.precio),
              cantidad: String(e.cantidadDisponible ?? e.cantidad ?? 0),
              existente: true,
            }));

            const hasVip = entradasActuales.some((e) => e.tipo === 'VIP');
            if (hasVip) {
              try {
                const vipPrecio = String(entradasActuales.find((e) => e.tipo === 'VIP')?.precio || '');
                const seats = await eventosApi.getAsientos(eventoId);
                if (seats && seats.length > 0) {
                  const vipIndex = mapped.findIndex((e) => e.tipo === 'VIP');
                  if (vipIndex !== -1) mapped.splice(vipIndex, 1);
                  seats.forEach((sec) => {
                    mapped.push({
                      tipo: 'VIP',
                      precio: vipPrecio,
                      cantidad: String(sec.asientos?.length || 0),
                      seccion: sec.seccion || '',
                      asientosPorSeccion: String(sec.asientos?.length || 0),
                      existente: true,
                    });
                  });
                }
              } catch {}
            }
            setEntradas(mapped.length > 0 ? mapped : [{ tipo: 'VIP', precio: '', cantidad: '' }]);
          }
        }
      } catch (e) { console.error(e); }
      finally { setCargando(false); }
    })();
  }, []);

  const addEntrada = () => setEntradas([...entradas, { tipo: 'General', precio: '', cantidad: '' }]);
  const remEntrada = (i) => { if (entradas.length > 1) setEntradas(entradas.filter((_, idx) => idx !== i)); };
  const updEntrada = (i, f, v) => { const u = [...entradas]; u[i] = { ...u[i], [f]: v }; setEntradas(u); };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso requerido'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImagen(result.assets[0]);
  };

  const validar = () => {
    if (!titulo.trim() || !eslogan.trim() || !descripcion.trim() || !fecha || !hora || !idCategoria || !idLugar) {
      Alert.alert('Campos incompletos', 'Completá todos los campos del evento');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      const data = {
        titulo: titulo.trim(), eslogan: eslogan.trim(), descripcion: descripcion.trim(),
        fecha, hora: `${hora}:00`, idCategoria, idLugar, estado,
      };

      let nuevoId = eventoId;
      if (esEdicion) {
        await eventosApi.update(eventoId, data);
      } else {
        const res = await eventosApi.create(data);
        nuevoId = res.id;
      }

      const validas = entradas.filter((e) => (e.cantidad || e.asientosPorSeccion) && Number(e.cantidad || e.asientosPorSeccion) > 0 && e.precio && Number(e.precio) > 0);
      if (validas.length > 0 && nuevoId) {
        if (esEdicion) {
          await eventosApi.reemplazarEntradas(nuevoId, validas.map((e) => {
            const d = { tipo: e.tipo, precio: Number(e.precio), cantidad: Number(e.cantidad || e.asientosPorSeccion) };
            if (e.tipo === 'VIP') { d.seccion = e.seccion || 'VIP'; d.asientosPorSeccion = Number(e.asientosPorSeccion || e.cantidad); }
            return d;
          }));
        } else {
          for (const ent of validas) {
            const d = { tipo: ent.tipo, precio: Number(ent.precio), cantidad: Number(ent.cantidad || ent.asientosPorSeccion) };
            if (ent.tipo === 'VIP') { d.seccion = ent.seccion || 'VIP'; d.asientosPorSeccion = Number(ent.asientosPorSeccion || ent.cantidad); }
            await eventosApi.agregarEntradas(nuevoId, d);
          }
        }
      }

      if (imagen && nuevoId) {
        const fd = new FormData();
        fd.append('imagen', { uri: imagen.uri, type: 'image/jpeg', name: 'evento.jpg' });
        await eventosApi.uploadImagen(nuevoId, fd);
      }

      Alert.alert('Listo', `Evento ${esEdicion ? 'actualizado' : 'creado'} con ${validas.length} tipo(s) de entrada`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg = e.response?.data?.message || JSON.stringify(e.response?.data) || 'No se pudo guardar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (cargando) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{esEdicion ? 'Editar evento' : 'Nuevo evento'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* --- DATOS DEL EVENTO --- */}
        <Text style={styles.section}>Información del evento</Text>

        <View style={styles.field}><Text style={styles.label}>Título</Text><TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Nombre del evento" placeholderTextColor={COLORS.textLight} /></View>
        <View style={styles.field}><Text style={styles.label}>Eslogan</Text><TextInput style={styles.input} value={eslogan} onChangeText={setEslogan} placeholder="Frase impactante" placeholderTextColor={COLORS.textLight} /></View>
        <View style={styles.field}><Text style={styles.label}>Descripción</Text><TextInput style={[styles.input, styles.textArea]} value={descripcion} onChangeText={setDescripcion} placeholder="Describe el evento..." placeholderTextColor={COLORS.textLight} multiline numberOfLines={4} textAlignVertical="top" /></View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Fecha</Text>
            <DatePickerButton value={fecha} onChange={setFecha} placeholder="Seleccionar fecha" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Hora</Text>
            <TimePickerButton value={hora} onChange={setHora} placeholder="Seleccionar hora" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.chipRow}>{ESTADOS.map((est) => (
            <TouchableOpacity key={est} style={[styles.chip, estado === est && styles.chipSel]} onPress={() => setEstado(est)}>
              <Text style={[styles.chipText, estado === est && styles.chipTextSel]}>{est}</Text>
            </TouchableOpacity>
          ))}</View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chipRow}>{categorias.map((cat) => (
            <TouchableOpacity key={cat.id} style={[styles.chip, idCategoria === cat.id && styles.chipSel]} onPress={() => setIdCategoria(cat.id)}>
              <Text style={styles.chipEmoji}>{cat.icono || '🎫'}</Text><Text style={[styles.chipText, idCategoria === cat.id && styles.chipTextSel]}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}</View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Lugar</Text>
          <View style={styles.chipRowWrap}>{lugares.map((lug) => (
            <TouchableOpacity key={lug.id} style={[styles.chipLug, idLugar === lug.id && styles.chipLugSel]} onPress={() => setIdLugar(lug.id)}>
              <Ionicons name="location" size={13} color={idLugar === lug.id ? COLORS.surface : COLORS.textLight} /><Text style={[styles.chipLugText, idLugar === lug.id && styles.chipLugTextSel]}>{lug.nombre}</Text>
            </TouchableOpacity>
          ))}</View>
        </View>

        {/* --- IMAGEN --- */}
        <View style={styles.field}>
          <Text style={styles.label}>Imagen del evento</Text>
          <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
            {imagen ? (
              <Image source={{ uri: imagen.uri }} style={styles.imgPreview} />
            ) : eventoId ? (
              <View style={styles.imgEmpty}><Ionicons name="image-outline" size={40} color={COLORS.textLight} /><Text style={styles.imgEmptyText}>Tocar para cambiar imagen</Text></View>
            ) : (
              <View style={styles.imgEmpty}><Ionicons name="camera-outline" size={40} color={COLORS.primaryLight} /><Text style={styles.imgEmptyText}>Tocar para subir imagen</Text></View>
            )}
          </TouchableOpacity>
        </View>

        {/* --- ENTRADAS --- */}
        <View style={styles.entradasHeader}>
          <Text style={styles.section}>Entradas</Text>
          <TouchableOpacity style={styles.addBtn} onPress={addEntrada}><Ionicons name="add-circle" size={28} color={COLORS.primary} /></TouchableOpacity>
        </View>

        {entradas.map((entry, i) => (
          <View key={i} style={styles.entradaCard}>
            <View style={styles.entradaTop}>
              <Text style={styles.entradaNum}>Tipo #{i + 1}</Text>
              {entradas.length > 1 && (
                <TouchableOpacity onPress={() => remEntrada(i)}><Ionicons name="close-circle" size={20} color={COLORS.error} /></TouchableOpacity>
              )}
            </View>
            <View style={styles.chipRow}>{TIPOS_ENTRADA.map((t) => (
              <TouchableOpacity key={t} style={[styles.chipSm, entry.tipo === t && styles.chipSmSel]} onPress={() => updEntrada(i, 'tipo', t)}>
                <Text style={[styles.chipSmText, entry.tipo === t && styles.chipSmTextSel]}>{t}</Text>
              </TouchableOpacity>
            ))}</View>
            {entry.tipo === 'VIP' ? (
              <>
                <View style={styles.row}>
                  <View style={styles.half}><Text style={styles.labelSm}>Precio (Bs)</Text><TextInput style={styles.inputSm} value={String(entry.precio || '')} onChangeText={(v) => updEntrada(i, 'precio', v)} placeholder="150" placeholderTextColor={COLORS.textLight} keyboardType="decimal-pad" /></View>
                  <View style={styles.half}><Text style={styles.labelSm}>Sección</Text><TextInput style={styles.inputSm} value={entry.seccion || ''} onChangeText={(v) => updEntrada(i, 'seccion', v)} placeholder="Platea A" placeholderTextColor={COLORS.textLight} /></View>
                </View>
                <View style={styles.field}><Text style={styles.labelSm}>Asientos por sección</Text><TextInput style={styles.inputSm} value={String(entry.asientosPorSeccion !== undefined ? entry.asientosPorSeccion : (entry.cantidad || ''))} onChangeText={(v) => { const ent = { ...entry, asientosPorSeccion: v, cantidad: v }; setEntradas(prev => prev.map((e, idx) => idx === i ? ent : e)); }} placeholder="Ej: 100" placeholderTextColor={COLORS.textLight} keyboardType="numeric" /></View>
              </>
            ) : (
              <View style={styles.row}>
                <View style={styles.half}><Text style={styles.labelSm}>Precio (Bs)</Text><TextInput style={styles.inputSm} value={String(entry.precio || '')} onChangeText={(v) => updEntrada(i, 'precio', v)} placeholder="150" placeholderTextColor={COLORS.textLight} keyboardType="decimal-pad" /></View>
                <View style={styles.half}><Text style={styles.labelSm}>Cantidad</Text><TextInput style={styles.inputSm} value={String(entry.cantidad || '')} onChangeText={(v) => updEntrada(i, 'cantidad', v)} placeholder="500" placeholderTextColor={COLORS.textLight} keyboardType="numeric" /></View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.saveBtnText}>{esEdicion ? 'Guardar todo' : 'Crear evento'}</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  scroll: { paddingHorizontal: SPACING.lg },
  section: { fontSize: 19, fontWeight: '800', color: COLORS.text, marginBottom: 14, marginTop: 8 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  labelSm: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: '#E2E8F0' },
  inputSm: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: '#E2E8F0' },
  textArea: { minHeight: 80, paddingTop: 14 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipSel: { backgroundColor: '#EDE9FE', borderColor: COLORS.primary },
  chipEmoji: { fontSize: 14, marginRight: 4 },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextSel: { color: COLORS.primary },
  chipLug: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', gap: 4 },
  chipLugSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipLugText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipLugTextSel: { color: COLORS.surface },
  entradasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  addBtn: { padding: 4 },
  entradaCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, ...SHADOWS.light },
  entradaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  entradaNum: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  chipSm: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: '#E2E8F0' },
  chipSmSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipSmText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  chipSmTextSel: { color: COLORS.surface },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 18, alignItems: 'center', marginTop: 6, ...SHADOWS.glow },
  saveBtnText: { color: COLORS.surface, fontSize: 17, fontWeight: '700' },
  imgPicker: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  imgPreview: { width: '100%', height: 180, resizeMode: 'cover' },
  imgEmpty: { width: '100%', height: 120, backgroundColor: COLORS.surfaceAlt, justifyContent: 'center', alignItems: 'center', gap: 6 },
  imgEmptyText: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
});
