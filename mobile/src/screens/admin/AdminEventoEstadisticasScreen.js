import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';
import { eventosApi } from '../../api/eventos';

const { width } = Dimensions.get('window');

export default function AdminEventoEstadisticasScreen({ route, navigation }) {
  const { eventoId } = route.params;
  const [evento, setEvento] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ev = await eventosApi.getById(eventoId);
        const ent = await eventosApi.getEntradas(eventoId);
        const ast = await eventosApi.getAsientos(eventoId);
        setEvento(ev);
        setEntradas(ent);
        setAsientos(ast);
      } catch (e) {
        console.error('Error cargando stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventoId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Estadísticas: {evento?.titulo}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Resumen de Entradas</Text>
        
        {entradas.length === 0 ? (
          <Text style={styles.emptyText}>No hay entradas configuradas.</Text>
        ) : (
          entradas.map((ent, i) => {
            const pct = ent.cantidadTotal > 0 ? (ent.cantidadVendida / ent.cantidadTotal) * 100 : 0;
            return (
              <View key={i} style={styles.entCard}>
                <View style={styles.entHeader}>
                  <View style={styles.entTipoBadge}>
                    <Text style={styles.entTipoText}>{ent.tipo}</Text>
                  </View>
                  <Text style={styles.entPrecio}>Bs {ent.precio.toFixed(2)}</Text>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{ent.cantidadVendida}</Text>
                    <Text style={styles.statLbl}>Vendidas</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{ent.cantidadDisponible}</Text>
                    <Text style={styles.statLbl}>Disponibles</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{ent.cantidadTotal}</Text>
                    <Text style={styles.statLbl}>Total</Text>
                  </View>
                </View>

                <View style={styles.progressWrap}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.progressPct}>{pct.toFixed(1)}% vendido</Text>
                </View>
              </View>
            );
          })
        )}

        {asientos.length > 0 && (
          <View style={styles.asientosWrap}>
            <Text style={styles.sectionTitle}>Ocupación VIP</Text>
            
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#EDE9FE', borderColor: COLORS.border }]} />
                <Text style={styles.legendTxt}>Libre</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: COLORS.error, borderColor: COLORS.error }]} />
                <Text style={styles.legendTxt}>Ocupado</Text>
              </View>
            </View>

            <View style={styles.mapWrap}>
              <View style={styles.stage}>
                <Text style={styles.stageText}>ESCENARIO</Text>
              </View>
              
              {asientos.map((sec, secIdx) => (
                <View key={secIdx} style={styles.seccionCard}>
                  <Text style={styles.seccionTitle}>{sec.seccion}</Text>
                  <View style={styles.seatGrid}>
                    {/* Renderizamos asientos en filas de 8 */}
                    {Array.from({ length: Math.ceil(sec.asientos.length / 8) }).map((_, filaIdx) => (
                      <View key={filaIdx} style={styles.seatRow}>
                        <Text style={styles.filaLabel}>{String.fromCharCode(65 + filaIdx)}</Text>
                        {sec.asientos.slice(filaIdx * 8, (filaIdx + 1) * 8).map((ast, i) => {
                          const ocupado = ast.estado === 'Reservada' || ast.estado === 'Usada' || ast.estado !== 'Activa';
                          return (
                            <View key={i} style={[styles.seat, ocupado ? styles.seatOcupado : styles.seatLibre]}>
                              <Text style={[styles.seatTxt, ocupado && styles.seatTxtOcupado]}>
                                {ast.numero.split('-')[1]}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: 15,
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, ...SHADOWS.light 
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  scroll: { flex: 1, padding: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  emptyText: { color: COLORS.textLight, fontStyle: 'italic', marginBottom: 20 },
  
  entCard: { 
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, 
    marginBottom: 16, ...SHADOWS.small 
  },
  entHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  entTipoBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  entTipoText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  entPrecio: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  statLbl: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  
  progressWrap: { marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressPct: { fontSize: 12, color: COLORS.textLight, marginTop: 6, textAlign: 'right', fontWeight: '600' },

  asientosWrap: { marginTop: 10 },
  legend: { flexDirection: 'row', gap: 20, marginBottom: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  legendTxt: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  
  mapWrap: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 16, ...SHADOWS.small },
  stage: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 20, opacity: 0.9 },
  stageText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 4 },
  
  seccionCard: { marginBottom: 24 },
  seccionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  seatGrid: { alignItems: 'center' },
  seatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  filaLabel: { width: 20, fontSize: 12, fontWeight: '800', color: COLORS.textLight, textAlign: 'center', marginRight: 6 },
  seat: { 
    width: 32, height: 32, borderRadius: 8, marginHorizontal: 3, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1 
  },
  seatLibre: { backgroundColor: '#EDE9FE', borderColor: COLORS.border },
  seatOcupado: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  seatTxt: { fontSize: 10, fontWeight: '700' },
  seatTxtOcupado: { color: '#fff' }
});
