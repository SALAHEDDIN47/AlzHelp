import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, StatusBar, Dimensions, Alert, Modal, Linking } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchWithToken, BASE_URL } from '../utils/fetchNgrok';

const BLUE = "#007AFF";
const { width } = Dimensions.get('window');
const PATIENT_CARD_SIZE = 90;
const EMPTY_CARD_SIZE = 80;

export default function AccueilAidant() {
  const [aidant, setAidant] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchAidantAndPatients();
    fetchNotificationCount();
    
    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAidantAndPatients = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const aidantId = await AsyncStorage.getItem("userId");
      if (!token || !aidantId) return;
      
      // Fetch aidant info
      const resAidant = await fetch(`${BASE_URL}/api/aidants/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (resAidant.ok) {
        const data = await resAidant.json();
        setAidant(data);
      }
      
      
      // Fetch patients
      const resPatients = await fetch(`${BASE_URL}/api/aidants/${aidantId}/getPatients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resPatients.ok) {
        const data = await resPatients.json();
      
      // Trier les patients par date d'ajout (le plus récent en premier)
      const sortedPatients = data.sort((a, b) => {
        // Utiliser accompagnement_created_at pour trier par date d'ajout de l'accompagnement
        if (a.accompagnement_created_at && b.accompagnement_created_at) {
          return new Date(b.accompagnement_created_at) - new Date(a.accompagnement_created_at);
        }
        // Par défaut, on garde l'ordre d'arrivée (les plus récents en premier)
        return 0;
      });
      
      setPatients(sortedPatients);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Récupérer le nombre de notifications de rappels
      const notificationsResponse = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Récupérer le nombre de modifications de profil aidant en attente
      const aidantModificationsResponse = await fetch(`${BASE_URL}/api/profile-modifications/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer le nombre de modifications de profil patient en attente
      const patientModificationsResponse = await fetch(`${BASE_URL}/api/patient-profile-modifications/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let totalCount = 0;

      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json();
        totalCount += notifications.length;
      }

      if (aidantModificationsResponse.ok) {
        const aidantModifications = await aidantModificationsResponse.json();
        totalCount += (aidantModifications.modifications || []).length;
      }

      if (patientModificationsResponse.ok) {
        const patientModifications = await patientModificationsResponse.json();
        totalCount += (patientModifications.modifications || []).length;
      }

      setNotificationCount(totalCount);
    } catch (error) {
      console.error('Erreur récupération compteur notifications:', error);
    }
  };

  const handlePatientPress = (item) => {
    setSelectedPatient(item);
    setModalVisible(true);
  };

  const renderPatient = ({ item }) => (
    <TouchableOpacity style={styles.patientCard} onPress={() => handlePatientPress(item)}>
      <Image source={item.profile_image ? 
        { uri: `${BASE_URL}/${item.profile_image}` } : 
        require("../assets/default-avatar.png")}
        style={styles.patientImage} />
      <Text style={styles.patientName} numberOfLines={1}>{item.nompatient}</Text>
      <Text style={styles.patientName} numberOfLines={1}>{item.prenompatient}</Text>
      <View style={styles.lienFamilialRow}>
        <MaterialIcons name="people" size={16} color={BLUE} style={{marginRight: 3}} />
        <Text style={styles.lienFamilialText} numberOfLines={1}>{item.lien_familial || "-"}</Text>
      </View>
    </TouchableOpacity>
  );
