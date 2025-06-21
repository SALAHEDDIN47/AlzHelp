import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';
import { MedicalEventService } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BASE_URL } from '../../utils/fetchNgrok';

const BLUE = "#2A62F9";
const BORDER_BLUE = "#A2A7F9";

const suiviAidant = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aidantId, setAidantId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  // Récupérer l'ID de l'aidant au chargement
  useEffect(() => {
    const getAidantId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setAidantId(id);
          fetchPatients(id);
        } else {
          console.error('Aucun ID aidant trouvé');
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur récupération ID aidant:', error);
        setLoading(false);
      }
    };
    getAidantId();
  }, []);

  // Récupérer les patients de l'aidant
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
      } else {
        console.error('Erreur lors de la récupération des patients');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur fetchPatients:', error);
      setLoading(false);
    }
  };

  // Fetch events from API
  const fetchEvents = async (patientId) => {
    if (!patientId) {
      console.log("Pas d'ID patient disponible");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching events for patient:", patientId);
      const response = await MedicalEventService.getEvents(patientId);
      console.log("Données reçues:", response);
      
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
      console.error('Fetch events error:', error);
      Alert.alert('Erreur', 'Impossible de charger les événements médicaux');
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchEvents(patient.id_patient);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    if (selectedPatient) {
      fetchEvents(selectedPatient.id_patient);
    }
  };

  // Create or update event
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
        fichier: newEvent.document
      };

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

        setModalVisible(false);
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

  // Delete event
  const handleDelete = async (eventId) => {
    Alert.alert(
      "Confirmer la suppression",
      "Voulez-vous vraiment supprimer cet événement ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          onPress: async () => {
            try {
              await MedicalEventService.deleteEvent(eventId);
              setEvents(prev => prev.filter(e => e.id !== eventId));
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Erreur', 'Échec de la suppression');
            }
          }
        }
      ]
    );
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
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.titre}</Text>
        <Text style={styles.eventDate}>
          {item.date.toLocaleDateString()} à {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
        {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}
        
        {item.fichier_path && (
          <View style={styles.documentContainer}>
            {item.fichier_type?.includes('image') ? (
              <Image 
                source={{ uri: `${BASE_URL}/${item.fichier_path}` }} 
                style={styles.documentImage}
              />
            ) : (
              <View style={styles.fileContainer}>
                <Ionicons name="document" size={24} color="#3498db" />
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.fichier_path.split('/').pop()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            setCurrentEvent(item);
            setModalVisible(true);
          }}
        >
          <Ionicons name="create" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
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

      {selectedPatient && (
        <>
          <View style={styles.searchBarContainer}>
            <Feather name="search" size={22} color={BLUE} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un événement..."
              placeholderTextColor={BLUE}
              value={searchInput}
              onChangeText={setSearchInput}
            />
          </View>

          <FlatList
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun événement médical enregistré</Text>
            }
          />
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              setCurrentEvent(null);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </>
      )}
      
      <AddEventModal 
        visible={isModalVisible}
        onClose={() => {
          setModalVisible(false);
          setCurrentEvent(null);
        }}
        onSave={handleAddEvent}
        currentEvent={currentEvent}
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
    marginLeft: 16,
    marginBottom: 8,
    color: '#2d3436',
  },
  patientsList: {
    paddingHorizontal: 16,
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
    color: '#2d3436',
  },
  patientId: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 8,
    height: 48,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: BLUE,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#7f8c8d',
  },
  eventItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventDetails: {
    flex: 1,
    marginRight: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2d3436',
  },
  eventDate: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#2d3436',
    marginBottom: 12,
  },
  documentContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dfe6e9',
    paddingTop: 10,
  },
  documentImage: {
    width: '100%',
    height: 150,
    borderRadius: 5,
    resizeMode: 'contain',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    marginLeft: 8,
    color: '#3498db',
    flexShrink: 1,
  },
  actionsContainer: {
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default suiviAidant;