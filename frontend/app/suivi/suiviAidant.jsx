import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, TextInput, Modal, ScrollView, Linking } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';
import { MedicalEventService } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BASE_URL } from '../../utils/fetchNgrok';
import * as imagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';


const BLUE = "#2A62F9";
const BORDER_BLUE = "#A2A7F9";

const SuiviAidant = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aidantId, setAidantId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const getAidantId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setAidantId(id);
          fetchPatients(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur getAidantId:', error);
        setLoading(false);
      }
    };
    getAidantId();
  }, []);

  const fetchPatients = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/aidants/${id}/getPatients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatient(data[0]);
          fetchEvents(data[0].id_patient);
        }
      }
    } catch (error) {
      console.error('Erreur fetchPatients:', error);
      setLoading(false);
    }
  };

  const fetchEvents = async (patientId) => {
    if (!patientId) return;
    try {
      const response = await MedicalEventService.getEvents(patientId);
      if (response && response.data) {
        const formattedEvents = response.data.map(event => ({
          ...event,
          date: new Date(event.date_event),
          id: event.id_event?.toString() || event.id?.toString()
        }));
        setEvents(formattedEvents.sort((a, b) => b.date - a.date));
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Erreur fetchEvents:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchEvents(patient.id_patient);
  };

  const handleAddEvent = async (newEvent) => {
    if (!selectedPatient) {
      Alert.alert('Erreur', 'Aucun patient sélectionné');
      return;
    }

    try {
      let response;
      const eventData = {
        titre: newEvent.title,
        description: newEvent.description,
        date_event: newEvent.date.toISOString(),
        fichier_path: newEvent.document?.uri,
        
        fichier_type: newEvent.document?.type,
        
        fichier: newEvent.document
      };


      console.log("fichier_path:", newEvent.document?.uri);
      console.log("fichier_type:", newEvent.document?.type);

      if (currentEvent) {
        response = await MedicalEventService.updateEvent(currentEvent.id, eventData);
      } else {
        response = await MedicalEventService.createEvent(selectedPatient.id_patient, eventData);
      }

      if (response && response.data) {
        const updatedEvent = {
          ...response.data,
          date: new Date(response.data.date_event),
          id: response.data.id_event?.toString() || response.data.id?.toString()
        };

        setEvents(prevEvents => {
          const updatedEvents = currentEvent
            ? prevEvents.map(e => e.id === currentEvent.id ? updatedEvent : e)
            : [...prevEvents, updatedEvent];
          return updatedEvents.sort((a, b) => b.date - a.date);
        });

        setIsModalVisible(false);
        setCurrentEvent(null);
      }
    } catch (error) {
      console.error('Save event error:', error);
      Alert.alert(
        'Erreur', 
        currentEvent ? 'Échec de la mise à jour' : 'Échec de la création'
      );
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer cet événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await MedicalEventService.deleteEvent(eventId);
              setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
            } catch (error) {
              console.error('Delete event error:', error);
              Alert.alert('Erreur', 'Échec de la suppression');
            }
          }
        }
      ]
    );
  };

  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setIsModalVisible(true);
  };

  const handleDownload = async (filePath) => {
    try {
      const url = `${BASE_URL}/${filePath}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    }
  };

  // Render patient item
  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.patientItem,
        selectedPatient?.id_patient === item.id_patient && styles.selectedPatientItem
      ]}
      onPress={() => handlePatientSelect(item)}
    >
      <Text style={styles.patientName}>{item.nompatient} {item.prenompatient}</Text>
      <Text style={styles.patientId}>ID: {item.id_patient}</Text>
    </TouchableOpacity>
  );

  // Render each event item
  const renderEventItem = ({ item }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{item.titre}</Text>
        <Text style={styles.eventDate}>
          {new Date(item.date_event).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </Text>
      </View>
      
      <Text style={styles.eventDescription}>{item.description}</Text>
      
      {item.fichier_path && (
        <TouchableOpacity 
          style={styles.fileButton}
          onPress={() => handleDownload(item.fichier_path)}
        >
          <Ionicons name="document" size={20} color={BLUE} />
          <Text style={styles.fileButtonText}>Voir le document</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditEvent(item)}
        >
          <Ionicons name="create" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteEvent(item.id)}
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add search filter effect
  useEffect(() => {
    if (searchInput === "") {
      setFilteredEvents(events);
      return;
    }
    setFilteredEvents(
      events.filter(event =>
        `${event.titre} ${event.description}`.toLowerCase().includes(searchInput.toLowerCase())
      )
    );
  }, [searchInput, events]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{width:40}} />
        <Text style={styles.headerTitle}>Suivi médical</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("/AccueilAidant")}>
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Liste des patients */}
      <View style={styles.patientsContainer}>
        <Text style={styles.sectionTitle}>Patients</Text>
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={item => item.id_patient.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.patientsList}
        />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un événement..."
          value={searchInput}
          onChangeText={setSearchInput}
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => setSearchInput("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BLUE} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchEvents(selectedPatient.id_patient);
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun événement médical enregistré</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentEvent(null);
          setIsModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <AddEventModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setCurrentEvent(null);
        }}
        onSave={handleAddEvent}
        event={currentEvent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: BLUE,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  patientsContainer: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
    color: '#333',
  },
  patientsList: {
    paddingHorizontal: 10,
  },
  patientItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 150,
    elevation: 2,
  },
  selectedPatientItem: {
    borderColor: BLUE,
    borderWidth: 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    padding: 10,
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
  },
  eventDescription: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  fileButtonText: {
    marginLeft: 8,
    color: BLUE,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: BLUE,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: BLUE,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuiviAidant; 