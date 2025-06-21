import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { BASE_URL } from '../../utils/fetchNgrok';


const AddEventModal = ({ visible, onClose, onSave, event }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [document, setDocument] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date'); // 'date' ou 'time'

  useEffect(() => {
    if (event) {
      setTitle(event.titre);
      setDescription(event.description || '');
      setDate(new Date(event.date_event));
      setDocument(
        event.fichier_path 
          ? { 
              uri: `${BASE_URL}/${event.fichier_path}`,
              type: event.fichier_type,
              name: event.fichier_path.split('/').pop()
            } 
          : null
      );
    } else {
      resetForm();
    }
  }, [event]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date());
    setDocument(null);
  };

  // Gestion améliorée du DateTimePicker pour Android
  const showDatePickerHandler = () => {
    // Sur Android, on affiche d'abord le sélecteur de date
    setDatePickerMode('date');
    setShowDatePicker(true);
  };

  const onChangeDate = (event, selectedDate) => {
    // Fermer le picker sur Android après chaque sélection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      // Mettre à jour la date
      setDate(prevDate => {
        const newDate = new Date(prevDate);
        
        if (datePickerMode === 'date') {
          // Si on a sélectionné une date, conserver l'heure actuelle
          newDate.setFullYear(selectedDate.getFullYear());
          newDate.setMonth(selectedDate.getMonth());
          newDate.setDate(selectedDate.getDate());
          
          // Sur Android, afficher ensuite le sélecteur d'heure
          if (Platform.OS === 'android') {
            setTimeout(() => {
              setDatePickerMode('time');
              setShowDatePicker(true);
            }, 500);
          }
        } else {
          // Si on a sélectionné une heure, conserver la date actuelle
          newDate.setHours(selectedDate.getHours());
          newDate.setMinutes(selectedDate.getMinutes());
        }
        
        return newDate;
      });
    }
  };

  // Fonction pour sélectionner une image avec gestion des limitations d'Expo Go
  const pickImage = async () => {
    try {
      // Vérifier les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "Nous avons besoin de votre permission pour accéder à la galerie.");
        return;
      }
      
      // Configuration simplifiée pour Expo Go
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correction ici: MediaTypeOptions au lieu de MediaType
        allowsEditing: false,
        quality: 0.5,
      });
      
      console.log("Résultat ImagePicker:", JSON.stringify(result, null, 2)); // Log pour déboguer
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Vérifier si l'URI est valide
        if (!selectedAsset.uri) {
          throw new Error("URI de l'image non disponible");
        }
        
        // Vérifier si le fichier existe
        const fileInfo = await FileSystem.getInfoAsync(selectedAsset.uri);
        if (!fileInfo.exists) {
          throw new Error("Le fichier image n'existe pas");
        }
        console.log("Fichier image:", fileInfo);
        
        // Déterminer le type MIME à partir de l'URI
        const mimeType = selectedAsset.type || 
                         (selectedAsset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
        
        setDocument({
          uri: selectedAsset.uri,
          type: mimeType,
          name: selectedAsset.fileName || `photo_${Date.now()}.${mimeType.split('/')[1]}`,
        });
      }
    } catch (error) {
      console.error("Erreur détaillée:", error);
      Alert.alert("Erreur", `Problème lors de la sélection de l'image: ${error.message || "Erreur inconnue"}`);
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: false,
      });

      if (result.assets && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType,
          name: result.assets[0].name
        });
      }
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite lors de la sélection du document");
      console.error(error);
    }
  };

  const removeDocument = () => {
    setDocument(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir un titre pour l\'événement');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Log pour déboguer
      console.log("Document à envoyer:", document);
      
      await onSave({
        title,
        description,
        date,
        document
      });
      
      onClose();
    } catch (error) {
      Alert.alert('Erreur', "Une erreur s'est produite lors de l'enregistrement");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {event ? 'Modifier Événement' : 'Nouvel Événement Médical'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isProcessing}>
              <Ionicons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Consultation cardiologique"
            value={title}
            onChangeText={setTitle}
            editable={!isProcessing}
          />

          <Text style={styles.label}>Date et heure *</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={showDatePickerHandler}
            disabled={isProcessing}
          >
            <Text>{date.toLocaleString('fr-FR')}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={datePickerMode}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              locale="fr-FR"
            />
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Détails supplémentaires (optionnel)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!isProcessing}
          />

          <Text style={styles.label}>Document associé</Text>
          
          {document ? (
            <View style={styles.documentPreview}>
              {document.type.includes('image') ? (
                <Image 
                  source={{ uri: document.uri }} 
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.fileInfo}>
                  <Ionicons name="document" size={32} color="#3498db" />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {document.name}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeDocButton}
                onPress={removeDocument}
                disabled={isProcessing}
              >
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.documentButtons}>
              <TouchableOpacity 
                style={[styles.docButton, { marginRight: 10 }]}
                onPress={pickImage}
                disabled={isProcessing}
              >
                <Ionicons name="image" size={20} color="#fff" />
                <Text style={styles.docButtonText}>Ajouter une photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.docButton}
                onPress={handleDocumentPick}
                disabled={isProcessing}
              >
                <Ionicons name="document" size={20} color="#fff" />
                <Text style={styles.docButtonText}>Ajouter un document</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {event ? 'Mettre à jour' : 'Enregistrer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  documentButtons: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  docButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  documentPreview: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    borderRadius: 5,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  fileName: {
    marginLeft: 10,
    flex: 1,
    color: '#2d3436',
  },
  removeDocButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddEventModal;









