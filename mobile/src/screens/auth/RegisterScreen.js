import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/auth';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
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
      await authApi.register({ nombre: nombre.trim(), email: email.trim().toLowerCase(), password, telefono: telefono.trim(), rol: 'Cliente' });
      Alert.alert('¡Cuenta creada!', 'Ya podés iniciar sesión con tus datos', [
        { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon, label, value, onChangeText, placeholder, keyboard = 'default', secure = false, extraRight }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={COLORS.textLight} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, extraRight && { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboard}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
          secureTextEntry={secure}
        />
        {extraRight}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topDecor} />

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Únete a Chostito y descubrí eventos increíbles</Text>
        </View>

        <View style={styles.card}>
          <Field icon="person-outline" label="Nombre completo" value={nombre} onChangeText={setNombre} placeholder="Juan Pérez" />
          <Field icon="mail-outline" label="Correo electrónico" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" keyboard="email-address" />
          <Field icon="call-outline" label="Teléfono (opcional)" value={telefono} onChangeText={setTelefono} placeholder="77712345" keyboard="phone-pad" />
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Text style={styles.btnText}>Crear mi cuenta</Text><Ionicons name="checkmark-circle" size={20} color="#fff" /></>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            ¿Ya tenés cuenta? <Text style={styles.loginBold}>Iniciá sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scroll: { padding: SPACING.lg, paddingTop: 54, paddingBottom: 40 },
  topDecor: {
    position: 'absolute', top: -40, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.primary, opacity: 0.08,
  },
  backBtn: { marginBottom: 28 },
  backCircle: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.small,
  },
  headerText: { marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 22, ...SHADOWS.medium, marginBottom: 24 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#E8EDF5',
    paddingHorizontal: 14, minHeight: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 0 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, gap: 10, marginTop: 8, ...SHADOWS.glow,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center' },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginBold: { color: COLORS.primary, fontWeight: '700' },
});
