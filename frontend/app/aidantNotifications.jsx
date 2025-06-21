import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput,
  TouchableOpacity, Image, Modal, Alert, Linking, ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/fetchNgrok';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import PatientProfileModificationCard from './components/PatientProfileModificationCard';
import AidantLogCard from './components/AidantLogCard';

const BLUE = "#2A62F9";
const GREEN = "#08AF62";
const RED = "#FF3B30";
const GREY = "#EFEFEF";

// Copié depuis GestionRappels.jsx pour les couleurs/icônes
const TYPES = [
    { name: 'Médicament', color: '#4CAF50', icon: 'local-pharmacy' },
    { name: 'Communication', color: '#2196F3', icon: 'chat' },
    { name: 'Quotidien', color: '#FF9800', icon: 'schedule' },
    { name: 'Sécurité', color: '#F44336', icon: 'warning' },
    { name: 'Activité', color: '#9C27B0', icon: 'directions-run' },
    { name: 'Événement', color: '#3F51B5', icon: 'event' },
    { name: 'Rendez-vous', color: '#009688', icon: 'event-available' },
    { name: 'Hydratation', color: '#00BCD4', icon: 'opacity' },
    { name: 'Nutrition', color: '#FFC107', icon: 'restaurant' },
    { name: 'Autres', color: '#9E9E9E', icon: 'more-horiz' }
];

const ICONS_MAPPING = {
  'Médicament': 'medication',
  'Activité': 'directions-run',
  'Rendez-vous': 'event',
  'Autre': 'notifications',
};

const ICONS_COLOR = {
    'Médicament': '#d11f5a',
    'Activité': '#1fd183',
    'Rendez-vous': '#7c1fd1',
    'Autre': '#d17c1f'
}

