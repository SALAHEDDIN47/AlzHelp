import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddEventModal from './AddEventModal';
import { MedicalEventService } from '../utils/api';

const MedicalTracking = ({ patientId }) => {
  const [events, setEvents] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      const response = await MedicalEventService.getEvents(patientId);
      const formattedEvents = response.data.map(event => ({
        ...event,
        date: new Date(event.date_event), // Convert string to Date object
        id: event.id_event.toString() // Ensure consistent ID format
      }));
      setEvents(formattedEvents.sort((a, b) => a.date - b.date));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les événements médicaux');
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, [patientId]);

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Create or update event
  const handleAddEvent = async (newEvent) => {
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
        response = await MedicalEventService.createEvent(patientId, eventData);
      }

      // Update local state with server response
      const updatedEvent = {
        ...response.data,
        date: new Date(response.data.date_event),
        id: response.data.id_event.toString()
      };

      setEvents(prevEvents => {
        const updatedEvents = currentEvent
          ? prevEvents.map(e => e.id === currentEvent.id ? updatedEvent : e)
          : [...prevEvents, updatedEvent];
        return updatedEvents.sort((a, b) => a.date - b.date);
      });

      setModalVisible(false);
      setCurrentEvent(null);
    } catch (error) {
      Alert.alert(
        'Erreur', 
        currentEvent ? 'Échec de la mise à jour' : 'Échec de la création'
      );
      console.error('Save event error:', error);
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
              Alert.alert('Erreur', 'Échec de la suppression');
              console.error('Delete error:', error);
            }
          }
        }
      ]
    );
  };

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
                source={{ uri: `http://votre-backend/${item.fichier_path}` }} 
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
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

export default MedicalTracking;