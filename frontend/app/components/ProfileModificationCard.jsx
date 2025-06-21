import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/fetchNgrok';

export default function ProfileModificationCard({ modification, onApprove, onReject, onRefresh }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleApprove = async () => {
    Alert.alert(
      'Approuver la modification',
      'Êtes-vous sûr de vouloir approuver cette modification de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Erreur', 'Token non trouvé');
                return;
              }

              const response = await fetch(`${BASE_URL}/api/profile-modifications/approve/${modification.id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Modification approuvée et appliquée');
                onApprove && onApprove(modification.id);
                onRefresh && onRefresh();
              } else {
                const errorData = await response.json();
                Alert.alert('Erreur', errorData.error || 'Impossible d\'approuver la modification');
              }
            } catch (error) {
              console.error('Erreur approbation:', error);
              Alert.alert('Erreur', 'Erreur lors de l\'approbation');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Rejeter la modification',
      'Êtes-vous sûr de vouloir rejeter cette modification de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Erreur', 'Token non trouvé');
                return;
              }

              const response = await fetch(`${BASE_URL}/api/profile-modifications/reject/${modification.id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                Alert.alert('Succès', 'Modification rejetée');
                onReject && onReject(modification.id);
                onRefresh && onRefresh();
              } else {
                const errorData = await response.json();
                Alert.alert('Erreur', errorData.error || 'Impossible de rejeter la modification');
              }
            } catch (error) {
              console.error('Erreur rejet:', error);
              Alert.alert('Erreur', 'Erreur lors du rejet');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const hasChanges = () => {
    return (
      modification.old_nom !== modification.new_nom ||
      modification.old_prenom !== modification.new_prenom ||
      modification.old_email !== modification.new_email ||
      modification.old_telephone !== modification.new_telephone ||
      modification.old_date_naissance !== modification.new_date_naissance ||
      modification.old_image_url !== modification.new_image_url
    );
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.aidantInfo}>
            <Image
              source={
                modification.current_image_url 
                  ? { uri: `${BASE_URL}/${modification.current_image_url}` }
                  : require('../../assets/default-avatar.png')
              }
              style={styles.aidantImage}
            />
            <View>
              <Text style={styles.aidantName}>
                {modification.current_nom} {modification.current_prenom}
              </Text>
              <Text style={styles.modificationDate}>
                Modifié le {formatDate(modification.created_at)}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => setShowDetails(true)}
          >
            <Ionicons name="eye" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.changesSummary}>
          <MaterialIcons name="edit" size={20} color="#FF9800" />
          <Text style={styles.changesText}>
            Demande de modification de profil
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={handleApprove}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.actionButtonText}>...</Text>
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.actionButtonText}>Approuver</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.actionButtonText}>...</Text>
            ) : (
              <>
                <Ionicons name="close" size={16} color="white" />
                <Text style={styles.actionButtonText}>Rejeter</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de détails */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails des modifications</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.comparisonContainer}>
                <View style={styles.column}>
                  <Text style={styles.columnTitle}>Avant</Text>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Nom</Text>
                    <Text style={styles.fieldValue}>{modification.old_nom}</Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Prénom</Text>
                    <Text style={styles.fieldValue}>{modification.old_prenom}</Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <Text style={styles.fieldValue}>{modification.old_email}</Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Téléphone</Text>
                    <Text style={styles.fieldValue}>{modification.old_telephone}</Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Date de naissance</Text>
                    <Text style={styles.fieldValue}>{formatDate(modification.old_date_naissance)}</Text>
                  </View>
                </View>

                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={24} color="#007AFF" />
                </View>

                <View style={styles.column}>
                  <Text style={styles.columnTitle}>Après</Text>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Nom</Text>
                    <Text style={[
                      styles.fieldValue,
                      modification.old_nom !== modification.new_nom && styles.changedValue
                    ]}>
                      {modification.new_nom}
                    </Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Prénom</Text>
                    <Text style={[
                      styles.fieldValue,
                      modification.old_prenom !== modification.new_prenom && styles.changedValue
                    ]}>
                      {modification.new_prenom}
                    </Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <Text style={[
                      styles.fieldValue,
                      modification.old_email !== modification.new_email && styles.changedValue
                    ]}>
                      {modification.new_email}
                    </Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Téléphone</Text>
                    <Text style={[
                      styles.fieldValue,
                      modification.old_telephone !== modification.new_telephone && styles.changedValue
                    ]}>
                      {modification.new_telephone}
                    </Text>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Date de naissance</Text>
                    <Text style={[
                      styles.fieldValue,
                      modification.old_date_naissance !== modification.new_date_naissance && styles.changedValue
                    ]}>
                      {formatDate(modification.new_date_naissance)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aidantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aidantImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  aidantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modificationDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detailsButton: {
    padding: 5,
  },
  changesSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  changesText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    gap: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  modalContent: {
    padding: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  changedValue: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
}); 