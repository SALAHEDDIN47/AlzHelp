import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, TextInput, Modal, ScrollView, Linking } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { MedicalEventService } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BASE_URL } from '../../utils/fetchNgrok';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
// Supprimons l'import d'ErrorUtils qui cause l'erreur
// import ErrorUtils from 'ErrorUtils';

const BLUE = "#2A62F9";
const BORDER_BLUE = "#A2A7F9";
const GREY = "#f5f6fa";
const DEFAULT_IMAGE = require('../../assets/images/no_file.png');

const MedicalTracking = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const getUserId = async () => {
      try {
        if (params.userId) {
          setUserId(params.userId);
          return;
        }
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setUserId(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };
    getUserId();
  }, [params.userId]);

  // Gestionnaire d'erreurs simplifié
  useEffect(() => {
    // Fonction pour gérer les erreurs non capturées
    const handleError = (error, isFatal) => {
      console.error('Erreur non gérée dans MedicalTracking:', error);
      
      // Réinitialiser les états en cas d'erreur
      setLoading(false);
      setRefreshing(false);
      
      // Afficher une alerte à l'utilisateur
      Alert.alert(
        'Erreur',
        'Une erreur inattendue s\'est produite. Veuillez réessayer.',
        [{ text: 'OK', onPress: () => fetchEvents() }]
      );
    };

    // Utiliser un écouteur d'événements pour les erreurs non capturées
    const errorSubscription = global.ErrorUtils?.setGlobalHandler?.(handleError);
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      if (errorSubscription && global.ErrorUtils) {
        global.ErrorUtils.setGlobalHandler(null);
      }
    };
  }, []);

  // Fetch events from API avec gestion d'erreurs améliorée
  const fetchEvents = async (id) => {
    try {
      setLoading(true);
      const patId = id || userId;
      
      if (!patId) {
        console.error("Pas d'ID patient disponible pour fetchEvents");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log("Chargement des événements pour le patient ID:", patId);
      
      // Appel direct à l'API avec fetch pour déboguer
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification non trouvé");
      }
      
      const response = await fetch(`${BASE_URL}/api/medical-events/patients/${patId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log("Réponse brute:", responseText);
      
      let data = [];
      try {
        // Tenter de parser la réponse JSON
        if (responseText && responseText.trim() !== '') {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        throw new Error("Format de réponse invalide");
      }
      
      console.log("Données après parsing:", data);
      
      // Vérifier si data est un tableau
      if (!Array.isArray(data)) {
        console.warn("Les données ne sont pas un tableau:", data);
        data = [];
      }
      
      // Formater les événements avec gestion sécurisée des dates
      const formattedEvents = data.map(event => {
        // Vérifier si date_event existe et est valide
        let eventDate;
        try {
          eventDate = event.date_event ? new Date(event.date_event) : new Date();
          // Vérifier si la date est valide
          if (isNaN(eventDate.getTime())) {
            console.warn(`Date invalide pour l'événement ${event.id_event}:`, event.date_event);
            eventDate = new Date(); // Utiliser la date actuelle comme fallback
          }
        } catch (error) {
          console.error(`Erreur lors du parsing de la date pour l'événement ${event.id_event}:`, error);
          eventDate = new Date(); // Utiliser la date actuelle comme fallback
        }
        
        return {
          ...event,
          date: eventDate,
          id: (event.id_event || event.id || Math.random().toString(36).substr(2, 9)).toString()
        };
      });
      
      console.log("Événements formatés:", formattedEvents);
      
      // Mettre à jour l'état
      setEvents(formattedEvents.sort((a, b) => b.date - a.date));
      setFilteredEvents(formattedEvents.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Fetch events error détaillée:', error);
      Alert.alert('Erreur', `Impossible de charger les événements médicaux: ${error.message}`);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (userId) fetchEvents(); }, [userId]);
  const handleRefresh = () => { setRefreshing(true); fetchEvents(); };

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

  const handleResetSearch = () => setSearchInput("");

  // Fonction de téléchargement sécurisée
  const handleDownload = async (filePath) => {
    if (!filePath) {
      Alert.alert('Erreur', 'Aucun fichier à télécharger');
      return;
    }
    
    try {
      console.log("Tentative de téléchargement du fichier:", filePath);
      
      // Vérifier les permissions
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (!permissions.granted) {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès au stockage pour télécharger des fichiers');
        return;
      }
      
      // Créer un nom de fichier sécurisé
      const fileName = filePath.split('/').pop() || 'fichier_medical';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Télécharger le fichier
      const fileUri = `${FileSystem.documentDirectory}${sanitizedFileName}`;
      const downloadResumable = FileSystem.createDownloadResumable(
        `${BASE_URL}/${filePath}`,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Progression du téléchargement: ${progress * 100}%`);
        }
      );
      
      const { uri } = await downloadResumable.downloadAsync();
      console.log('Fichier téléchargé à:', uri);
      
      // Sauvegarder dans la galerie ou les documents
      try {
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('MedicalTracker', asset, false);
        Alert.alert('Succès', 'Fichier téléchargé avec succès');
      } catch (saveError) {
        console.error('Erreur lors de la sauvegarde dans la galerie:', saveError);
        
        // Essayer de sauvegarder avec SAF comme alternative
        try {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            sanitizedFileName,
            filePath.includes('.') ? filePath.split('.').pop() : 'bin'
          );
          
          const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.writeAsStringAsync(destinationUri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
          
          Alert.alert('Succès', 'Fichier téléchargé avec succès');
        } catch (safError) {
          console.error('Erreur lors de la sauvegarde avec SAF:', safError);
          Alert.alert('Erreur', 'Impossible de sauvegarder le fichier');
        }
      }
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    }
  };

  // Fonction pour récupérer le lien familial
  const fetchFamilyRelationship = async (patientId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/accompagnements/patient/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      return data.lien_familial || '';
    } catch (error) {
      console.error('Erreur lors de la récupération du lien familial:', error);
      return '';
    }
  };

  // Utilisation dans useEffect pour enrichir les événements avec le lien familial
  useEffect(() => {
    const enrichEventsWithFamilyRelationship = async () => {
      if (events.length > 0 && userId) {
        try {
          const lienFamilial = await fetchFamilyRelationship(userId);
          
          if (lienFamilial) {
            const enrichedEvents = events.map(event => ({
              ...event,
              lien_familial: lienFamilial
            }));
            
            setEvents(enrichedEvents);
            setFilteredEvents(enrichedEvents); // Mettre à jour également les événements filtrés
          }
        } catch (error) {
          console.error('Erreur lors de l\'enrichissement des événements:', error);
        }
      }
    };
    
    enrichEventsWithFamilyRelationship();
  }, [events.length, userId]);

  const renderEventItem = ({ item }) => {
    // Vérification de sécurité pour les propriétés
    const isImage = item?.fichier_type?.includes('image') || false;
    const hasFile = !!item?.fichier_path;
    let fileSource = null;
    
    if (hasFile && isImage) {
      fileSource = { uri: `${BASE_URL}/${item.fichier_path}` };
    } else {
      fileSource = DEFAULT_IMAGE;
    }
    
    // Formatage sécurisé de la date
    const formatDate = (date) => {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '-';
      }
      
      try {
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} à ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      } catch (error) {
        console.error("Erreur de formatage de date:", error);
        return '-';
      }
    };
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.leftCol}>
          {/* Image ou icône de document avec gestion d'erreur */}
          {hasFile ? (
            isImage ? (
              <Image 
                source={fileSource} 
                style={styles.cardImage} 
                resizeMode="cover" 
                onError={(e) => {
                  console.error("Erreur de chargement d'image:", e.nativeEvent.error);
                  // Remplacer par l'image par défaut en cas d'erreur
                  e.target.source = DEFAULT_IMAGE;
                }}
              />
            ) : (
              <View style={styles.fileIconContainer}>
                <Ionicons name="document" size={40} color={BLUE} />
              </View>
            )
          ) : (
            <Image source={DEFAULT_IMAGE} style={styles.cardImage} resizeMode="cover" />
          )}
          
          {/* Boutons toujours visibles, qu'il y ait un fichier ou non */}
          <View style={styles.cardButtonsRow}>
            <TouchableOpacity 
              style={styles.cardButton} 
              onPress={() => { 
                setSelectedEvent(item); 
                setDetailModalVisible(true); 
                setZoom(1); 
              }}
            >
              <Ionicons name="eye" size={18} color="#fff" />
              <Text style={styles.cardButtonText}>Visualiser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.cardButton, 
                !hasFile && styles.disabledButton
              ]} 
              onPress={() => hasFile && handleDownload(item.fichier_path)} 
              disabled={!hasFile}
            >
              <Ionicons name="download" size={18} color="#fff" />
              <Text style={styles.cardButtonText}>
                {hasFile ? "Enregistrer" : "Pas de fichier"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.rightCol}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Titre</Text>
            <Text style={styles.infoText}>{item?.titre || '-'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Description</Text>
            <Text style={styles.infoText}>{item?.description || '-'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Date d'ajout</Text>
            <Text style={styles.infoText}>{formatDate(item?.date)}</Text>
          </View>
          {/* Ajout du lien familial avec vérification */}
          {item?.lien_familial && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Lien familial</Text>
              <Text style={styles.infoText}>{item.lien_familial}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDetailModal = () => {
    // Formatage sécurisé de la date
    const formatDate = (date) => {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '-';
      }
      
      try {
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
      } catch (error) {
        console.error("Erreur de formatage de date:", error);
        return '-';
      }
    };
    
    const formatTime = (date) => {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '-';
      }
      
      try {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      } catch (error) {
        console.error("Erreur de formatage d'heure:", error);
        return '-';
      }
    };
    
    // Vérification de sécurité pour les propriétés
    const isImage = selectedEvent?.fichier_type?.includes('image') || false;
    const hasFile = !!selectedEvent?.fichier_path;
    
    return (
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedEvent?.titre || "Détails"}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody} 
              contentContainerStyle={{alignItems:'center', padding: 15}} 
              maximumZoomScale={5} 
              minimumZoomScale={1}
            >
              {/* Affichage de l'image ou du document avec gestion d'erreur */}
              {isImage && hasFile ? (
                // Image depuis le serveur
                <Image 
                  source={{ uri: `${BASE_URL}/${selectedEvent.fichier_path}` }} 
                  style={[styles.documentImage, {transform: [{scale: zoom}]}]} 
                  resizeMode="contain" 
                  onError={(e) => {
                    console.error("Erreur de chargement d'image dans la modal:", e.nativeEvent.error);
                    // Remplacer par l'image par défaut en cas d'erreur
                    e.target.source = DEFAULT_IMAGE;
                  }}
                />
              ) : hasFile ? (
                // Document (non-image)
                <View style={styles.fileContainer}>
                  <Ionicons name="document" size={40} color={BLUE} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {selectedEvent.fichier_path.split('/').pop() || "Document"}
                  </Text>
                  <TouchableOpacity 
                    style={styles.downloadButton}
                    onPress={() => handleDownload(selectedEvent.fichier_path)}
                  >
                    <Ionicons name="download" size={24} color="#fff" />
                    <Text style={styles.downloadButtonText}>Télécharger</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Pas de fichier - Image par défaut
                <View style={styles.noFileContainer}>
                  <Image source={DEFAULT_IMAGE} style={styles.documentImage} resizeMode="contain" />
                  <Text style={styles.noFileText}>Aucun fichier associé à cet événement</Text>
                </View>
              )}
              
              {/* Informations détaillées */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Titre:</Text>
                  <Text style={styles.detailValue}>{selectedEvent?.titre || "-"}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{selectedEvent?.description || "-"}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedEvent?.date)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Heure:</Text>
                  <Text style={styles.detailValue}>{formatTime(selectedEvent?.date)}</Text>
                </View>
                
                {/* Ajout du lien familial dans les détails avec vérification */}
                {selectedEvent?.lien_familial && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lien familial:</Text>
                    <Text style={styles.detailValue}>{selectedEvent.lien_familial}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("../indexPatient")}> <Ionicons name="home" size={28} color="#fff" /> </TouchableOpacity>
      </View>
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={22} color={BLUE} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un événement..."
          placeholderTextColor={BLUE}
          value={searchInput}
          onChangeText={setSearchInput}
        />
        {searchInput.length > 0 && (
          <TouchableOpacity style={styles.resetButton} onPress={handleResetSearch}>
            <Ionicons name="refresh" size={22} color={BLUE} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun événement médical enregistré</Text>}
      />
      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { backgroundColor: BLUE, height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 10 },
  headerIcon: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 6 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: BLUE, borderRadius: 12, marginHorizontal: 16, backgroundColor: '#fff', marginBottom: 10, paddingHorizontal: 8, height: 48 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 17, color: BLUE, paddingVertical: 8 },
  resetButton: { marginLeft: 8, padding: 4, borderRadius: 8, backgroundColor: '#eaf0ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 8 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#7f8c8d' },
  cardContainer: { flexDirection: 'row', borderWidth: 2, borderColor: BORDER_BLUE, borderRadius: 10, marginBottom: 18, backgroundColor: '#fff', padding: 8, minHeight: 140 },
  leftCol: { width: 90, alignItems: 'center', justifyContent: 'flex-start', marginRight: 8 },
  cardImage: { width: 40, height: 50, borderRadius: 8, backgroundColor: GREY, marginBottom: 8 },
  fileIconContainer: { width: 70, height: 70, borderRadius: 8, backgroundColor: GREY, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardButtonsRow: { flexDirection: 'column', width: '100%', alignItems: 'center', gap: 6 },
  cardButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 4 },
  cardButtonText: { color: '#fff', fontSize: 13, marginLeft: 4 },
  rightCol: { flex: 1, justifyContent: 'space-between' },
  infoBox: { borderWidth: 1, borderColor: BORDER_BLUE, borderRadius: 6, padding: 6, marginBottom: 8, backgroundColor: '#f8faff' },
  infoTitle: { fontSize: 13, color: BLUE, fontWeight: 'bold', marginBottom: 2 },
  infoText: { fontSize: 14, color: '#222' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, width: '90%', maxHeight: '80%', elevation: 5 },
  modalHeader: { backgroundColor: BLUE, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1 },
  closeButton: { padding: 5 },
  modalBody: { padding: 20 },
  documentImage: { width: 250, height: 250, borderRadius: 10, backgroundColor: GREY },
  fileContainer: { alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa', borderRadius: 10, width: '100%' },
  fileName: { marginTop: 10, fontSize: 16, color: BLUE, textAlign: 'center' },
  downloadButton: { backgroundColor: BLUE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  downloadButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  zoomButton: { backgroundColor: BLUE, borderRadius: 20, padding: 8, marginHorizontal: 10 },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  noFileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  noFileText: {
    color: '#777',
    fontSize: 16,
    marginTop: 10,
  },
  detailsContainer: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
    color: '#333',
  },
  detailValue: {
    flex: 1,
    color: '#555',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  downloadButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  fileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    width: '100%',
  },
  fileName: {
    marginTop: 10,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MedicalTracking;






