console.log("aidant infos:",aidant);
  const renderEmptyCard = () => (
    <View style={styles.emptyCard} />
  );

  const gridButtons = [
    { icon: 'person', label: 'Profile', path: './profileAidant', color: BLUE },
    { icon: 'groups', label: 'Patients', path: './myPatients', color: BLUE },
    { icon: 'group-work', label: 'Groupes', path: './myGroupes', color: BLUE },
    { icon: 'pending-actions', label: 'Rappels', path: './GestionRappels', color: BLUE },
    { 
      icon: 'medical-services', 
      label: 'Suivi médical', 
      path: './suivi/suiviAidant_new',
      onPress: async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            router.push({
              pathname: './suivi/suiviAidant_new',
              params: { userId }
            });
          } else {
            Alert.alert('Erreur', 'Aucun utilisateur connecté');
          }
        } catch (error) {
          console.error('Erreur navigation:', error);
          Alert.alert('Erreur', 'Impossible d\'accéder au suivi médical');
        }
      },
      color: BLUE 
    },
    { icon: 'location-on', label: 'Localisation', path: './localisation', color: BLUE },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />
      {/* Header bleu avec image aidant et nom/prénom */}
      <View style={styles.headerBlue}>
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={() => router.push('/aidantNotifications')}
        >
          <MaterialIcons name="notifications" size={30} color="#fff" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Image
            style={styles.aidantImage}
             source={aidant && aidant.image_url ? 
                  { uri: `${BASE_URL}/${aidant.image_url}`|| aidant.image_url  } : 
                  require('../assets/default-avatar.png')}
          />
          <View style={{ marginLeft: 18 }}>
            <Text style={styles.aidantName}>{aidant ? aidant.nom : ''} {aidant ? aidant.prenom : ''}</Text>
            <Text style={styles.aidantSubtitle}>Aidant</Text>
          </View>
        </View>
      </View>

      {/* Liste horizontale des patients */}
      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionTitle}>Mes Patients</Text>
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={item => item.id_patient?.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
        />
      </View>

      {/* FlatList horizontale de cadres vides */}
     {/* <View style={{ marginTop: 18 }}>
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={renderEmptyCard}
          keyExtractor={(_, idx) => idx.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
        />
      </View>/*}

      {/* Grille de boutons */}
      <View style={styles.gridContainer}>
        {gridButtons.map((btn, idx) => (
          <TouchableOpacity
            key={btn.label}
            style={styles.gridButton}
            onPress={btn.onPress || (() => router.push(btn.path))}
          >
            <MaterialIcons name={btn.icon} size={32} color="white" />
            <Text style={styles.gridLabel}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal infos patient */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
            {selectedPatient && (
              <>
                <Image
                  source={selectedPatient.profile_image ? { uri: `${BASE_URL}/${selectedPatient.profile_image}` } : require("../assets/default-avatar.png")}
                  style={styles.modalPatientImage}
                />
                <Text style={styles.modalPatientName}>{selectedPatient.nompatient} {selectedPatient.prenompatient}</Text>
                <View style={styles.modalInfoRow}>
                  <MaterialIcons name="people" size={22} color={BLUE} style={{marginRight: 8}} />
                  <Text style={styles.modalInfoText}>{selectedPatient.lien_familial || "-"}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <MaterialIcons name="home" size={22} color={BLUE} style={{marginRight: 8}} />
                  <Text style={styles.modalInfoText}>{selectedPatient.adresspat || "-"}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <MaterialIcons name="phone" size={22} color={BLUE} style={{marginRight: 8}} />
                  <Text style={styles.modalInfoText}>{selectedPatient.telephpatient || "-"}</Text>
                  {selectedPatient.telephpatient ? (
                    <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${selectedPatient.telephpatient}`)}>
                      <MaterialIcons name="call" size={22} color={"#fff"} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.modalInfoRow}>
                  <MaterialIcons name="email" size={22} color={BLUE} style={{marginRight: 8}} />
                  <Text style={styles.modalInfoText}>{selectedPatient.emailpatient || "-"}</Text>
                  {selectedPatient.emailpatient ? (
                    <TouchableOpacity style={styles.mailBtn} onPress={() => Linking.openURL(`mailto:${selectedPatient.emailpatient}`)}>
                      <MaterialIcons name="mail" size={22} color={"#fff"} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlue: {
    backgroundColor: BLUE,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    position: 'relative',
  },
  notificationButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    zIndex: 1,
  },
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  aidantImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#e0e0e0',
  },
  aidantName: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  aidantSubtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 8,
    color: '#333',
  },
  patientCard: {
    width: PATIENT_CARD_SIZE + 20,
    alignItems: 'center',
    marginRight: 18,
    backgroundColor: '#f7f7f7',
    borderRadius: 18,
    padding: 8,
    elevation: 2,
  },
  patientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
    backgroundColor: '#e0e0e0',
  },
  patientName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 80,
  },
  emptyCard: {
    width: EMPTY_CARD_SIZE,
    height: EMPTY_CARD_SIZE,
    backgroundColor: '#e6e6e6',
    borderRadius: 18,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#b0b0b0',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingHorizontal: 10,
  },
  gridButton: {
    backgroundColor: BLUE,
    borderRadius: 20,
    width: width / 2.3,
    height: 90,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  gridLabel: {
    color: 'white',
    fontWeight: '600',
    marginTop: 7,
    fontSize: 16,
  },
  lienFamilialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: 90,
    alignSelf: 'center',
  },
  lienFamilialText: {
    fontSize: 13,
    color: BLUE,
    fontWeight: 'bold',
    flexShrink: 1,
    maxWidth: 70,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentBox: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
    elevation: 8,
    borderWidth: 2,
    borderColor: BLUE,
    position: 'relative',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  modalPatientImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: BLUE,
  },
  modalPatientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    width: '100%',
    paddingHorizontal: 10,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  callBtn: {
    backgroundColor: '#08AF62',
    borderRadius: 8,
    padding: 5,
    marginLeft: 8,
  },
  mailBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 5,
    marginLeft: 8,
  },
});


