import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/fetchNgrok';

const { width } = Dimensions.get('window');

export default function AidantNotification({ 
  visible, 
  notificationData, 
  onClose, 
  onResend,
  onDismiss 
}) {
  const [isResending, setIsResending] = useState(false);

  const handleCallPatient = () => {
    if (!notificationData?.patient?.telephone) {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible');
      return;
    }

    Alert.alert(
      'Appeler le patient',
      `Voulez-vous appeler ${notificationData.patient.nom} ${notificationData.patient.prenom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => {
            Linking.openURL(`tel:${notificationData.patient.telephone}`);
          }
        }
      ]
    );
  };

  const handleResendRappel = async () => {
    if (!notificationData?.rappel?.id) {
      Alert.alert('Erreur', 'ID du rappel non disponible');
      return;
    }

    setIsResending(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Token non trouvé');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/rappels/${notificationData.rappel.id}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          Alert.alert(
            'Rappel renvoyé',
            'Le rappel a été renvoyé au patient avec succès.',
            [{ text: 'OK' }]
          );
          onResend && onResend(notificationData.rappel.id);
        }
      } else {
        Alert.alert('Erreur', 'Impossible de renvoyer le rappel');
      }
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
      Alert.alert('Erreur', 'Erreur lors du renvoi du rappel');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    onDismiss && onDismiss();
  };

  if (!visible || !notificationData) return null;

  const { rappel, patient, statut } = notificationData;
  const isConfirmed = statut === 'confirmé';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* En-tête avec icône et statut */}
          <View style={styles.header}>
            <Ionicons 
              name={isConfirmed ? "checkmark-circle" : "alert-circle"} 
              size={40} 
              color={isConfirmed ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={styles.title}>
              {isConfirmed ? 'Rappel Confirmé' : 'Rappel Non Confirmé'}
            </Text>
          </View>

          {/* Informations du patient */}
          <View style={styles.patientSection}>
            <Text style={styles.sectionTitle}>Patient</Text>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {patient?.nom} {patient?.prenom}
              </Text>
              <Text style={styles.patientDetails}>
                {patient?.email}
              </Text>
              <Text style={styles.patientDetails}>
                {patient?.telephone}
              </Text>
            </View>
          </View>

          {/* Informations du rappel */}
          <View style={styles.rappelSection}>
            <Text style={styles.sectionTitle}>Détails du rappel</Text>
            <View style={styles.rappelInfo}>
              <Text style={styles.rappelDescription}>{rappel?.description}</Text>
              
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {rappel?.date ? new Date(rappel.date).toLocaleDateString('fr-FR') : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.detailText}>{rappel?.heure || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actions}>
            {!isConfirmed && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.callButton]}
                  onPress={handleCallPatient}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.buttonText}>Appeler le patient</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.resendButton]}
                  onPress={handleResendRappel}
                  disabled={isResending}
                >
                  {isResending ? (
                    <Text style={styles.buttonText}>Renvoyement...</Text>
                  ) : (
                    <>
                      <Ionicons name="refresh" size={20} color="white" />
                      <Text style={styles.buttonText}>Renvoyer le rappel</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={handleDismiss}
              disabled={isResending}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
              <Text style={styles.dismissText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  patientSection: {
    marginBottom: 20,
  },
  rappelSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  patientInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  rappelInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  rappelDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  details: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  resendButton: {
    backgroundColor: '#FF9800',
  },
  dismissButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
