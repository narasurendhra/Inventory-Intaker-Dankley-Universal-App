import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import styles from '@/styles/intakeStyles';

export interface CategoryPickerModalProps {
  visible: boolean;
  options: string[];
  value?: string;
  onClose: () => void;
  onSelect: (categoryPath: string) => void;
}

export const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible,
  options,
  value,
  onClose,
  onSelect
}) => {
  const [searchText, setSearchText] = useState('');
  const [navPath, setNavPath] = useState<string[]>([]);

  const handleClose = () => {
    setSearchText('');
    setNavPath([]);
    onClose();
  };

  const handleSelect = (categoryPath: string) => {
    onSelect(categoryPath);
    setSearchText('');
    setNavPath([]);
  };

  const filteredItems: CategoryItem[] = (options || [])
    .filter(opt => opt.toLowerCase().includes(searchText.toLowerCase()))
    .map(opt => ({
      label: opt,
      fullPath: opt,
      isLeaf: true,
      hasSub: false
    }));

  // Hierarchical view when search is empty
  let currentLevelItems: CategoryItem[] = [];
  let currentPrefix = navPath.length > 0 ? navPath.join(' > ') : '';

  if (!searchText.trim()) {
    if (navPath.length === 0) {
      // Root: Unique Level 1 categories
      const level1Set = new Set<string>();
      (options || []).forEach(opt => {
        const parts = opt.split(' > ').map(p => p.trim());
        if (parts[0]) level1Set.add(parts[0]);
      });
      currentLevelItems = Array.from(level1Set).sort().map(lvl1 => {
        const matching = (options || []).filter(o => o === lvl1 || o.startsWith(lvl1 + ' > '));
        const hasSub = matching.some(o => o.includes(' > '));
        return { label: lvl1, fullPath: lvl1, isLeaf: !hasSub, hasSub };
      });
    } else if (navPath.length === 1) {
      // Level 2
      const lvl1 = navPath[0];
      const prefix = `${lvl1} > `;
      const subSet = new Set<string>();
      (options || []).forEach(opt => {
        if (opt.startsWith(prefix)) {
          const rem = opt.slice(prefix.length);
          const parts = rem.split(' > ').map(p => p.trim());
          if (parts[0]) subSet.add(parts[0]);
        }
      });
      currentLevelItems = Array.from(subSet).sort().map(lvl2 => {
        const full = `${lvl1} > ${lvl2}`;
        const hasSub = (options || []).some(o => o.startsWith(full + ' > '));
        return { label: lvl2, fullPath: full, isLeaf: !hasSub, hasSub };
      });
    } else if (navPath.length === 2) {
      // Level 3
      const prefix = `${navPath[0]} > ${navPath[1]} > `;
      const subSet = new Set<string>();
      (options || []).forEach(opt => {
        if (opt.startsWith(prefix)) {
          const rem = opt.slice(prefix.length);
          const parts = rem.split(' > ').map(p => p.trim());
          if (parts[0]) subSet.add(parts[0]);
        }
      });
      currentLevelItems = Array.from(subSet).sort().map(lvl3 => {
        const full = `${navPath[0]} > ${navPath[1]} > ${lvl3}`;
        return { label: lvl3, fullPath: full, isLeaf: true, hasSub: false };
      });
    }
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '80%', maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Alleaves Category</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Search all categories (e.g. Rosin, Gummies)..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={(txt) => { setSearchText(txt); if (txt) setNavPath([]); }}
          />

          {/* Breadcrumb Bar */}
          {!searchText.trim() && (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#1A1A1A', padding: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#333' }}>
              <TouchableOpacity onPress={() => setNavPath([])} style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
                <Text style={{ color: navPath.length === 0 ? '#00D1B2' : '#888', fontWeight: 'bold', fontSize: 12 }}>All Categories</Text>
              </TouchableOpacity>
              {navPath.map((node, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#555', marginHorizontal: 2 }}>{'>'}</Text>
                  <TouchableOpacity onPress={() => setNavPath(navPath.slice(0, i + 1))} style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
                    <Text style={{ color: i === navPath.length - 1 ? '#00D1B2' : '#bbb', fontWeight: 'bold', fontSize: 12 }}>{node}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Current Level Direct Selection if valid category */}
          {!searchText.trim() && navPath.length > 0 && (options || []).includes(currentPrefix) && (
            <TouchableOpacity 
              style={[styles.modalOption, { backgroundColor: '#112211', borderWidth: 1, borderColor: '#00D1B2', borderRadius: 6, marginBottom: 8 }]} 
              onPress={() => handleSelect(currentPrefix)}
            >
              <Text style={[styles.modalOptionText, { color: '#00D1B2', fontWeight: 'bold' }]}>
                ✓ Select Level: "{currentPrefix}"
              </Text>
            </TouchableOpacity>
          )}

          {/* List of items */}
          <FlatList<CategoryItem>
            data={searchText.trim() ? filteredItems : currentLevelItems}
            keyExtractor={(item, idx) => item.fullPath + idx}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              if (item.isLeaf && !item.hasSub) {
                return (
                  <TouchableOpacity style={styles.modalOption} onPress={() => handleSelect(item.fullPath)}>
                    <Text style={[styles.modalOptionText, value === item.fullPath && { color: '#00D1B2', fontWeight: 'bold' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity 
                  style={[styles.modalOption, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} 
                  onPress={() => {
                    if (item.hasSub) {
                      setNavPath([...navPath, item.label]);
                    } else {
                      handleSelect(item.fullPath);
                    }
                  }}
                >
                  <Text style={[styles.modalOptionText, value === item.fullPath && { color: '#00D1B2', fontWeight: 'bold' }]}>
                    {item.label}
                  </Text>
                  {item.hasSub && <Text style={{ color: '#00D1B2', fontSize: 14 }}>›</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default CategoryPickerModal;
