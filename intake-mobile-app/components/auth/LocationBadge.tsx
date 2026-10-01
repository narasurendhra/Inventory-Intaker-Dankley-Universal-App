import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { authService, DankleyUser } from '../../services/authService';

interface LocationBadgeProps {
  currentUser?: DankleyUser | null;
  onUserChanged?: (user: DankleyUser) => void;
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({ currentUser, onUserChanged }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const user = currentUser || authService.getCurrentUser();

  const handleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await authService.login(emailInput);
    setLoading(false);

    if (res.success && res.user) {
      if (onUserChanged) onUserChanged(res.user);
      setModalVisible(false);
      setEmailInput('');
    } else {
      setErrorMsg(res.error || 'Authentication failed');
    }
  };

  const getPosBadgeColor = (posType: string = 'mock') => {
    switch (posType) {
      case 'dutchie': return '#3B82F6'; // Blue
      case 'blaze': return '#F97316';   // Orange
      case 'alleaves': return '#10B981'; // Green
      default: return '#8B5CF6';        // Purple for sandbox
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.badgeContainer} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.leftCol}>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {user?.locationName || 'Dankley Universal'}
          </Text>
          <Text style={styles.userText} numberOfLines={1}>
            {user?.email || 'Tap to sign in'}
          </Text>
        </View>
        <View style={[styles.posTag, { backgroundColor: getPosBadgeColor(user?.posType) }]}>
          <Text style={styles.posTagText}>
            {(user?.posType || 'POS').toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dankley Operator Sign-In</Text>
            <Text style={styles.modalSubtitle}>
              Enter your verified @dankley.com email to automatically sync your store and POS settings.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="operator@dankley.com"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailInput}
              onChangeText={setEmailInput}
            />

            {errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.submitBtn]} 
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>{loading ? 'Verifying...' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickAccounts}>
              <Text style={styles.quickHeader}>Quick Switch (Demo):</Text>
              <TouchableOpacity onPress={() => setEmailInput('queens@dankley.com')}>
                <Text style={styles.quickLink}>• Queens (Alleaves)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEmailInput('dutchie@dankley.com')}>
                <Text style={styles.quickLink}>• Manhattan (Dutchie)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEmailInput('blaze.dev@dankley.com')}>
                <Text style={styles.quickLink}>• Queens Blaze (Blaze POS)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  userText: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  posTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  posTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#AAA',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelBtn: {
    backgroundColor: '#333',
  },
  cancelBtnText: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#00D1B2',
  },
  submitBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quickAccounts: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    paddingTop: 12,
  },
  quickHeader: {
    color: '#777',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  quickLink: {
    color: '#00D1B2',
    fontSize: 12,
    paddingVertical: 3,
  },
});
