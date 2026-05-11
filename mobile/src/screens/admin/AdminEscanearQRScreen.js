import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { dashboardApi } from '../../api/dashboard';

export default function AdminEscanearQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const validarQR = async (codigo) => {
    setValidando(true);
    try {
      const res = await dashboardApi.escanearQR(codigo);
      setResultado({ success: true, ...res });
    } catch (error) {
      const msg = error.response?.data?.message || 'QR no valido';
      setResultado({ success: false, message: msg });
    } finally {
      setValidando(false);
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    setScanned(true);
    validarQR(data);
  };

  const resetear = () => {
    setScanned(false);
    setResultado(null);
  };

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.permissionText}>Necesitamos acceso a tu camara para escanear entradas</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Otorgar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Escanear entrada</Text>
          <Text style={styles.subtitle}>Apunta al codigo QR de la entrada</Text>
        </View>

        {!resultado && !validando && (
          <View style={styles.focusFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        )}

        {validando && (
          <View style={styles.validandoCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.validandoText}>Validando entrada...</Text>
          </View>
        )}

        {resultado && !validando && (
          <View style={[styles.resultCard, resultado.success ? styles.resultSuccess : styles.resultError]}>
            <View style={[styles.resultIcon, { backgroundColor: resultado.success ? COLORS.success : COLORS.error }]}>
              <Ionicons
                name={resultado.success ? 'checkmark' : 'close'}
                size={36}
                color={COLORS.surface}
              />
            </View>
            <Text style={styles.resultTitle}>
              {resultado.success ? 'Entrada Valida' : 'Entrada Invalida'}
            </Text>
            {resultado.success ? (
              <View style={styles.resultInfo}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Tipo</Text>
                  <Text style={styles.resultValue}>{resultado.tipo}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Evento</Text>
                  <Text style={styles.resultValue}>{resultado.evento}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Comprador</Text>
                  <Text style={styles.resultValue}>{resultado.comprador || '-'}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Email</Text>
                  <Text style={styles.resultValue}>{resultado.emailComprador || '-'}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Transaccion</Text>
                  <Text style={styles.resultValue}>{resultado.codigoTransaccion || '-'}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Fecha</Text>
                  <Text style={styles.resultValue}>
                    {resultado.fecha ? new Date(resultado.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.errorMessage}>{resultado.message}</Text>
            )}
            <TouchableOpacity style={styles.scanBtn} onPress={resetear}>
              <Ionicons name="scan" size={20} color={COLORS.surface} />
              <Text style={styles.scanBtnText}>Escanear otra</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: 24,
    lineHeight: 24,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 70,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.surface,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  focusFrame: {
    width: 250,
    height: 250,
    justifyContent: 'space-between',
    flexDirection: 'column',
    position: 'relative',
  },
  corner: {
    width: 45,
    height: 45,
    borderColor: COLORS.primary,
    position: 'absolute',
    borderRadius: 4,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 16 },
  validandoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 14,
  },
  validandoText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '85%',
  },
  resultSuccess: {
    borderWidth: 3,
    borderColor: COLORS.success,
  },
  resultError: {
    borderWidth: 3,
    borderColor: COLORS.error,
  },
  resultIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 18,
  },
  resultInfo: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  errorMessage: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  scanBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
