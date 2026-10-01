import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '@/styles/intakeStyles';

export interface IntakeImagesSectionProps {
  images: Array<{
    localUri: string;
    status: 'pending' | 'uploading' | 'completed' | 'failed' | string;
    imageIndex: number;
    error?: string;
  }>;
  loading: boolean;
  onRetryFailed: () => void;
  onClearAll: () => void;
  onRetrySingleImage: (localUri: string) => void;
  onRemoveImage: (index: number) => void;
  onOpenCamera: () => void;
  onOpenGallery: () => void;
  onProcessIntake: () => void;
}

export const IntakeImagesSection: React.FC<IntakeImagesSectionProps> = ({
  images,
  loading,
  onRetryFailed,
  onClearAll,
  onRetrySingleImage,
  onRemoveImage,
  onOpenCamera,
  onOpenGallery,
  onProcessIntake
}) => {
  const completedCount = images.filter(i => i.status === 'completed').length;
  const uploadingCount = images.filter(i => i.status === 'uploading').length;
  const failedCount = images.filter(i => i.status === 'failed').length;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Intake Images (Manifest & Products)</Text>

        {images.length > 0 && (
          <View style={{ marginBottom: 10, padding: 8, backgroundColor: '#1E1E1E', borderRadius: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: '#00D1B2', fontSize: 12, fontWeight: 'bold' }}>
                {`Batch: ${completedCount} / ${images.length} Analyzed (${uploadingCount} active)`}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {failedCount > 0 && (
                  <TouchableOpacity onPress={onRetryFailed} style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FF9500', borderRadius: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                      {`⚡ Retry (${failedCount})`}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClearAll} style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#2A2A2A', borderRadius: 4 }}>
                  <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ height: 4, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' }}>
              <View 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#00D1B2', 
                  width: `${images.length > 0 ? (completedCount / images.length) * 100 : 0}%` 
                }} 
              />
            </View>
          </View>
        )}

        {images.length > 0 ? (
          <FlatList
            horizontal
            data={images}
            keyExtractor={(item, index) => `${item.localUri}_${index}`}
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={3}
            renderItem={({ item: imgObj, index: i }) => (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imgObj.localUri }} style={styles.thumbnail} />
                {imgObj.status === 'uploading' && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#00D1B2" />
                    <Text style={styles.statusText}>Analyzing...</Text>
                  </View>
                )}
                {imgObj.status === 'completed' && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                  </View>
                )}
                {imgObj.status === 'failed' && (
                  <TouchableOpacity 
                    style={[styles.failedBadge, { padding: 4 }]} 
                    onPress={() => onRetrySingleImage(imgObj.localUri)}
                  >
                    <Ionicons name="alert-circle" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                )}
                {imgObj.status === 'pending' && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.statusText}>Queued...</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeBtn} onPress={() => onRemoveImage(i)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>Scan Manifest & Product Packaging</Text>
          </View>
        )}
        <View style={styles.row}>
          <TouchableOpacity style={styles.actionBtn} onPress={onOpenCamera}>
            <Text style={styles.btnText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnAlt} onPress={onOpenGallery}>
            <Text style={styles.btnTextAlt}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {images.length > 0 && (
        <TouchableOpacity style={styles.analyzeBtn} onPress={onProcessIntake} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeBtnText}>Process Intake 🧠</Text>}
        </TouchableOpacity>
      )}
    </>
  );
};

export default IntakeImagesSection;
