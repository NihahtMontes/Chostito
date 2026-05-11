import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function DatePickerButton({ value, onChange, placeholder = 'Seleccionar fecha' }) {
  const [visible, setVisible] = useState(false);
  const today = new Date();
  const [year, setYear] = useState(value ? new Date(value).getFullYear() : today.getFullYear());
  const [month, setMonth] = useState(value ? new Date(value).getMonth() : today.getMonth());

  const days = getDaysInMonth(year, month);
  const selectedDay = value ? new Date(value).getDate() : null;

  const selectDay = (day) => {
    const d = String(day).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    onChange(`${year}-${m}-${d}`);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={() => setVisible(true)}>
        <Ionicons name="calendar-outline" size={18} color={value ? COLORS.primary : COLORS.textLight} />
        <Text style={[styles.btnText, !value && styles.btnPlaceholder]}>
          {value ? new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
              <Text style={styles.modalTitle}>Seleccionar fecha</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
                <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity onPress={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
                <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekDays}>
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d, i) => <Text key={i} style={styles.wd}>{d}</Text>)}
            </View>
            <View style={styles.daysGrid}>
              {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => <View key={`e${i}`} style={styles.dayCell} />)}
              {Array.from({ length: days }, (_, i) => i + 1).map(day => (
                <TouchableOpacity key={day} style={[styles.dayCell, selectedDay === day && styles.daySelected]} onPress={() => selectDay(day)}>
                  <Text style={[styles.dayText, selectedDay === day && styles.dayTextSelected]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function TimePickerButton({ value, onChange, placeholder = 'Seleccionar hora' }) {
  const [visible, setVisible] = useState(false);
  const [hour, setHour] = useState(value ? value.split(':')[0] : '20');
  const [min, setMin] = useState(value ? value.split(':')[1] || '00' : '00');

  const selectTime = () => {
    onChange(`${hour}:${min}`);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={() => setVisible(true)}>
        <Ionicons name="time-outline" size={18} color={value ? COLORS.primary : COLORS.textLight} />
        <Text style={[styles.btnText, !value && styles.btnPlaceholder]}>
          {value ? `${value} hs` : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.timeModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
              <Text style={styles.modalTitle}>Seleccionar hora</Text>
              <TouchableOpacity onPress={selectTime}><Text style={styles.okBtn}>OK</Text></TouchableOpacity>
            </View>
            <View style={styles.timePicker}>
              <FlatList
                data={HOURS}
                keyExtractor={(h) => h}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.timeItem, hour === item && styles.timeSelected]} onPress={() => setHour(item)}>
                    <Text style={[styles.timeText, hour === item && styles.timeTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                )}
                style={styles.timeCol}
                showsVerticalScrollIndicator={false}
                initialScrollIndex={HOURS.indexOf(hour)}
                getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
              />
              <Text style={styles.timeSep}>:</Text>
              <FlatList
                data={MINUTES}
                keyExtractor={(m) => m}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.timeItem, min === item && styles.timeSelected]} onPress={() => setMin(item)}>
                    <Text style={[styles.timeText, min === item && styles.timeTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                )}
                style={styles.timeCol}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 8,
  },
  btnText: { fontSize: 15, color: COLORS.text },
  btnPlaceholder: { color: COLORS.textLight },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.large },
  timeModal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.large },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  okBtn: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  monthLabel: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  weekDays: { flexDirection: 'row', marginBottom: 6 },
  wd: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: COLORS.textLight },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center' },
  daySelected: { backgroundColor: COLORS.primary, borderRadius: 20 },
  dayText: { fontSize: 14, color: COLORS.text },
  dayTextSelected: { color: COLORS.surface, fontWeight: '700' },
  timePicker: { flexDirection: 'row', justifyContent: 'center', height: 200 },
  timeCol: { flex: 1 },
  timeSep: { fontSize: 30, fontWeight: '800', color: COLORS.text, alignSelf: 'center', marginHorizontal: 8 },
  timeItem: { height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  timeSelected: { backgroundColor: '#EEEAFF' },
  timeText: { fontSize: 20, color: COLORS.textLight },
  timeTextSelected: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
});
