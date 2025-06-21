import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../utils/fetchNgrok';

const { width, height } = Dimensions.get('window');

// Types de rappels avec leurs icônes et couleurs
const TYPES = [
  { 
    name: 'Médicament', 
    color: '#4CAF50', 
    lightColor: '#E8F5E9',
    icon: 'local-pharmacy',
    faIcon: 'pills'
  },
  { 
    name: 'Communication', 
    color: '#2196F3', 
    lightColor: '#E3F2FD',
    icon: 'chat',
    faIcon: 'comments'
  },
  { 
    name: 'Quotidien', 
    color: '#FF9800', 
    lightColor: '#FFF3E0',
    icon: 'schedule',
    faIcon: 'sun'
  },
  { 
    name: 'Sécurité', 
    color: '#F44336', 
    lightColor: '#FFEBEE',
    icon: 'warning',
    faIcon: 'shield-alt'
  },
  { 
    name: 'Activité', 
    color: '#9C27B0', 
    lightColor: '#F3E5F5',
    icon: 'directions-run',
    faIcon: 'gamepad'
  },
  { 
    name: 'Événement', 
    color: '#3F51B5', 
    lightColor: '#E8EAF6',
    icon: 'event',
    faIcon: 'calendar'
  },
  { 
    name: 'Rendez-vous', 
    color: '#009688', 
    lightColor: '#E0F2F1',
    icon: 'event-available',
    faIcon: 'calendar-check'
  },
  { 
    name: 'Hydratation', 
    color: '#00BCD4', 
    lightColor: '#E0F7FA',
    icon: 'opacity',
    faIcon: 'tint'
  },
  { 
    name: 'Nutrition', 
    color: '#FFC107', 
    lightColor: '#FFF8E1',
    icon: 'restaurant',
    faIcon: 'utensils'
  },
  { 
    name: 'Autres', 
    color: '#9E9E9E', 
    lightColor: '#F5F5F5',
    icon: 'more-horiz',
    faIcon: 'ellipsis-h'
  }
];

