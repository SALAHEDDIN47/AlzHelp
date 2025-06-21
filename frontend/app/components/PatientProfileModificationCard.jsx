import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BASE_URL } from '../../utils/fetchNgrok';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PatientProfileModificationCard = ({ modification, onApprove, onReject, onRefresh }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (isoString) => {
    if (!isoString) return 'Non spécifiée';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/patient-profile-modifications/approve/${modification.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Succès', 'Modification approuvée');
        onApprove(modification.id);
        setModalVisible(false);
        if (onRefresh) onRefresh();
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.error || 'Impossible d\'approuver la modification');
      }
    } catch (error) {
      console.error('Erreur approbation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/patient-profile-modifications/reject/${modification.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Succès', 'Modification rejetée');
        onReject(modification.id);
        setModalVisible(false);
        if (onRefresh) onRefresh();
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.error || 'Impossible de rejeter la modification');
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderComparison = (field, oldValue, newValue, label) => {
    if (oldValue === newValue) return null;
    
    return (
      <View style={styles.comparisonRow}>
        <Text style={styles.fieldLabel}>{label}:</Text>
        <View style={styles.comparisonValues}>
          <View style={styles.oldValue}>
            <Text style={styles.oldLabel}>Ancien:</Text>
            <Text style={styles.oldText}>{oldValue || 'Non spécifié'}</Text>
          </View>
          <View style={styles.arrow}>
            <Ionicons name="arrow-forward" size={20} color="#007bff" />
          </View>
          <View style={styles.newValue}>
            <Text style={styles.newLabel}>Nouveau:</Text>
            <Text style={styles.newText}>{newValue || 'Non spécifié'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.cardHeader}>
          <Image
            source={
              modification.current_profile_image
                ? { uri: `${BASE_URL}/${modification.current_profile_image}` }
                : require('../../assets/default-avatar.png')
            }
            style={styles.patientAvatar}
          />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {modification.current_prenom} {modification.current_nom}
            </Text>
            <Text style={styles.modificationDate}>
              {formatDate(modification.created_at)}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Ionicons name="time" size={16} color="#FF9800" />
            <Text style={styles.statusText}>En attente</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.modificationTitle}>
            Demande de modification de profil
          </Text>
          <Text style={styles.modificationDescription}>
            Le patient souhaite modifier ses informations personnelles
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la modification</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.patientSection}>
                <Image
                  source={
                    modification.current_profile_image
                      ? { uri: `${BASE_URL}/${modification.current_profile_image}` }
                      : require('../../assets/default-avatar.png')
                  }
                  style={styles.modalPatientAvatar}
                />
                <Text style={styles.modalPatientName}>
                  {modification.current_prenom} {modification.current_nom}
                </Text>
                <Text style={styles.modalPatientId}>ID: {modification.patient_id}</Text>
              </View>

              <View style={styles.comparisonSection}>
                <Text style={styles.comparisonTitle}>Modifications demandées:</Text>
                
                {renderComparison('nom', modification.old_nom, modification.new_nom, 'Nom')}
                {renderComparison('prenom', modification.old_prenom, modification.new_prenom, 'Prénom')}
                {renderComparison('email', modification.old_email, modification.new_email, 'Email')}
                {renderComparison('telephone', modification.old_telephone, modification.new_telephone, 'Téléphone')}
                {renderComparison('adresse', modification.old_adresse, modification.new_adresse, 'Adresse')}
                {renderComparison('datenaissance', formatDate(modification.old_date_naissance), formatDate(modification.new_date_naissance), 'Date de naissance')}
                
                {modification.old_profile_image !== modification.new_profile_image && (
                  <View style={styles.comparisonRow}>
                    <Text style={styles.fieldLabel}>Photo de profil:</Text>
                    <View style={styles.comparisonValues}>
                      <View style={styles.oldValue}>
                        <Text style={styles.oldLabel}>Ancienne:</Text>
                        <Image
                          source={
                            modification.old_profile_image
                              ? { uri: `${BASE_URL}/${modification.old_profile_image}` }
                              : require('../../assets/default-avatar.png')
                          }
                          style={styles.comparisonImage}
                        />
                      </View>
                      <View style={styles.arrow}>
                        <Ionicons name="arrow-forward" size={20} color="#007bff" />
                      </View>
                      <View style={styles.newValue}>
                        <Text style={styles.newLabel}>Nouvelle:</Text>
                        <Image
                          source={
                            modification.new_profile_image
                              ? { uri: `${BASE_URL}/${modification.new_profile_image}` }
                              : require('../../assets/default-avatar.png')
                          }
                          style={styles.comparisonImage}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleReject}
                disabled={isProcessing}
              >
                <Ionicons name="close-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Rejeter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={handleApprove}
                disabled={isProcessing}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Approuver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modificationDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardContent: {
    marginTop: 8,
  },
  modificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modificationDescription: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  patientSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalPatientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  modalPatientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalPatientId: {
    fontSize: 14,
    color: '#666',
  },
  comparisonSection: {
    marginTop: 10,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  comparisonRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldValue: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  oldLabel: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
    marginBottom: 4,
  },
  oldText: {
    fontSize: 14,
    color: '#333',
  },
  arrow: {
    marginHorizontal: 8,
  },
  newValue: {
    flex: 1,
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  newLabel: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 4,
  },
  newText: {
    fontSize: 14,
    color: '#333',
  },
  comparisonImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PatientProfileModificationCard; 