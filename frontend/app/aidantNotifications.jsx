import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput,
  TouchableOpacity, Image, Modal, Alert, Linking
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/fetchNgrok';
import DateTimePickerModal from "react-native-modal-datetime-picker";

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
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedRappel, setSelectedRappel] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  useEffect(() => {
    const filtered = notifications.filter(notif => 
      `${notif.nompatient} ${notif.prenompatient} ${notif.id_patient}`.toLowerCase().includes(searchInput.toLowerCase())
    );
    setFilteredNotifications(filtered);
  }, [searchInput, notifications]);
  
  const openResendModal = (rappel) => {
    setSelectedRappel(rappel);
    setDatePickerVisibility(true);
  };
  
  const handleConfirmTime = async (date) => {
    setDatePickerVisibility(false);
    const newTime = date.toTimeString().slice(0, 5);

    try {
      const token = await AsyncStorage.getItem("token");
      // We need the full rappel object to update it.
      // The notification object `item` contains most of the rappel fields
      const rappelToUpdate = {
        description: selectedRappel.description,
        type_rappel: selectedRappel.type_rappel,
        frequence: selectedRappel.frequence,
        jours_specifiques: selectedRappel.jours_specifiques,
        date_rappel: selectedRappel.date_rappel,
        heure_rappel: newTime,
        id_patient: selectedRappel.id_patient,
        modifie_par_aidant: true // Pour bypasser le spam
      };
      
      const response = await fetch(`${BASE_URL}/api/rappels/${selectedRappel.id_rappel}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(rappelToUpdate)
      });

      if(response.ok) {
        Alert.alert("Succès", `Le rappel a été renvoyé pour ${newTime}.`);
        fetchNotifications(); // Refresh list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "La mise à jour du rappel a échoué");
      }
    } catch (error) {
      console.error("Erreur renvoi rappel:", error);
      Alert.alert("Erreur", error.message || "Impossible de renvoyer le rappel.");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      "Supprimer la notification",
      "Êtes-vous sûr de vouloir supprimer cette notification ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}/dismiss`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                // Mettre à jour les deux états pour un retrait immédiat
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                setFilteredNotifications(prev => prev.filter(n => n.id !== notificationId));
                Alert.alert("Succès", "La notification a été masquée.");
              } else {
                Alert.alert("Erreur", "L'opération a échoué.");
              }
            } catch (error) {
              console.error("Erreur dismissNotification:", error);
              Alert.alert("Erreur", "Une erreur est survenue.");
            }
          }
        }
      ]
    );
  };

  const renderNotification = ({ item }) => {
    const typeInfo = TYPES.find(t => t.name === item.type_rappel) || TYPES.find(t => t.name === 'Autres');

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
            
            {item.type === 'non_confirme' && (
                <TouchableOpacity style={styles.resendButton} onPress={() => openResendModal(item)}>
                    <MaterialIcons name="send" size={20} color="#fff" />
                    <Text style={styles.resendButtonText}>Renvoyer le rappel</Text>
                </TouchableOpacity>
            )}
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("/AccueilAidant")}>
          <MaterialIcons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

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

      {loading ? (
        <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune notification.</Text>}
        />
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
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: BLUE,
    borderRadius: 12, marginHorizontal: 16, backgroundColor: '#fff',
    marginBottom: 10, paddingHorizontal: 8, height: 48,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 17, color: BLUE },
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