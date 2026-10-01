import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import styles from '@/styles/intakeStyles';

export interface SearchableDropdownProps {
  label?: string;
  value?: string;
  options: string[];
  placeholder?: string;
  onSelect: (item: string) => void;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select option...'
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredOptions = (options || []).filter(opt => opt.toLowerCase().includes(searchText.toLowerCase()));
  const exactMatch = filteredOptions.find(opt => opt.toLowerCase() === searchText.trim().toLowerCase());

  const handleSelect = (item: string) => {
    if (item) {
      onSelect(item);
    }
    setModalVisible(false);
    setSearchText('');
  };

  const handleClose = () => {
    if (searchText.trim().length > 0 && !exactMatch) {
      handleSelect(searchText.trim());
    } else {
      setModalVisible(false);
      setSearchText('');
    }
  };

  return (
    <View style={{ marginBottom: 15 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
        <Text style={{ color: value ? '#fff' : '#777', fontSize: 16 }}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { marginBottom: 15 }]}
              placeholder="Search or type new brand..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => {
                if (searchText.trim().length > 0) {
                  handleSelect(searchText.trim());
                }
              }}
              autoFocus
            />
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, idx) => idx.toString()}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                searchText.trim().length > 0 && !exactMatch ? (
                  <TouchableOpacity style={styles.modalOption} onPress={() => handleSelect(searchText.trim())}>
                    <Text style={[styles.modalOptionText, { color: '#00D1B2', fontWeight: 'bold' }]}>
                      {"+ Add New Brand: \"" + searchText.trim() + "\""}
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOption} onPress={() => handleSelect(item)}>
                  <Text style={[styles.modalOptionText, value === item && { color: '#00D1B2', fontWeight: 'bold' }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SearchableDropdown;
