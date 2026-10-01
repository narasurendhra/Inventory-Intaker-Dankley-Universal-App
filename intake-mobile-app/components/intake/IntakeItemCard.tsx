import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import SearchableDropdown from './SearchableDropdown';
import styles from '@/styles/intakeStyles';
import {
  isUnitDosedCategory,
  getEffectiveSativa,
  generateCleanSlug,
  getFullCategoryTree,
  getBrandCatalogList,
  extractSlugString
} from '@/utils/posTaxonomy';

export interface IntakeItemCardProps {
  item: any;
  index: number;
  brandItems: Record<string, any[]>;
  liveBrands: string[];
  liveStrains: any[];
  activeSlugIndex: number | null;
  fetchingCostIndex?: number | null;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onDeleteItem: (index: number) => void;
  onApplyBrandAll: (brand: string) => void;
  onApplyBrandNext: (brand: string, index: number) => void;
  onFetchPackageCost: (index: number, uid: string) => void;
  onScanBarcode: (index: number) => void;
  onOpenCategoryModal: (index: number) => void;
  onSetActiveSlugIndex: (index: number | null) => void;
}

export const IntakeItemCard: React.FC<IntakeItemCardProps> = ({
  item,
  index,
  brandItems,
  liveBrands,
  liveStrains,
  activeSlugIndex,
  onUpdateItem,
  onDeleteItem,
  onApplyBrandAll,
  onApplyBrandNext,
  onFetchPackageCost,
  onScanBarcode,
  onOpenCategoryModal,
  onSetActiveSlugIndex
}) => {
  const effectiveSativa = Math.min(100, Math.max(0, getEffectiveSativa(item)));
  const strainColor = effectiveSativa >= 60 ? '#FF9500' : effectiveSativa <= 40 ? '#AF52DE' : '#00D1B2';
  const isEdible = isUnitDosedCategory(item.category, item.product_format);

  return (
    <View style={styles.itemCard}>
      <View style={[styles.splitRow, { alignItems: 'center', marginBottom: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => onDeleteItem(index)} style={{ paddingRight: 8 }}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
          <Text style={[styles.itemHeader, { marginBottom: 0, color: strainColor }]}>
            Item #{index + 1}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.label, { marginTop: 0, marginRight: 8 }]}>Is Sample?</Text>
          <Switch
            value={item.isSample || false}
            onValueChange={(val) => onUpdateItem(index, 'isSample', val)}
            trackColor={{ false: '#767577', true: '#00D1B2' }}
            thumbColor={item.isSample ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <View style={{ flex: 2.2, marginRight: 8 }}>
          <Text style={[styles.label, { marginTop: 0 }]}>Metrc UID</Text>
          <View style={{ justifyContent: 'center', marginBottom: item.already_imported ? 6 : 0 }}>
            <TextInput
              style={[styles.input, { paddingRight: 40, fontSize: 12, letterSpacing: 0.5, paddingVertical: 8 }]}
              value={item.uid}
              onChangeText={(val) => onUpdateItem(index, 'uid', val)}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 8, padding: 4 }}
              onPress={() => onScanBarcode(index)}
            >
              <MaterialCommunityIcons name="barcode-scan" size={20} color="#00D1B2" />
            </TouchableOpacity>
          </View>
          {item.already_imported && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: '#003311', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: '#34C759' }}>
              <Text style={{ color: '#34C759', fontSize: 11, fontWeight: 'bold' }}>✓ ALREADY IMPORTED</Text>
            </View>
          )}
          {(item.alleaves_match_type === 'clone_override' || item.clone_parent_id) && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: '#1E1B4B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: '#6366F1' }}>
              <Text style={{ color: '#A5B4FC', fontSize: 10, fontWeight: 'bold' }}>
                🔄 Alleaves Auto-Match: Clones from Shell #{item.clone_parent_id}
              </Text>
            </View>
          )}
          {(item.alleaves_match_type === 'exact' || item.is_alleaves_exact_auto_match) && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: '#00261a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: '#00D1B2' }}>
              <Text style={{ color: '#00D1B2', fontSize: 10, fontWeight: 'bold' }}>
                🔗 Alleaves Auto-Match (Shell #{item.alleaves_auto_match_id || item.alleaves_cached_link_id})
              </Text>
            </View>
          )}
        </View>
        {!item.already_imported && (
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { marginTop: 0 }]}>Exp (MM/DD/YY)</Text>
            <TextInput
              style={[styles.input, { textAlign: 'center', fontSize: 13, letterSpacing: 0.5, paddingVertical: 8 }]}
              value={item.expirationDate || ''}
              onChangeText={(val) => {
                let cleaned = val.replace(/\D/g, '');
                if (cleaned.length > 6) cleaned = cleaned.substring(0, 6);
                let formatted = cleaned;
                if (cleaned.length > 4) formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4)}`;
                else if (cleaned.length > 2) formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
                onUpdateItem(index, 'expirationDate', formatted);
              }}
              placeholder="MM/DD/YY"
              placeholderTextColor="#555"
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {!item.already_imported && (
        <>
          <View style={[styles.splitRow, { marginBottom: 10 }]}>
            <View style={{ flex: 1.2, marginRight: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 2 }}>
                <Text style={[styles.label, { marginBottom: 0, marginTop: 0 }]}>Cost</Text>
                <TouchableOpacity onPress={() => onFetchPackageCost(index, item.uid)}>
                  <Text style={{ color: '#00D1B2', fontSize: 10, fontWeight: 'bold' }}>↻ Pull</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { paddingVertical: 8, fontSize: 13 }]}
                value={item.costOfGoods || ''}
                onChangeText={(val) => onUpdateItem(index, 'costOfGoods', val)}
                keyboardType="numeric"
                placeholder="$0.00"
              />
            </View>
            <View style={{ flex: 1.2, marginHorizontal: 4 }}>
              <Text style={[styles.label, { marginTop: 0, marginBottom: 2 }]}>Retail</Text>
              <TextInput
                style={[styles.input, { paddingVertical: 8, fontSize: 13 }]}
                value={item.retailPrice !== undefined && item.retailPrice !== null ? String(item.retailPrice) : ''}
                onChangeText={(val) => onUpdateItem(index, 'retailPrice', val)}
                keyboardType="numeric"
                placeholder="$0.00"
              />
              <Text style={{ color: '#888', fontSize: 9, marginTop: 2, textAlign: 'center' }}>
                OTD: ${(parseFloat(item.retailPrice || 0) * 1.13).toFixed(2)}
              </Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <Text style={[styles.label, { marginTop: 0, marginBottom: 2 }]}>
                THC {isEdible ? '(mg)' : '(%)'}
              </Text>
              <TextInput
                style={[styles.input, { paddingVertical: 8, fontSize: 13 }]}
                value={isEdible
                  ? (item.thc_mg !== undefined && item.thc_mg !== null && item.thc_mg !== '' ? String(item.thc_mg) : (item.item_thc !== undefined && item.item_thc !== null && item.item_thc !== '' ? String(item.item_thc) : ''))
                  : (item.thc_pct !== undefined && item.thc_pct !== null && item.thc_pct !== '' ? String(item.thc_pct) : (item.item_thc !== undefined && item.item_thc !== null && item.item_thc !== '' ? String(item.item_thc) : ''))
                }
                onChangeText={(val) => onUpdateItem(index, isEdible ? 'thc_mg' : 'thc_pct', val)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text style={[styles.label, { marginTop: 0, marginBottom: 2 }]}>
                CBD {isEdible ? '(mg)' : '(%)'}
              </Text>
              <TextInput
                style={[styles.input, { paddingVertical: 8, fontSize: 13 }]}
                value={isEdible
                  ? (item.cbd_mg !== undefined && item.cbd_mg !== null && item.cbd_mg !== '' ? String(item.cbd_mg) : (item.item_cbd !== undefined && item.item_cbd !== null && item.item_cbd !== '' ? String(item.item_cbd) : ''))
                  : (item.cbd_pct !== undefined && item.cbd_pct !== null && item.cbd_pct !== '' ? String(item.cbd_pct) : (item.item_cbd !== undefined && item.item_cbd !== null && item.item_cbd !== '' ? String(item.item_cbd) : ''))
                }
                onChangeText={(val) => onUpdateItem(index, isEdible ? 'cbd_mg' : 'cbd_pct', val)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.splitRow}>
            <View style={{ flex: 1, marginRight: 5, zIndex: 1000 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 }}>
                <Text style={[styles.label, { marginBottom: 0 }]}>Brand</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => onApplyBrandAll(item.brand)}>
                    <Text style={{ color: '#00D1B2', fontSize: 11, fontWeight: 'bold' }}>Apply All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => onApplyBrandNext(item.brand, index)}>
                    <Text style={{ color: '#FF9F0A', fontSize: 11, fontWeight: 'bold' }}>Apply Next ↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <SearchableDropdown
                placeholder="Search Brand..."
                value={item.brand}
                options={liveBrands}
                onSelect={(val) => onUpdateItem(index, 'brand', val)}
              />
              <Text style={{ color: item.target_brand_exists ? '#34C759' : '#FF9F0A', fontSize: 10, fontWeight: 'bold', marginTop: -10, marginBottom: 15 }}>
                {item.target_brand_exists ? `✓ Brand '${item.brand}' Exists` : `⚠ Brand '${item.brand}' Will Be Created`}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={[styles.input, { marginBottom: 5 }]}
                value={item.category_input !== undefined ? item.category_input : (item.category && item.category.includes('>') ? item.category.split('>').pop().trim() : item.category)}
                onChangeText={(val) => onUpdateItem(index, 'category_input', val)}
              />
              <TouchableOpacity onPress={() => onOpenCategoryModal(index)}>
                <Text style={{ color: '#00D1B2', fontSize: 10, fontWeight: 'bold', marginBottom: 15 }} numberOfLines={1}>
                  {getFullCategoryTree(item.category) || item.category || 'Tap to select Alleaves Category'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Strain / Flavor</Text>
          <TextInput
            style={[styles.input, { marginBottom: 6 }]}
            value={item.strain}
            onChangeText={(val) => onUpdateItem(index, 'strain', val)}
          />
          
          <View style={{ marginBottom: 4 }}>
            <Slider
              containerStyle={{ width: '100%', height: 20 }}
              trackStyle={{ height: 6, borderRadius: 3 }}
              thumbStyle={{ height: 16, width: 16, borderRadius: 8, backgroundColor: strainColor }}
              minimumValue={0}
              maximumValue={100}
              step={5}
              trackClickable={false}
              value={effectiveSativa}
              onValueChange={(val: any) => {
                const numericVal = Math.min(100, Math.max(0, Array.isArray(val) ? val[0] : Number(val)));
                onUpdateItem(index, 'pctSativa', numericVal);
              }}
              minimumTrackTintColor={strainColor}
              maximumTrackTintColor="#1A1A1A"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
            <Text style={{ color: item.target_strain_exists ? '#34C759' : '#FF9F0A', fontSize: 10, fontWeight: 'bold', flex: 1, paddingRight: 10 }}>
              {item.target_strain_exists ? `✓ Strain '${item.target_strain_name || item.strain}' Exists` : `⚠ Strain '${item.target_strain_name || `${(item.strain || '').replace(/\s*\([^)]*\)\s*$/, '').trim()} (${item.brand})`}' Will Be Created`}
            </Text>
            
            <Text style={{ color: strainColor, fontSize: 10, fontWeight: 'bold', textAlign: 'right' }}>
              {item.strain_type || (effectiveSativa >= 90 ? 'Sativa' : effectiveSativa >= 60 ? 'Sativa Leaning Hybrid' : effectiveSativa > 40 ? 'Hybrid' : effectiveSativa > 10 ? 'Indica Leaning Hybrid' : 'Indica')} • {100 - effectiveSativa}% I / {effectiveSativa}% S
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Target Alleaves Item</Text>
            {item.proposedSlug !== generateCleanSlug(item) && (
              <TouchableOpacity 
                onPress={() => {
                  onUpdateItem(index, 'proposedSlug', generateCleanSlug(item));
                  onSetActiveSlugIndex(null);
                }} 
                style={{ backgroundColor: '#3A3A3A', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, marginRight: 5 }}
              >
                <Text style={{ color: '#E0E0E0', fontSize: 10, fontWeight: 'bold' }}>↻ Reset Auto-Gen</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput 
            style={[styles.input, styles.highlightInput, { marginBottom: 5, backgroundColor: '#222' }]} 
            value={item.proposedSlug} 
            onChangeText={(val) => {
              onUpdateItem(index, 'proposedSlug', val);
              if (activeSlugIndex !== index) onSetActiveSlugIndex(index);
            }} 
            onFocus={() => onSetActiveSlugIndex(index)}
            onTouchStart={() => onSetActiveSlugIndex(index)}
            placeholder="Type custom name or select existing below..."
            placeholderTextColor="#666"
            multiline 
          />
          
          {activeSlugIndex === index && (() => {
            const catalogList = getBrandCatalogList(brandItems, item.brand);
            const brandStopwords = ['by', 'definition'];
            const rawTokens = String(item.proposedSlug || '').replace(/\|/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);
            const searchTokens = rawTokens.filter(t => !brandStopwords.includes(t));
            const filtered = catalogList
              .map(p => extractSlugString(p))
              .filter((slugStr): slugStr is string => Boolean(slugStr && typeof slugStr === 'string'))
              .filter(slugStr => {
                if (searchTokens.length === 0) return true;
                const targetSlug = slugStr.toLowerCase();
                return searchTokens.every(token => targetSlug.includes(token)) ||
                       (searchTokens.some(token => token.length >= 3 && targetSlug.includes(token)));
              })
              .sort((a, b) => {
                if (searchTokens.length === 0) return 0;
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                const aMatches = searchTokens.filter(t => aLower.includes(t)).length;
                const bMatches = searchTokens.filter(t => bLower.includes(t)).length;
                return bMatches - aMatches;
              });

            return (
              <View style={{ backgroundColor: '#2A2A2A', borderRadius: 8, marginBottom: 10, maxHeight: 180, overflow: 'hidden', borderWidth: 1, borderColor: '#00D1B2' }}>
                <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always">
                  {filtered.length > 0 ? (
                    filtered.map((slugStr, slugIdx) => (
                      <TouchableOpacity 
                        key={slugIdx} 
                        style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#3A3A3A' }}
                        onPress={() => {
                          onUpdateItem(index, 'proposedSlug', slugStr);
                          onSetActiveSlugIndex(null);
                        }}
                      >
                        <Text style={{ color: '#E0E0E0', fontSize: 12 }}>{slugStr}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ padding: 10, color: '#888', fontSize: 12 }}>
                      {catalogList.length === 0 ? `No catalog items found in POS for ${item.brand || 'this brand'}.` : 'No items match your search.'}
                    </Text>
                  )}
                </ScrollView>
              </View>
            );
          })()}

          {(item.native_match_name || item.alleaves_auto_match_name || item.target_item_exists) && !item.force_new_shell && (
            <View style={{ backgroundColor: item.sample_override_notice ? '#2C1D05' : '#1A3324', padding: 8, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: item.sample_override_notice ? '#FF9F0A' : '#00D1B2' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: item.sample_override_notice ? '#FF9F0A' : '#00D1B2', fontSize: 11, fontWeight: 'bold' }}>
                  {item.sample_override_notice ? '⚠️ Alleaves Auto-Match (Sample Suggested):' : '🟢 Alleaves Auto-Match:'}
                </Text>
                <TouchableOpacity 
                  onPress={() => onUpdateItem(index, 'force_new_shell', true)}
                  style={{ backgroundColor: '#442222', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }}
                >
                  <Text style={{ color: '#FF7B7B', fontSize: 10, fontWeight: 'bold' }}>✕ Unlink (New Shell)</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>
                {item.alleaves_auto_match_name || item.native_match_name || item.target_item_name} (ID: {item.alleaves_auto_match_id || item.native_match_id || item.target_item_id || 'Pending'})
              </Text>
              {item.sample_override_notice && (
                <Text style={{ color: '#FFD60A', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                  {item.sample_override_notice}
                </Text>
              )}
            </View>
          )}

          {item.force_new_shell && (
            <View style={{ backgroundColor: '#2C1500', padding: 8, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#FF9500', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FF9500', fontSize: 11, fontWeight: 'bold' }}>
                🔓 Manually Unlinked (New Shell Will Be Created)
              </Text>
              <TouchableOpacity 
                onPress={() => onUpdateItem(index, 'force_new_shell', false)}
                style={{ backgroundColor: '#1A3324', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }}
              >
                <Text style={{ color: '#00D1B2', fontSize: 10, fontWeight: 'bold' }}>↻ Re-match</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={{ color: item.target_item_exists ? '#34C759' : '#FF9F0A', fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>
            {item.target_item_exists 
              ? (item.isSample ? (item.target_sample_exists ? "✓ Existing Sample Item Found" : "✓ Parent Shell Found (Sample Will Be Cloned)") : "✓ Existing Retail Item Found") 
              : (item.isSample ? "⚠ New Sample Item Shell Will Be Created" : "⚠ New Retail Item Shell Will Be Created")}
          </Text>
          <Text style={{ color: '#aaa', fontSize: 11, marginBottom: 8 }}>
            Alleaves Target Item: {item.isSample ? item.target_sample_name : (item.target_item_name || item.proposedSlug)}
            {'\n'}Parsed Weight: {item.parsed_weight_useable} {item.parsed_uom} | Store Unit: {item.uom}
          </Text>
        </>
      )}
    </View>
  );
};

export default IntakeItemCard;
