import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { CameraView } from 'expo-camera';
import styles from '@/styles/intakeStyles';

export interface IntakeCameraModalProps {
  visible: boolean;
  captureTarget: 'intake' | 'barcode' | null;
  isTorchOn: boolean;
  cameraRef: React.RefObject<any>;
  intakeImagesCount: number;
  onToggleTorch: () => void;
  onCapturePhoto: () => void;
  onBarcodeScanned?: (event: { type: string; data: string }) => void;
  onClose: () => void;
}

export const IntakeCameraModal: React.FC<IntakeCameraModalProps> = ({
  visible,
  captureTarget,
  isTorchOn,
  cameraRef,
  intakeImagesCount,
  onToggleTorch,
  onCapturePhoto,
  onBarcodeScanned,
  onClose
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={isTorchOn}
          ratio="16:9"
          ref={cameraRef}
          barcodeScannerSettings={captureTarget === 'barcode' ? { barcodeTypes: ['code128'] } : undefined}
          onBarcodeScanned={captureTarget === 'barcode' ? onBarcodeScanned : undefined}
        />
        <View style={styles.buttonContainer}>
          {captureTarget !== 'barcode' && (
            <TouchableOpacity style={styles.captureButton} onPress={onCapturePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.buttonText}>{captureTarget === 'intake' && intakeImagesCount > 0 ? 'Done' : 'Cancel'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.flashBtn, { zIndex: 99, elevation: 10 }]} onPress={onToggleTorch}>
          <Text style={styles.btnText}>{isTorchOn ? '🔦 Torch On' : '🔦 Torch Off'}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default IntakeCameraModal;
