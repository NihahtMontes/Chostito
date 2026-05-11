import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

const SEATS_PER_ROW = 8;

function groupIntoRows(asientos) {
  const rows = [];
  for (let i = 0; i < asientos.length; i += SEATS_PER_ROW) {
    rows.push(asientos.slice(i, i + SEATS_PER_ROW));
  }
  return rows;
}

export default function SeatMap({ secciones, selectedIds, onToggleAsiento, maxSelect = 10 }) {
  if (!secciones || secciones.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No hay asientos VIP en este evento</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
      {secciones.map((seccion) => {
        const rows = groupIntoRows(seccion.asientos);
        return (
          <View key={seccion.seccion} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{seccion.seccion}</Text>
            <View style={styles.stage}>
              <Text style={styles.stageText}>ESCENARIO</Text>
            </View>
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.seatRow}>
                <Text style={styles.rowLabel}>{String.fromCharCode(65 + rowIdx)}</Text>
                {row.map((asiento) => {
                  const isSelected = selectedIds.includes(asiento.id);
                  const isTaken = asiento.estado === 'Reservada' || asiento.estado === 'Usada';
                  let seatStyle = styles.seatFree;
                  let textStyle = styles.seatTextFree;
                  if (isTaken) {
                    seatStyle = styles.seatTaken;
                    textStyle = styles.seatTextTaken;
                  } else if (isSelected) {
                    seatStyle = styles.seatSelected;
                    textStyle = styles.seatTextSelected;
                  }
                  return (
                    <TouchableOpacity
                      key={asiento.id}
                      style={[styles.seat, seatStyle]}
                      onPress={() => {
                        if (!isTaken) onToggleAsiento(asiento.id);
                      }}
                      disabled={isTaken}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.seatText, textStyle]}>
                        {asiento.numero.split('-').pop()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Libre</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Seleccionado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.textLight }]} />
                <Text style={styles.legendText}>Ocupado</Text>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 14, color: COLORS.textLight },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16, ...SHADOWS.light },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  stage: { backgroundColor: '#F0EDFF', paddingVertical: 8, borderRadius: 8, marginBottom: 14, alignItems: 'center' },
  stageText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryLight, letterSpacing: 3 },
  seatRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6, gap: 4 },
  rowLabel: { width: 18, fontSize: 10, fontWeight: '700', color: COLORS.textLight, textAlign: 'center' },
  seat: { width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  seatFree: { backgroundColor: COLORS.successLight, borderWidth: 1.5, borderColor: COLORS.success },
  seatTaken: { backgroundColor: '#E2E8F0', borderWidth: 1.5, borderColor: COLORS.textLight },
  seatSelected: { backgroundColor: COLORS.primaryLight, borderWidth: 1.5, borderColor: COLORS.primary },
  seatText: { fontSize: 9, fontWeight: '700' },
  seatTextFree: { color: '#065F46' },
  seatTextTaken: { color: COLORS.textLight },
  seatTextSelected: { color: COLORS.surface },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E8ECF0' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: COLORS.textLight },
});
