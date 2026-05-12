import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onSelect: (checkIn: Date | null, checkOut: Date | null) => void;
  onClose: () => void;
}

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];
const MESES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatDateDisplay = (date: Date) => `${date.getDate()} ${MESES[date.getMonth()]}`;

const getNights = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

export default function DateRangePicker({ checkIn, checkOut, onSelect, onClose }: DateRangePickerProps) {
  const tc = useThemeColors();
  const { width } = useWindowDimensions();
  const [currentMonth, setCurrentMonth] = useState(checkIn || new Date());
  
  // local state para permitir selección sin confirmar
  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(checkOut);
  const [selecting, setSelecting] = useState<'checkin' | 'checkout'>(checkIn && !checkOut ? 'checkout' : 'checkin');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const handleDayPress = (day: Date) => {
    if (selecting === 'checkin') {
      setTempCheckIn(day);
      setTempCheckOut(null);
      setSelecting('checkout');
    } else {
      if (tempCheckIn && day <= tempCheckIn) {
        setTempCheckIn(day);
        setTempCheckOut(null);
        setSelecting('checkout');
      } else {
        setTempCheckOut(day);
        setSelecting('checkin');
        onSelect(tempCheckIn, day);
      }
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // adjust first day to sunday (0)
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    while (days.length < 42) {
      days.push(null);
    }
    
    return days;
  }, [currentMonth]);

  const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const panelWidth = Math.min(width, 400); // max width for desktop
  const cellWidth = (panelWidth - 40) / 7;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: tc.bgCard, width: panelWidth }]}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronLeft size={24} color={tc.text} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: tc.text }]}>
              {MESES_FULL[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronRight size={24} color={tc.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {DIAS_SEMANA.map(d => (
              <Text key={d} style={[styles.weekDayText, { color: tc.textSecondary, width: cellWidth }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, i) => {
              if (!day) return <View key={i} style={{ width: cellWidth, height: 44 }} />;
              
              const isPast = day < today;
              const isCheckIn = isSameDay(day, tempCheckIn);
              const isCheckOut = isSameDay(day, tempCheckOut);
              const isBetween = tempCheckIn && tempCheckOut && day > tempCheckIn && day < tempCheckOut;
              const isToday = isSameDay(day, today);

              return (
                <TouchableOpacity
                  key={i}
                  disabled={isPast}
                  onPress={() => handleDayPress(day)}
                  style={[
                    styles.dayCell,
                    { width: cellWidth },
                    isBetween && { backgroundColor: '#FF6B3515' },
                    isCheckIn && { backgroundColor: '#FF6B35' },
                    isCheckOut && { backgroundColor: '#FF6B35' },
                    isCheckIn && tempCheckOut && { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
                    isCheckOut && tempCheckIn && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    { color: tc.text },
                    isPast && { opacity: 0.3 },
                    (isCheckIn || isCheckOut) && { color: '#FFF', fontWeight: 'bold' },
                    !isCheckIn && !isCheckOut && isToday && { color: '#FF6B35', fontWeight: 'bold' }
                  ]}>
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.indicatorContainer}>
            <View style={styles.indicatorRow}>
              <View style={styles.indicatorCol}>
                <Text style={[styles.indicatorLabel, { color: tc.textSecondary }]}>LLEGADA</Text>
                <Text style={[styles.indicatorValue, tempCheckIn ? { color: tc.text } : { color: tc.textSecondary }]}>
                  {tempCheckIn ? formatDateDisplay(tempCheckIn) : '—'}
                </Text>
              </View>
              <View style={[styles.indicatorDivider, { backgroundColor: tc.borderLight }]} />
              <View style={styles.indicatorCol}>
                <Text style={[styles.indicatorLabel, { color: tc.textSecondary }]}>SALIDA</Text>
                <Text style={[styles.indicatorValue, tempCheckOut ? { color: tc.text } : { color: tc.textSecondary }]}>
                  {tempCheckOut ? formatDateDisplay(tempCheckOut) : '—'}
                </Text>
              </View>
            </View>
            {tempCheckIn && tempCheckOut && (
              <Text style={styles.nightsText}>{getNights(tempCheckIn, tempCheckOut)} noches</Text>
            )}
          </View>

          <View style={styles.footerBtns}>
            <TouchableOpacity 
              style={[styles.btnOutline, { borderColor: tc.borderLight }]} 
              onPress={() => {
                setTempCheckIn(null);
                setTempCheckOut(null);
                setSelecting('checkin');
                onSelect(null, null);
              }}
            >
              <Text style={[styles.btnOutlineText, { color: tc.text }]}>Limpiar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnConfirm, (!tempCheckIn || !tempCheckOut) && { opacity: 0.5 }]} 
              disabled={!tempCheckIn || !tempCheckOut}
              onPress={() => {
                onSelect(tempCheckIn, tempCheckOut);
                onClose();
              }}
            >
              <Text style={styles.btnConfirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  dayText: {
    fontSize: 14,
  },
  indicatorContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 80,
  },
  indicatorLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '600',
  },
  indicatorValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  indicatorDivider: {
    width: 1,
    height: 30,
  },
  nightsText: {
    fontSize: 13,
    color: '#FF6B35',
    marginTop: 8,
    fontWeight: 'bold',
  },
  footerBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnOutlineText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