export default function RappelNotification({ 
  visible, 
  rappel, 
  onClose, 
  onConfirm,
  onDismiss 
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const speakLoopTimer = useRef(null);
  const totalDurationTimer = useRef(null);
  const [aidantInfo, setAidantInfo] = useState(null);

  useEffect(() => {
    if (visible && rappel) {
      fetchAidantInfo();
      startSpeakingLoop();
    } else {
      stopSpeakingLoop();
    }
    return () => {
      stopSpeakingLoop();
    };
  }, [visible, rappel]);

  // Fonction pour récupérer les informations de l'aidant propriétaire du rappel
  const fetchAidantInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !rappel.id_rappel) return;

      const response = await fetch(`${BASE_URL}/api/rappels/${rappel.id_rappel}/aidant-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAidantInfo(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des infos aidant:', error);
    }
  };

  // Fonction pour obtenir le type de rappel avec ses propriétés
  const getRappelType = (typeName) => {
    return TYPES.find(t => t.name === typeName) || TYPES[TYPES.length - 1]; // Retourne "Autres" par défaut
  };

  // Fonction pour personnaliser la synthèse vocale selon le type
  const getPersonalizedMessage = (rappel) => {
    const type = getRappelType(rappel.type_rappel);
    const aidantName = aidantInfo ? `${aidantInfo.prenomaidant} ${aidantInfo.nomaidant}` : 'votre aidant';
    
    switch (rappel.type_rappel) {
      case 'Médicament':
        return `Rappel médical important. Il est temps de prendre votre médicament : ${rappel.description}. Ce rappel a été créé par ${aidantName}. Veuillez confirmer la prise de ce médicament.`;
      
      case 'Communication':
        return `Rappel de communication. ${rappel.description}. ${aidantName} te propose de faire une communication. Veuillez confirmer ce rappel.`;
      
      case 'Quotidien':
        return `Rappel quotidien. ${rappel.description}. Ce rappel a été créé par ${aidantName}. Veuillez confirmer cette tâche quotidienne.`;
      
      case 'Sécurité':
        return `Rappel de sécurité important. ${rappel.description}. ${aidantName} vous demande de vérifier ce point de sécurité. Veuillez confirmer.`;
      
      case 'Activité':
        return `Rappel d'activité. ${rappel.description}. ${aidantName} vous propose cette activité. Veuillez confirmer votre participation.`;
      
      case 'Événement':
        return `Rappel d'événement. ${rappel.description}. ${aidantName} vous rappelle cet événement. Veuillez confirmer.`;
      
      case 'Rendez-vous':
        return `Rappel de rendez-vous. ${rappel.description}. ${aidantInfo ? `${aidantName} vous rappelle ce rendez-vous` : 'Ce rendez-vous a été programmé'}. Veuillez confirmer.`;
      
      case 'Hydratation':
        return `Rappel d'hydratation. ${rappel.description}. ${aidantName} vous rappelle de faire l'hydratation. Veuillez confirmer.`;
      
      case 'Nutrition':
        return `Rappel nutrition. ${rappel.description}. ${aidantName} vous rappelle de faire la nutrition. Veuillez confirmer.`;
      
      default:
        return `Rappel . ${rappel.description}. Ce rappel a été créé par ${aidantName}. Veuillez confirmer ce rappel.`;
    }
  };

  const startSpeakingLoop = () => {
    stopSpeakingLoop(); 

    const speakAndRepeat = () => {
      speakRappel().finally(() => {
        // Vérifie si la boucle n'a pas été arrêtée manuellement
        if (speakLoopTimer.current !== 'stopped') {
           speakLoopTimer.current = setTimeout(speakAndRepeat, 10000); 
        }
      });
    };

    // Lance la première lecture
    speakAndRepeat();

    // Arrêt de sécurité après 3 minutes
    totalDurationTimer.current = setTimeout(() => {
      stopSpeakingLoop();
    }, 3 * 60 * 1000);
  };

  const stopSpeakingLoop = () => {
    // Marque la boucle comme arrêtée pour éviter la récursivité
    speakLoopTimer.current = 'stopped';
    // Nettoie les timers
    if (speakLoopTimer.current && typeof speakLoopTimer.current !== 'string') {
       clearTimeout(speakLoopTimer.current);
    }
    if (totalDurationTimer.current) {
      clearTimeout(totalDurationTimer.current);
    }
    // Arrête la synthèse vocale
    Speech.stop();
  };
  
  const speakRappel = () => {
    // Retourne une promesse pour chaîner les appels
    return new Promise((resolve) => {
        if (!rappel) {
            return resolve();
        }
        
        const message = getPersonalizedMessage(rappel);
        
        Speech.speak(message, {
            language: 'fr-FR',
            rate: 0.8,
            pitch: 1.0,
            onDone: resolve, // Résout la promesse quand la lecture est finie
            onStopped: resolve, // Également en cas d'arrêt manuel
            onError: (error) => {
              console.error('Erreur synthèse vocale:', error);
              resolve(); // Résout pour ne pas bloquer la boucle
            }
        });
    });
  };

  const handleConfirm = async () => {
    if (!rappel) return;
    setIsConfirming(true);
    stopSpeakingLoop();
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Token non trouvé');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/rappels/${rappel.id_rappel}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          Alert.alert(
            'Rappel confirmé',
            'Votre rappel a été confirmé avec succès.',
            [{ text: 'OK', onPress: () => onConfirm && onConfirm(rappel.id_rappel) }]
          );
        }
      } else {
        Alert.alert('Erreur', 'Impossible de confirmer le rappel');
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      Alert.alert('Erreur', 'Erreur lors de la confirmation du rappel');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDismiss = () => {
    stopSpeakingLoop();
    onDismiss && onDismiss();
  };

  if (!visible || !rappel) return null;

  const rappelType = getRappelType(rappel.type_rappel);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { borderLeftColor: rappelType.color, borderLeftWidth: 5 }]}>
          {/* En-tête avec icône du type */}
          <View style={styles.header}>
            <MaterialIcons name={rappelType.icon} size={40} color={rappelType.color} />
            <Text style={[styles.title, { color: rappelType.color }]}>Rappel {rappel.type_rappel}</Text>
          </View>

          {/* Contenu du rappel */}
          <View style={styles.content}>
            <Text style={styles.description}>{rappel.description}</Text>
            
            <View style={styles.details}>
              {/* Date complète avec jour */}
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {new Date(new Date(rappel.date_rappel).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              
              {/* Heure formatée */}
              <View style={styles.detailRow}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {rappel.heure_rappel ? rappel.heure_rappel.substring(0, 5) : ''}
                </Text>
              </View>
              
              {/* Type de rappel */}
              <View style={styles.detailRow}>
                <MaterialIcons name={rappelType.icon} size={16} color={rappelType.color} />
                <Text style={[styles.detailText, { color: rappelType.color, fontWeight: 'bold' }]}>
                  {rappel.type_rappel}
                </Text>
              </View>

              {/* Informations de l'aidant avec lien familial */}
              {aidantInfo && (
                <View style={{alignItems: 'flex-start', marginTop: 5}}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Créé par {aidantInfo.prenomaidant} {aidantInfo.nomaidant}
                    </Text>
                  </View>
                  {aidantInfo.lien_familial && (
                    <Text style={{ marginLeft: 26, color: '#007AFF', fontSize: 14 }}>
                      ({aidantInfo.lien_familial})
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: rappelType.color }]}
              onPress={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <Text style={styles.buttonText}>Confirmation...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.buttonText}>Confirmer le rappel</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={handleDismiss}
              disabled={isConfirming}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
              <Text style={styles.dismissText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {/* Indicateur de synthèse vocale */}
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <Ionicons name="volume-high" size={16} color={rappelType.color} />
              <Text style={styles.speakingText}>Lecture en cours...</Text>
            </View>
          )}
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
  content: {
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  details: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
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
  confirmButton: {
    backgroundColor: '#007AFF',
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
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    gap: 5,
  },
  speakingText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
