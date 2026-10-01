import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import styles from '@/styles/intakeStyles';

export interface DateDropdownsProps {
  value?: string;
  onChange: (val: string) => void;
}

export const DateDropdowns: React.FC<DateDropdownsProps> = ({ value, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'MM' | 'DD' | 'YY' | null>(null);

  let cleanValue = value || '';
  if (cleanValue.includes('-')) {
    const p = cleanValue.split('-');
    if (p.length === 3 && p[0].length === 4) {
      // YYYY-MM-DD to MM/DD/YY
      cleanValue = `${p[1]}/${p[2]}/${p[0].slice(2)}`;
    }
  }

  const parts = cleanValue.split('/');
  const mm = parts[0] || 'MM';
  const dd = parts[1] || 'DD';
  const yy = parts[2] || 'YY';

  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString().slice(2));

  const openPicker = (type: 'MM' | 'DD' | 'YY') => {
    setActivePicker(type);
    setModalVisible(true);
  };

  const selectValue = (val: string) => {
    let newMm = mm;
    let newDd = dd;
    let newYy = yy;

    if (activePicker === 'MM') newMm = val;
    if (activePicker === 'DD') newDd = val;
    if (activePicker === 'YY') newYy = val;

    onChange(`${newMm}/${newDd}/${newYy}`);
    setModalVisible(false);
  };

  const dataMap: Record<'MM' | 'DD' | 'YY', string[]> = { 'MM': months, 'DD': days, 'YY': years };
  const currentData = activePicker ? dataMap[activePicker] : [];

  const getSelectedIndex = () => {
    if (activePicker === 'MM') return months.indexOf(mm);
    if (activePicker === 'DD') return days.indexOf(dd);
    if (activePicker === 'YY') return years.indexOf(yy);
    return -1;
  };
  const selectedIndex = getSelectedIndex();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 15 }}>
      <TouchableOpacity style={[styles.input, { flex: 1, alignItems: 'center' }]} onPress={() => openPicker('MM')}>
        <Text style={{ color: mm === 'MM' ? '#777' : '#fff' }}>{mm}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.input, { flex: 1, alignItems: 'center' }]} onPress={() => openPicker('DD')}>
        <Text style={{ color: dd === 'DD' ? '#777' : '#fff' }}>{dd}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.input, { flex: 1, alignItems: 'center' }]} onPress={() => openPicker('YY')}>
        <Text style={{ color: yy === 'YY' ? '#777' : '#fff' }}>{yy}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {activePicker}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={currentData}
              keyExtractor={(item) => item}
              getItemLayout={(data, index) => ({ length: 55, offset: 55 * index, index })}
              initialScrollIndex={selectedIndex >= 0 ? selectedIndex : undefined}
              renderItem={({ item }) => {
                const isSelected = 
                  (activePicker === 'MM' && item === mm) ||
                  (activePicker === 'DD' && item === dd) ||
                  (activePicker === 'YY' && item === yy);
                  
                return (
                  <TouchableOpacity style={styles.modalOption} onPress={() => selectValue(item)}>
                    <Text style={[styles.modalOptionText, isSelected && { color: '#00D1B2', fontWeight: 'bold' }]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DateDropdowns;
