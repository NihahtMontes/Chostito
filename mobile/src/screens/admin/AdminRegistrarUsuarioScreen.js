import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { apiClient } from '../../api/client';

const ROLES = [
  { key: 'Cliente', icon: 'person-outline', color: COLORS.primary, bg: '#EEEAFF' },
  { key: 'Organizador', icon: 'megaphone-outline', color: COLORS.success, bg: COLORS.successLight },
  { key: 'Admin', icon: 'shield-outline', color: COLORS.error, bg: COLORS.errorLight },
];

export default function AdminRegistrarUsuarioScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState('Cliente');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre.trim() || !email.trim() || !password) {
      Alert.alert('Campos incompletos', 'Nombre, email y contraseña son obligatorios');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Email inválido', 'Ingresá un correo electrónico válido');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/register', { nombre: nombre.trim(), email: email.trim().toLowerCase(), password, telefono: telefono.trim(), rol });
      Alert.alert('✅ Usuario creado', `${rol} "${nombre}" creado correctamente`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const selRol = ROLES.find(r => r.key === rol);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar usuario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Rol selector */}
        <Text style={styles.sectionLabel}>Tipo de usuario</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, rol === r.key && { borderColor: r.color, backgroundColor: r.bg }]}
              onPress={() => setRol(r.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconWrap, { backgroundColor: rol === r.key ? r.color : '#F1F5F9' }]}>
                <Ionicons name={r.icon} size={22} color={rol === r.key ? '#fff' : COLORS.textLight} />
              </View>
              <Text style={[styles.roleText, rol === r.key && { color: r.color, fontWeight: '700' }]}>{r.key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          {/* Nombre */}
          <View style={styles.field}>
            <Text style={styles.label}>Nombre completo</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={COLORS.textLight} />
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre Apellido" placeholderTextColor={COLORS.textLight} />
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textLight} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" placeholderTextColor={COLORS.textLight} autoCapitalize="none" keyboardType="email-address" />
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.field}>
            <Text style={styles.label}>Teléfono (opcional)</Text>
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.textLight} />
              <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="77712345" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} />
              <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={COLORS.textLight} secureTextEntry={!showPass} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPass(p => !p)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }, selRol && { backgroundColor: selRol.color }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="person-add-outline" size={20} color="#fff" /><Text style={styles.saveBtnText}>Crear {rol}</Text></>
          }
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 58, paddingHorizontal: SPACING.lg, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
  headerTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text },
  scroll: { paddingHorizontal: SPACING.lg },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleCard: {
    flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#fff', padding: 14, alignItems: 'center', gap: 8, ...SHADOWS.small,
  },
  roleIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  roleText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 20, ...SHADOWS.medium, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.md,
    paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#E8EDF5', minHeight: 50,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 0 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, gap: 8, ...SHADOWS.glow,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
