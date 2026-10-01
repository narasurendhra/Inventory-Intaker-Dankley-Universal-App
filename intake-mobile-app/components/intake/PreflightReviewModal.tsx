import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Switch, TextInput, ActivityIndicator } from 'react-native';
import styles from '@/styles/intakeStyles';
import { autoAssignDeliveryRoute, isUnitDosedCategory, getEffectiveSativa } from '@/utils/posTaxonomy';

export interface PreflightReviewModalProps {
  visible: boolean;
  previewData: any[] | null;
  isSubmitting: boolean;
  jobState: any;
  printSettings: Record<string, { enabled?: boolean; quantity?: number | string }>;
  onUpdatePrintSetting: (uid: string, setting: { enabled?: boolean; quantity?: number | string }) => void;
  onClose: () => void;
  onGenerateDryRun: () => void;
  onSubmit: () => void;
}

export const PreflightReviewModal: React.FC<PreflightReviewModalProps> = ({
  visible,
  previewData,
  isSubmitting,
  jobState,
  printSettings,
  onUpdatePrintSetting,
  onClose,
  onGenerateDryRun,
  onSubmit
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '100%', maxHeight: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: 60 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pre-Flight Review</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#ccc', marginBottom: 15 }}>Review the exact actions Alleaves will take before finalizing.</Text>

          <ScrollView style={{ flex: 1, marginBottom: 15 }}>
            {previewData?.map((item, idx) => (
              <View key={idx} style={{ backgroundColor: '#242424', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: item.already_imported ? '#888' : (item.exists ? '#34C759' : '#00D1B2') }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20, marginBottom: 8, lineHeight: 28 }}>Item #{idx + 1}: {item.slug}</Text>
                <Text style={{ color: '#aaa', fontSize: 15, marginBottom: 8 }}>UID: {item.uid}</Text>
                {item.already_imported ? (
                  <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}>✅ Already Imported</Text>
                ) : item.exists ? (
                  <Text style={{ color: '#34C759', fontWeight: 'bold', fontSize: 16 }}>🔗 Linking to Existing {item.isSample ? 'Sample' : 'Retail'} Product (ID: {item.id_item})</Text>
                ) : item.isSample ? (
                  <Text style={{ color: '#00D1B2', fontWeight: 'bold', fontSize: 16 }}>✨ Creating New Sample Product</Text>
                ) : (
                  <Text style={{ color: '#00D1B2', fontWeight: 'bold', fontSize: 16 }}>✨ Creating New Master Product</Text>
                )}
                {item.sample_override_notice && (
                  <Text style={{ color: '#FFD60A', fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>
                    ⚠️ {item.sample_override_notice}
                  </Text>
                )}

                {/* Full Field Transparency Badges */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {item.category && (
                    <View style={{ backgroundColor: '#181818', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#bbb', fontSize: 12 }}>{item.category}</Text>
                    </View>
                  )}
                  {(item.delivery_route || item.category) && (
                    <View style={{ backgroundColor: '#181818', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#38BDF8', fontSize: 12 }}>
                        Route: {item.delivery_route || autoAssignDeliveryRoute(item.category, item.product_format)}
                      </Text>
                    </View>
                  )}
                  {(item.weight_useable !== undefined || item.parsed_weight_useable !== undefined || item.uom_weight_useable) && (
                    <View style={{ backgroundColor: '#181818', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#F472B6', fontSize: 12 }}>
                        Weight: {item.weight_useable ?? item.parsed_weight_useable ?? (isUnitDosedCategory(item.category, item.product_format) ? 100 : 1)} {item.uom_weight_useable || (isUnitDosedCategory(item.category, item.product_format) ? 'Milligrams' : 'Grams')}
                      </Text>
                    </View>
                  )}
                  {(item.costOfGoods !== undefined || item.wholesale_cost !== undefined || item.retailPrice !== undefined) && (
                    <View style={{ backgroundColor: '#181818', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#00D1B2', fontSize: 12 }}>
                        Cost: ${item.costOfGoods || item.wholesale_cost || '0.00'} | Retail: ${parseFloat(item.retailPrice || 0).toFixed(4)} (${parseFloat(item.price_otd || (parseFloat(item.retailPrice || 0) * 1.13)).toFixed(2)} OTD)
                      </Text>
                    </View>
                  )}
                  {(item.item_thc !== undefined || item.thc_pct !== undefined || item.thc_mg !== undefined) && (
                    <View style={{ backgroundColor: '#181818', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#FFD60A', fontSize: 12 }}>
                        THC: {isUnitDosedCategory(item.category, item.product_format) ? `${item.thc_mg ?? item.item_thc ?? 0}mg` : `${item.thc_pct ?? item.item_thc ?? 0}%`} | CBD: {isUnitDosedCategory(item.category, item.product_format) ? `${item.cbd_mg ?? item.item_cbd ?? 0}mg` : `${item.cbd_pct ?? item.item_cbd ?? 0}%`}
                      </Text>
                    </View>
                  )}
                  {item.strain_type && (
                    <View style={{ backgroundColor: '#181818', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#34C759', fontSize: 12 }}>
                        {item.strain_type} ({(() => {
                          const s = getEffectiveSativa(item);
                          return `${s}% S / ${100 - s}% I`;
                        })()})
                      </Text>
                    </View>
                  )}
                  {item.servings && (
                    <View style={{ backgroundColor: '#181818', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#333' }}>
                      <Text style={{ color: '#A78BFA', fontSize: 12 }}>
                        {item.servings} Servings ({item.dosage_recommended || 'Standard Dose'})
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#444', paddingTop: 10 }}>
                  <Switch 
                    value={printSettings[item.uid]?.enabled ?? false} 
                    onValueChange={(val) => onUpdatePrintSetting(item.uid, { enabled: val })}
                    trackColor={{ false: '#767577', true: '#00D1B2' }}
                    thumbColor="#f4f3f4"
                  />
                  <Text style={{ color: '#fff', marginLeft: 10, fontSize: 16 }}>Print Label?</Text>
                  
                  {(printSettings[item.uid]?.enabled ?? false) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
                      <Text style={{ color: '#aaa', fontSize: 12, marginRight: 8 }}>Qty:</Text>
                      <TextInput 
                        style={{ backgroundColor: '#111', color: '#fff', padding: 8, borderRadius: 6, width: 60, textAlign: 'center', fontSize: 16 }}
                        value={String(printSettings[item.uid]?.quantity ?? (item.isSample ? (item.metrc_quantity || 1) : Math.ceil((item.metrc_quantity || 1) / 10)))}
                        onChangeText={(val) => {
                          const parsed = parseInt(val, 10);
                          onUpdatePrintSetting(item.uid, { quantity: isNaN(parsed) ? val : parsed });
                        }}
                        keyboardType="number-pad"
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {isSubmitting ? (
            <View style={{ backgroundColor: '#111', padding: 20, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#333' }}>
              <Text style={{ color: '#00D1B2', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
                Pipeline Checkpoints
              </Text>
              
              {(() => {
                const currentStep = jobState?.step || (
                  jobState?.status === 'COMPLETED' ? 6 :
                  (jobState?.status === 'PRINT_COMPLETE' || jobState?.status === 'PRINTING_TAGS' || jobState?.status === 'ARCHIVING') ? 5 :
                  (jobState?.status === 'VENDOR_SYNC_COMPLETE' || jobState?.status === 'VENDOR_SYNCING') ? 4 :
                  (jobState?.status === 'IMPORT_COMPLETE' || jobState?.status === 'IMPORTING') ? 3 :
                  (jobState?.status === 'RESOLVED_METRC' || jobState?.status === 'RESOLVING_METRC' || jobState?.status === 'PREFLIGHT_COMPLETE') ? 2 :
                  1
                );

                const getStepUI = (stepNum: number) => {
                  if (jobState?.status === 'COMPLETED' || currentStep > stepNum) {
                    return { icon: '✅', textColor: '#fff' };
                  }
                  if (currentStep === stepNum) {
                    return { icon: '⏳', textColor: '#00D1B2' };
                  }
                  return { icon: '⭕', textColor: '#777' };
                };

                const steps = [
                  { num: 1, label: 'Provisioning Brands & Strains' },
                  { num: 2, label: 'Resolving METRC Package Details' },
                  { num: 3, label: 'Importing & Relinking Metrc Packages' },
                  { num: 4, label: 'Syncing Vendor Information' },
                  { num: 5, label: 'Printing Package Labels & Archiving' },
                ];

                return (
                  <>
                    {steps.map(s => {
                      const ui = getStepUI(s.num);
                      return (
                        <View key={s.num} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                          <Text style={{ marginRight: 15, fontSize: 20 }}>{ui.icon}</Text>
                          <Text style={{ color: ui.textColor, fontSize: 16, fontWeight: ui.icon === '⏳' ? 'bold' : 'normal' }}>
                            {s.label}
                          </Text>
                        </View>
                      );
                    })}

                    <View style={{ marginTop: 12, padding: 10, backgroundColor: '#1a1a1a', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color="#00D1B2" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#00D1B2', fontSize: 13, fontWeight: 'bold' }}>
                        {jobState?.progress || 'Executing intake pipeline...'}
                      </Text>
                    </View>
                  </>
                );
              })()}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 }}>
              <TouchableOpacity style={[styles.approveBtn, { flex: 1, marginRight: 5, backgroundColor: '#555' }]} onPress={onGenerateDryRun}>
                <Text style={[styles.analyzeBtnText, { fontSize: 13 }]}>Dry Run (Log Payload)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.approveBtn, { flex: 1.5, marginLeft: 5 }]} onPress={onSubmit}>
                <Text style={styles.analyzeBtnText}>Finalize & Submit 🚀</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PreflightReviewModal;
