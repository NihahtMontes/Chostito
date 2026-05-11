import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Modal, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';
import { authApi } from '../api/auth';

const DRAWER_WIDTH = 320;

export default function ProfileDrawer({ visible, onClose, user, onLogout }) {
  const [modalInfo, setModalInfo] = useState(null);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPwd, setResetNewPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  if (!visible) return null;

  const handleChangePassword = () => {
    setResetStep(1);
    setResetEmail(user?.email || '');
    setResetToken('');
    setResetNewPwd('');
    setModalInfo('reset');
  };

  const handleSolicitarReset = async () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    try {
      const res = await authApi.solicitarReset(resetEmail);
      setResetToken(res.token || '');
      setResetStep(2);
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken || !resetNewPwd) { Alert.alert('Completá los campos'); return; }
    if (resetNewPwd.length < 6) { Alert.alert('Contraseña muy corta', 'Mínimo 6 caracteres'); return; }
    setResetLoading(true);
    try {
      await authApi.resetPassword(resetEmail, resetToken, resetNewPwd);
      Alert.alert('✅ Listo', 'Contraseña actualizada correctamente');
      setModalInfo(null);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Token inválido');
    } finally {
      setResetLoading(false);
    }
  };

  const MenuItem = ({ icon, iconColor, iconBg, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.menuText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropPress} activeOpacity={1} onPress={onClose} />
        <View style={styles.drawer}>
          <View style={styles.handle} />

          {/* Avatar e info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{user?.nombre?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.onlineDot} />
            <Text style={styles.userName}>{user?.nombre}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.telefono ? <Text style={styles.userPhone}>{user.telefono}</Text> : null}
            <View style={styles.rolBadge}>
              <Text style={styles.rolText}>{user?.rol}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.menuSection}>
            <MenuItem icon="lock-closed-outline" iconColor={COLORS.warning} iconBg={COLORS.warningLight} label="Cambiar contraseña" onPress={handleChangePassword} />
            <MenuItem icon="shield-checkmark-outline" iconColor={COLORS.info} iconBg={COLORS.infoLight} label="Privacidad y seguridad" onPress={() => setModalInfo('privacy')} />
            <MenuItem icon="help-circle-outline" iconColor={COLORS.success} iconBg={COLORS.successLight} label="Ayuda y soporte" onPress={() => setModalInfo('help')} />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <Text style={styles.version}>Chostito v1.0.0 · Bolivia 🇧🇴</Text>
        </View>
      </View>

      {/* Sub-modales */}
      <Modal visible={!!modalInfo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {modalInfo === 'reset' ? (
              <>
                <Text style={styles.modalTitle}>🔐 Cambiar contraseña</Text>
                {resetStep === 1 ? (
                  <>
                    <Text style={styles.modalDesc}>Se generará un token para verificar tu identidad.</Text>
                    <Text style={styles.modalLabel}>Correo electrónico</Text>
                    <View style={styles.modalInputWrap}>
                      <Ionicons name="mail-outline" size={17} color={COLORS.textLight} />
                      <TextInput style={styles.modalInput} value={resetEmail} onChangeText={setResetEmail} placeholder="Tu correo" placeholderTextColor={COLORS.textLight} autoCapitalize="none" keyboardType="email-address" />
                    </View>
                    <TouchableOpacity style={[styles.modalBtn, resetLoading && { opacity: 0.6 }]} onPress={handleSolicitarReset} disabled={resetLoading}>
                      {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Generar token</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.tokenBox}>
                      <Text style={styles.tokenLabel}>Tu token de verificación:</Text>
                      <Text style={styles.tokenValue}>{resetToken}</Text>
                    </View>
                    <Text style={styles.modalLabel}>Token</Text>
                    <View style={styles.modalInputWrap}>
                      <Ionicons name="key-outline" size={17} color={COLORS.textLight} />
                      <TextInput style={styles.modalInput} value={resetToken} onChangeText={setResetToken} placeholder="123456" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />
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
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalInfo(null)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : modalInfo === 'privacy' ? (
              <>
                <Text style={styles.modalTitle}>🛡️ Privacidad y Seguridad</Text>
                <Text style={styles.modalBody}>
                  En Chostito nos tomamos muy en serio tu privacidad.{'\n\n'}
                  {'• '}Tus datos se almacenan de forma segura.{'\n'}
                  {'• '}Las contraseñas se encriptan con BCrypt.{'\n'}
                  {'• '}Nunca compartimos tu info con terceros.{'\n'}
                  {'• '}Podés solicitar eliminar tu cuenta escribiendo a soporte@chostito.com
                </Text>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setModalInfo(null)}>
                  <Text style={styles.modalBtnText}>Entendido</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>💬 Ayuda y Soporte</Text>
                <Text style={styles.modalBody}>
                  Contacto: soporte@chostito.com{'\n\n'}
                  {'• '}¿Cómo comprar? Explorá eventos y elegí entradas.{'\n'}
                  {'• '}¿Cómo cancelar? Desde "Mis Reservas" → Cancelar.{'\n'}
                  {'• '}¿Cómo usar el QR? Mostralo en la entrada del evento.{'\n\n'}
                  Atención: Lun–Vie 9:00–18:00
                </Text>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setModalInfo(null)}>
                  <Text style={styles.modalBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdropPress: { flex: 1 },
  drawer: {
    width: DRAWER_WIDTH, backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.xl,
    paddingTop: 16, paddingHorizontal: SPACING.lg, paddingBottom: 36,
    ...SHADOWS.large,
  },
  handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20 },
  profileSection: { alignItems: 'center', paddingVertical: 8, position: 'relative' },
  avatarCircle: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, ...SHADOWS.glow,
  },
  avatarLetter: { fontSize: 34, fontWeight: '900', color: '#fff' },
  onlineDot: {
    position: 'absolute', top: 64, right: '32%',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.success, borderWidth: 2.5, borderColor: '#fff',
  },
  userName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  userPhone: { fontSize: 12, color: COLORS.textLight, marginBottom: 6 },
  rolBadge: { backgroundColor: '#EEEAFF', paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.full, marginTop: 4 },
  rolText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  menuSection: { gap: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: RADIUS.md, gap: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.errorLight, borderRadius: RADIUS.lg, paddingVertical: 14, gap: 8,
  },
  logoutText: { color: COLORS.error, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', marginTop: 16, fontSize: 11, color: COLORS.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: 24, ...SHADOWS.large },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  modalDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
  modalBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 20 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.md,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0',
  },
  modalInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12 },
  tokenBox: {
    backgroundColor: '#FEF3C7', borderRadius: RADIUS.md, padding: 16,
    alignItems: 'center', marginBottom: 4,
    borderWidth: 1.5, borderColor: COLORS.warning, borderStyle: 'dashed',
  },
  tokenLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  tokenValue: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: 4 },
  modalBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 12 },
  modalCancelText: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
});