export default function AidantNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [patientProfileModifications, setPatientProfileModifications] = useState([]);
  const [aidantLogs, setAidantLogs] = useState([]);
  const [currentAidantLogs, setCurrentAidantLogs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentAidant, setCurrentAidant] = useState(null);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedRappel, setSelectedRappel] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications', 'patientModifications', 'aidantLogs'
  const router = useRouter();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setNotifications(data);
      setFilteredNotifications(data);
      
      // Mark notifications as read
      await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

    } catch (error) {
      console.error("Erreur fetchNotifications:", error);
      Alert.alert("Erreur", "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientProfileModifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/patient-profile-modifications/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatientProfileModifications(data.modifications || []);
      }
    } catch (error) {
      console.error("Erreur fetchPatientProfileModifications:", error);
    }
  };

  const fetchCurrentAidant = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/aidants/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const aidant = await response.json();
        setCurrentAidant(aidant);
        return aidant;
      }
    } catch (error) {
      console.error("Erreur fetchCurrentAidant:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const aidant = await fetchCurrentAidant();
      if (!aidant) return;

      const token = await AsyncStorage.getItem("token");
      const patientsResponse = await fetch(`${BASE_URL}/api/aidants/${aidant.id_aidant}/getPatients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
        if (patientsData.length > 0 && !selectedPatient) {
          setSelectedPatient(patientsData[0]);
        }
      }
    } catch (error) {
      console.error("Erreur fetchPatients:", error);
    }
  };

  const fetchAidantLogs = async (patientId) => {
    if (!patientId) return;
    
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/aidants/logs/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAidantLogs(data.data || []);
      }
    } catch (error) {
      console.error("Erreur fetchAidantLogs:", error);
    }
  };

  const fetchCurrentAidantLogs = async () => {
    if (!currentAidant) return;
    
    try {
      const token = await AsyncStorage.getItem("token");
      
      // Récupérer les logs de l'aidant courant pour tous ses patients
      const allLogs = [];
      
      for (const patient of patients) {
        const response = await fetch(`${BASE_URL}/api/aidants/logs/${patient.id_patient}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filtrer pour ne garder que les logs de l'aidant courant
          const currentAidantLogs = data.data.filter(log => 
            log.aidant.id === currentAidant.id_aidant
          );
          allLogs.push(...currentAidantLogs);
        }
      }
      
      setCurrentAidantLogs(allLogs);
    } catch (error) {
      console.error("Erreur fetchCurrentAidantLogs:", error);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchPatientProfileModifications(),
      fetchPatients()
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  useEffect(() => {
    if (activeTab === 'notifications') {
      const filtered = notifications.filter(notif => 
        `${notif.nompatient} ${notif.prenompatient} ${notif.id_patient}`.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredNotifications(filtered);
    }
  }, [searchInput, notifications, activeTab]);

  useEffect(() => {
    if (activeTab === 'aidantLogs' && selectedPatient) {
      fetchAidantLogs(selectedPatient.id_patient);
    }
  }, [activeTab, selectedPatient]);

  useEffect(() => {
    if (currentAidant && patients.length > 0) {
      fetchCurrentAidantLogs();
    }
  }, [currentAidant, patients]);
  
  const openResendModal = (rappel) => {
    setSelectedRappel(rappel);
    setDatePickerVisibility(true);
  };
  
  const handleConfirmTime = async (date) => {
    setDatePickerVisibility(false);
    const newTime = date.toTimeString().slice(0, 5);
    
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/rappels/${selectedRappel.id_rappel}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ heure_rappel: newTime })
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Succès', result.message || 'Rappel renvoyé avec succès');
        // Rafraîchir les notifications
        fetchNotifications();
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.error || 'Impossible de renvoyer le rappel');
      }
    } catch (error) {
      console.error('Erreur renvoi rappel:', error);
      Alert.alert('Erreur', 'Erreur lors du renvoi');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      'Masquer la notification',
      'Êtes-vous sûr de vouloir masquer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Masquer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}/dismiss`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                // Retirer la notification de la liste locale
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                setFilteredNotifications(prev => prev.filter(n => n.id !== notificationId));
                Alert.alert('Succès', 'Notification masquée');
              } else {
                const errorData = await response.json();
                Alert.alert('Erreur', errorData.error || 'Impossible de masquer la notification');
              }
            } catch (error) {
              console.error('Erreur masquage notification:', error);
              Alert.alert('Erreur', 'Erreur lors du masquage');
            }
          }
        }
      ]
    );
  };

  const handleApprovePatientModification = (modificationId) => {
    setPatientProfileModifications(prev => prev.filter(m => m.id !== modificationId));
  };

  const handleRejectPatientModification = (modificationId) => {
    setPatientProfileModifications(prev => prev.filter(m => m.id !== modificationId));
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedPatient) {
      Alert.alert('Erreur', 'Veuillez sélectionner un patient et saisir un message');
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/aidants/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient.id_patient,
          message: messageInput.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Succès', result.message);
        setMessageInput('');
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.error || 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'envoi du message');
    }
  };

  const renderNotification = ({ item }) => {
    const typeInfo = TYPES.find(t => t.name === item.type_rappel) || TYPES[TYPES.length - 1];
    
    // Debug: afficher les propriétés de l'item
    console.log('Notification item:', {
      id: item.id,
      type: item.type,
      type_rappel: item.type_rappel,
      confirmer_rappel: item.confirmer_rappel
    });
    
    return (
        <View style={[styles.card, { borderLeftColor: typeInfo.color }]}>
            <View style={styles.cardHeader}>
                <View style={styles.patientInfo}>
                    <Image
                        source={item.profile_image ? { uri: `${BASE_URL}/${item.profile_image}` } : require('../assets/default-avatar.png')}
                        style={styles.patientImage}
                    />
                    <View>
                        <Text style={styles.patientName}>{item.nompatient} {item.prenompatient}</Text>
                        <Text style={styles.lienFamilial}>{item.lien_familial}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteNotification(item.id)}>
                    <Ionicons name="trash-outline" size={24} color={RED} />
                </TouchableOpacity>
            </View>

            <View style={styles.rappelInfo}>
                <MaterialIcons name={typeInfo.icon} size={24} color={typeInfo.color} />
                <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.rappelDescription}>{item.message}</Text>
                </View>
            </View>

            <View style={styles.contactInfo}>
                <Ionicons name="call-outline" size={20} color={BLUE} />
                <Text style={styles.phoneText}>{item.telephpatient}</Text>
                {item.telephpatient &&
                    <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${item.telephpatient}`)}>
                        <Ionicons name="call" size={20} color="#fff" />
                    </TouchableOpacity>
                }
            </View>
            
            {/* Afficher le bouton de renvoi pour les rappels non confirmés */}
            {(item.type === 'non_confirme' || item.confirmer_rappel === false || item.confirmer_rappel === 0) && (
                <TouchableOpacity style={styles.resendButton} onPress={() => openResendModal(item)}>
                    <MaterialIcons name="send" size={20} color="#fff" />
                    <Text style={styles.resendButtonText}>Renvoyer le rappel</Text>
                </TouchableOpacity>
            )}
        </View>
    );
  };

  const renderPatientProfileModification = ({ item }) => (
    <PatientProfileModificationCard
      modification={item}
      onApprove={handleApprovePatientModification}
      onReject={handleRejectPatientModification}
      onRefresh={fetchPatientProfileModifications}
    />
  );

  const renderAidantLog = ({ item }) => (
    <AidantLogCard aidantLog={item} />
  );

  const getTotalCount = () => {
    const notificationCount = notifications.length;
    const patientModificationCount = patientProfileModifications.length;
    const aidantLogsCount = aidantLogs.length + currentAidantLogs.length;
    return notificationCount + patientModificationCount + aidantLogsCount;
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'notifications':
        return filteredNotifications;
      case 'patientModifications':
        return patientProfileModifications;
      case 'aidantLogs':
        return [...aidantLogs, ...currentAidantLogs];
      default:
        return [];
    }
  };

  const getCurrentRenderItem = () => {
    switch (activeTab) {
      case 'notifications':
        return renderNotification;
      case 'patientModifications':
        return renderPatientProfileModification;
      case 'aidantLogs':
        return renderAidantLog;
      default:
        return renderNotification;
    }
  };

  const getEmptyText = () => {
    switch (activeTab) {
      case 'notifications':
        return 'Aucune notification de rappel.';
      case 'patientModifications':
        return 'Aucune modification de profil patient en attente.';
      case 'aidantLogs':
        return 'Aucune activité des aidants.';
      default:
        return 'Aucune donnée.';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("/AccueilAidant")}>
          <MaterialIcons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Onglets */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons 
            name="notifications" 
            size={20} 
            color={activeTab === 'notifications' ? BLUE : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Rappels ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'patientModifications' && styles.activeTab]}
          onPress={() => setActiveTab('patientModifications')}
        >
          <MaterialIcons 
            name="person-outline" 
            size={20} 
            color={activeTab === 'patientModifications' ? BLUE : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'patientModifications' && styles.activeTabText]}>
            Patients ({patientProfileModifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'aidantLogs' && styles.activeTab]}
          onPress={() => setActiveTab('aidantLogs')}
        >
          <MaterialIcons 
            name="people" 
            size={20} 
            color={activeTab === 'aidantLogs' ? BLUE : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'aidantLogs' && styles.activeTabText]}>
            Aidants ({aidantLogs.length + currentAidantLogs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sélecteur de patient pour les logs des aidants */}
      {activeTab === 'aidantLogs' && (
        <View style={styles.patientSelector}>
          <Text style={styles.patientSelectorLabel}>Patient :</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.patientSelectorButton}
              onPress={() => setShowPatientDropdown(!showPatientDropdown)}
            >
              <Text style={styles.patientSelectorText}>
                {selectedPatient ? `${selectedPatient.prenompatient} ${selectedPatient.nompatient}` : 'Sélectionner un patient'}
              </Text>
              <MaterialIcons 
                name={showPatientDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
                size={24} 
                color={BLUE} 
              />
            </TouchableOpacity>
            
            {showPatientDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScrollView}>
                  {patients.map((patient, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        selectedPatient?.id_patient === patient.id_patient && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedPatient(patient);
                        setShowPatientDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedPatient?.id_patient === patient.id_patient && styles.dropdownItemTextSelected
                      ]}>
                        {patient.prenompatient} {patient.nompatient}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Barre de recherche (seulement pour les notifications) */}
      {activeTab === 'notifications' && (
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={22} color={BLUE} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par patient..."
            placeholderTextColor="#A2A7F9"
            value={searchInput}
            onChangeText={setSearchInput}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={getCurrentData()}
          renderItem={getCurrentRenderItem()}
          keyExtractor={(item) => item.id?.toString() || item.aidant?.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {getEmptyText()}
            </Text>
          }
        />
      )}

      {/* Barre de message pour les logs des aidants */}
      {activeTab === 'aidantLogs' && selectedPatient && (
        <View style={styles.messageBarContainer}>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Envoyer un message aux autres aidants..."
              placeholderTextColor="#A2A7F9"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, !messageInput.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={!messageInput.trim()}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={() => setDatePickerVisibility(false)}
          headerTextIOS="Choisir une heure"
          cancelTextIOS="Annuler"
          confirmTextIOS="Confirmer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREY },
  header: {
    backgroundColor: BLUE, height: 70, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 18, borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18, marginBottom: 10,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerIcon: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 6 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: BLUE,
  },
  patientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  patientSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  patientSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  patientSelectorText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: BLUE,
    fontWeight: '600',
  },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: BLUE,
    borderRadius: 12, marginHorizontal: 16, backgroundColor: '#fff',
    marginBottom: 10, paddingHorizontal: 8, height: 48,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 17, color: BLUE },
  messageBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  messageInputContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  messageInput: {
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: GREEN,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 18, marginTop: 40 },
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
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  patientImage: { width: 45, height: 45, borderRadius: 22.5, marginRight: 10, backgroundColor: '#f0f0f0' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  lienFamilial: { fontSize: 14, color: 'grey' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginLeft: 5 },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    padding: 5,
  },
  rappelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 5,
  },
  rappelDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flexShrink: 1,
  },
  contactInfo: {
    flexDirection: 'row', alignItems: 'center', borderTopWidth: 1,
    borderTopColor: '#f0f0f0', paddingTop: 10
  },
  phoneText: { marginLeft: 8, fontSize: 15, color: '#333', flex: 1 },
  callButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 'auto'
  },
  resendButton: {
    backgroundColor: "#3333ff",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  resendButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
}); 