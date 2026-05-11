import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Estados para recuperar contraseña
  const [modalVisible, setModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPwd, setResetNewPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5027/api').replace('/api', '');

  const handleLogin = async () => {
    setLoginError(false);
    if (!email || !password) { Alert.alert('Error', 'Completá todos los campos'); return; }
    setLoading(true);
    try { 
      await login(email.trim().toLowerCase(), password); 
    } catch (e) { 
      setLoginError(true);
      Alert.alert('Error de acceso', e.response?.data?.message || e.message); 
    } finally { setLoading(false); }
  };

  const handleSolicitarReset = async () => {
    if (!resetEmail.trim()) { Alert.alert('Error', 'Ingresá tu correo'); return; }
    setResetLoading(true);
    try {
      const { apiClient } = require('../../api/client');
      await apiClient.post('/auth/solicitar-reset', { email: resetEmail.trim().toLowerCase() });
      Alert.alert(
        'Correo enviado',
        'Si tu cuenta existe, recibirás un código en tu correo para restablecer tu contraseña.'
      );
      setResetStep(2);
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken || !resetNewPwd) { Alert.alert('Error', 'Completá los campos'); return; }
    if (resetNewPwd.length < 6) { Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres'); return; }
    setResetLoading(true);
    try {
      const { apiClient } = require('../../api/client');
      await apiClient.post('/auth/reset-password', { email: resetEmail.trim().toLowerCase(), token: resetToken, nuevaPassword: resetNewPwd });
      Alert.alert('✅ Listo', 'Contraseña actualizada correctamente. Ya podés iniciar sesión.');
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Token inválido');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Fondo decorativo */}
      <View style={styles.topDecor} />
      <View style={styles.topDecorSmall} />

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Ionicons name="ticket" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>Chostito</Text>
          <Text style={styles.tagline}>Eventos que recordarás siempre</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido</Text>
          <Text style={styles.cardSub}>Iniciá sesión en tu cuenta</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Contraseña"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Text style={styles.loginBtnText}>Ingresar</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>
            }
          </TouchableOpacity>

          {loginError && (
            <TouchableOpacity style={styles.forgotBtn} onPress={() => { setResetStep(1); setResetEmail(''); setResetToken(''); setResetNewPwd(''); setModalVisible(true); }}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>
              ¿No tenés cuenta? <Text style={styles.registerBold}>Registrate gratis</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Chostito v1.0 · Bolivia 🇧🇴</Text>
      </View>

      {/* Modal Recuperar Contraseña */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔐 Recuperar contraseña</Text>
            {resetStep === 1 ? (
              <>
                <Text style={styles.modalDesc}>Te enviaremos un código de seguridad a tu correo electrónico.</Text>
                <Text style={styles.modalLabel}>Correo electrónico</Text>
                <View style={styles.modalInputWrap}>
                  <Ionicons name="mail-outline" size={17} color={COLORS.textLight} />
                  <TextInput style={styles.modalInput} value={resetEmail} onChangeText={setResetEmail} placeholder="correo@ejemplo.com" placeholderTextColor={COLORS.textLight} autoCapitalize="none" keyboardType="email-address" />
                </View>
                <TouchableOpacity style={[styles.modalBtn, resetLoading && { opacity: 0.6 }]} onPress={handleSolicitarReset} disabled={resetLoading}>
                  {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Enviar código</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalDesc}>Ingresá el código que recibiste y tu nueva contraseña.</Text>
                <Text style={styles.modalLabel}>Código de seguridad</Text>
                <View style={styles.modalInputWrap}>
                  <Ionicons name="key-outline" size={17} color={COLORS.textLight} />
                  <TextInput style={styles.modalInput} value={resetToken} onChangeText={setResetToken} placeholder="Ej: 123456" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />
                </View>
                <Text style={styles.modalLabel}>Nueva contraseña</Text>
                <View style={styles.modalInputWrap}>
                  <Ionicons name="lock-closed-outline" size={17} color={COLORS.textLight} />
                  <TextInput style={styles.modalInput} value={resetNewPwd} onChangeText={setResetNewPwd} placeholder="Mínimo 6 caracteres" placeholderTextColor={COLORS.textLight} secureTextEntry />
                </View>
                <TouchableOpacity style={[styles.modalBtn, resetLoading && { opacity: 0.6 }]} onPress={handleResetPassword} disabled={resetLoading}>
                  {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Actualizar contraseña</Text>}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  topDecor: {
    position: 'absolute', top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.primary, opacity: 0.12,
  },
  topDecorSmall: {
    position: 'absolute', top: 60, left: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: COLORS.secondary, opacity: 0.1,
  },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.lg },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 76, height: 76, borderRadius: 24,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, ...SHADOWS.glow,
  },
  logoText: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  appName: { fontSize: 30, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.xl + 4,
    padding: 24, ...SHADOWS.medium,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  cardSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#E8EDF5',
    paddingHorizontal: 14, marginBottom: 14, minHeight: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 0 },
  eyeBtn: { padding: 4 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, gap: 8, marginTop: 8, ...SHADOWS.glow,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerBold: { color: COLORS.primary, fontWeight: '700' },
  forgotBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  forgotText: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: 24, color: COLORS.textLight, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 24, ...SHADOWS.large },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.md,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0',
  },
  modalInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12 },
  modalBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  modalCancelText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
});
