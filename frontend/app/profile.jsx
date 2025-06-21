import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../utils/fetchNgrok';

const ProfilePatient = () => {
  const [patient, setPatient] = useState(null);
  const [rappelsCount, setRappelsCount] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedPatient, setEditedPatient] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingModifications, setPendingModifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Token manquant');
        const resPatient = await fetch(`${BASE_URL}/api/patients/thispatient`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("resPatient", resPatient);

        if (!resPatient.ok) throw new Error('Erreur patient');
        const patientData = await resPatient.json();
        console.log("patientData", patientData);
        setPatient(patientData);
        
        // Récupérer les modifications en attente pour ce patient
        fetchPendingModifications(token, patientData.id_patient);
        
        const resRappels = await fetch(`${BASE_URL}/api/rappels/thisrappels`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resRappels.ok) throw new Error('Erreur rappels');
        const rappels = await resRappels.json();

        const ajouterUnJour = (dateStr) => {
          const date = new Date(dateStr);
          date.setDate(date.getDate() + 1); // ajoute 1 jour en local
          return date;
        }; 

        const aujourdHui = new Date();

        const rappelsAujourdHui = rappels.filter(r => {
          if (!r.date_rappel) return false;
          const rappelDate = ajouterUnJour(r.date_rappel);
          const match = (
            rappelDate.getFullYear() === aujourdHui.getFullYear() &&
            rappelDate.getMonth() === aujourdHui.getMonth() &&
            rappelDate.getDate() === aujourdHui.getDate()
          );
          console.log(`Rappel : ${r.date_rappel} (+1 jour) => Match (Local) ? ${match}`);
          return match;
        });

        setRappelsCount(rappelsAujourdHui.length);
        console.log("Nb rappels aujourd'hui :", rappelsAujourdHui.length);
      } catch (err) {
        console.error('Erreur chargement profil :', err);
      }
    };

    fetchData();
  }, []);

  // Fonction pour récupérer les modifications en attente
  const fetchPendingModifications = async (token, patientId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/patient-profile-modifications/pending/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingModifications(data.modifications || []);
      }
    } catch (error) {
      console.error('Erreur récupération modifications en attente:', error);
    }
  };

  useEffect(() => {
    if (editModalVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Reset animations when modal is closed
        fadeAnim.setValue(0);
        slideAnim.setValue(300);
      });
    }
  }, [editModalVisible]);

  if (!patient) {
    return <Text style={styles.loading}>Chargement...</Text>;
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calculateAge = (birthDateString) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const personalInfos = [
    {
      key: 'nomcomplet',
      label: 'Nom Prenom',
      value: `${patient.prenom} ${patient.nom}`,
      icon: 'user',
    },
    {
      key: 'email',
      label: 'Email',
      value: patient.email,
      icon: 'envelope',
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      value: patient.telephone,
      icon: 'phone',
    },
    {
      key: 'adresse',
      label: 'Adresse',
      value: patient.adresse,
      icon: 'map',
    },
    {
      key: 'datenaissance',
      label: 'Date de naissance',
      value: formatDate(patient.datenaissance),
      icon: 'calendar',
    },
  ];

  const handleEdit = () => {
    if (!patient) return;
    setEditedPatient({
      nom: patient.nom || '',
      prenom: patient.prenom || '',
      telephone: patient.telephone || '',
      email: patient.email || '',
      adresse: patient.adresse || '',
      datenaissance: patient.datenaissance || ''
    });
    setEditModalVisible(true);
  };

  const handleCloseModal = () => {
    setErrors({});
    setEditModalVisible(false);
  };

  const handleSave = async () => {
    try {
      if (!editedPatient || !patient) {
        Alert.alert('Erreur', 'Données invalides');
        return;
      }

      // Vérification des champs obligatoires
      const newErrors = {};
      if (!editedPatient.prenom?.trim()) newErrors.prenom = 'Le prénom est obligatoire';
      if (!editedPatient.nom?.trim()) newErrors.nom = 'Le nom est obligatoire';
      if (!editedPatient.email?.trim()) newErrors.email = 'L\'email est obligatoire';
      if (!editedPatient.telephone?.trim()) newErrors.telephone = 'Le téléphone est obligatoire';
      if (!editedPatient.adresse?.trim()) newErrors.adresse = 'L\'adresse est obligatoire';
      if (!editedPatient.datenaissance) newErrors.datenaissance = 'La date de naissance est obligatoire';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Session expirée');
        return;
      }

      // Créer une modification en attente au lieu de mettre à jour directement
      const modificationData = {
        patientId: patient.id_patient,
        oldData: {
          nom: patient.nom,
          prenom: patient.prenom,
          email: patient.email,
          telephone: patient.telephone,
          adresse: patient.adresse,
          datenaissance: patient.datenaissance,
          profile_image: patient.profile_image
        },
        newData: {
          nom: editedPatient.nom,
          prenom: editedPatient.prenom,
          email: editedPatient.email,
          telephone: editedPatient.telephone,
          adresse: editedPatient.adresse,
          datenaissance: editedPatient.datenaissance,
          profile_image: editedPatient.profileImage || patient.profile_image
        }
      };

      const response = await fetch(`${BASE_URL}/api/patient-profile-modifications/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modificationData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Réponse du serveur après création modification:", JSON.stringify(result, null, 2));
        
        // Fermer le modal et afficher un message de succès
        setEditModalVisible(false);
        Alert.alert(
          'Modification en attente', 
          'Votre modification a été envoyée en attente d\'approbation par votre aidant. Vous recevrez une notification une fois approuvée.',
          [{ text: 'OK' }]
        );
        
        // Rafraîchir les données depuis le serveur
        fetchPendingModifications(token, patient.id_patient);
      } else {
        const errorData = await response.json();
        console.error("Erreur de création modification:", errorData);
        Alert.alert('Erreur', errorData.error || 'Impossible de créer la modification');
      }
    } catch (error) {
      console.error('Erreur création modification:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la modification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setEditedPatient(prev => ({
        ...prev,
        profileImage: result.assets[0].uri
      }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={() => router.push('./indexPatient')} style={styles.backIcon}>
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Afficher les modifications en attente */}
      {pendingModifications.length > 0 && (
        <View style={styles.pendingContainer}>
          <View style={styles.pendingHeader}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.pendingTitle}>Modifications en attente</Text>
          </View>
          <Text style={styles.pendingText}>
            Vous avez {pendingModifications.length} modification(s) en attente d'approbation par votre aidant
          </Text>
        </View>
      )}
      
      <View style={styles.profileContainer}>
        <Image
          source={patient && patient.profile_image ? 
            { uri: `${BASE_URL}/${patient.profile_image}` } : 
            require('../assets/default-avatar.png')}
          style={styles.avatar}
          onError={(e) => {
            console.error('Erreur de chargement de l\'image:', e.nativeEvent.error);
            // Fallback vers l'image par défaut en cas d'erreur
            setPatient(prev => ({
              ...prev,
              profile_image: null
            }));
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.fullname}>{patient.prenom} {patient.nom}</Text>
          <TouchableOpacity
            onPress={() => {
              const age = calculateAge(patient.datenaissance);
              const message = `Bonjour ${patient.prenom} ${patient.nom}, vous avez ${age} ans, votre ID est ${patient.id_patient}, toutes les autres informations sont au dessous.`;
              Speech.speak(message, { language: 'fr-FR' });
            }}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="mic" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.inlineSection}>
          <View style={styles.infoColumn}>
            <View style={styles.rowItem}>
              <FontAwesome5 name="id-card" size={20} color="#007bff" />
              <Text style={styles.inlineText}>ID: {patient.id_patient}</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.infoColumn}>
            <View style={styles.rowItem}>
              <FontAwesome5 name="birthday-cake" size={20} color="#007bff" />
              <Text style={styles.inlineText}>{calculateAge(patient.datenaissance)} ans</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <FlatList
          data={personalInfos}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <View style={styles.infoCard}>
              <View style={styles.iconLabelRow}>
                <FontAwesome5 name={item.icon} size={33} color="#007bff" style={{ marginRight: 10 }} />
                <Text style={styles.labelText}>{item.label}</Text>
              </View>
              <Text style={styles.valueText}>{item.value}</Text>
            </View>
          )}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        />

        <TouchableOpacity
          style={[
            styles.statButton,
            isSubmitting && styles.statButtonDisabled
          ]}
          onPress={handleEdit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Ionicons name="hourglass" size={28} color="white" />
              <Text style={styles.statText}>En attente...</Text>
            </>
          ) : (
            <>
              <Ionicons name="create" size={28} color="white" />
              <Text style={styles.statText}>Modifier</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal d'édition */}
      <Modal 
        visible={editModalVisible} 
        transparent 
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modal,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.modalClose} 
              onPress={handleCloseModal}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            
            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                <Image
                  source={profileImage ? 
                    { uri: profileImage } : 
                    (patient && patient.profile_image ? 
                      { uri: `${BASE_URL}/${patient.profile_image}` } : 
                      require('../assets/default-avatar.png'))}
                  style={styles.profileImage}
                />
                <View style={styles.imagePickerOverlay}>
                  <Ionicons name="camera" size={24} color="white" />
                  <Text style={styles.imagePickerText}>Changer la photo</Text>
                </View>
              </TouchableOpacity>

              <TextInput
                placeholder="Prénom *"
                value={editedPatient?.prenom}
                onChangeText={txt => {
                  setEditedPatient({...editedPatient, prenom: txt});
                  setErrors({...errors, prenom: ''});
                }}
                style={[
                  styles.input,
                  errors.prenom && styles.errorInput
                ]}
              />
              {errors.prenom && <Text style={styles.errorText}>{errors.prenom}</Text>}
              
              <TextInput
                placeholder="Nom *"
                value={editedPatient?.nom}
                onChangeText={txt => {
                  setEditedPatient({...editedPatient, nom: txt});
                  setErrors({...errors, nom: ''});
                }}
                style={[
                  styles.input,
                  errors.nom && styles.errorInput
                ]}
              />
              {errors.nom && <Text style={styles.errorText}>{errors.nom}</Text>}
              
              <TextInput
                placeholder="Email *"
                value={editedPatient?.email}
                onChangeText={txt => {
                  setEditedPatient({...editedPatient, email: txt});
                  setErrors({...errors, email: ''});
                }}
                style={[
                  styles.input,
                  errors.email && styles.errorInput
                ]}
                keyboardType="email-address"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              
              <TextInput
                placeholder="Téléphone *"
                value={editedPatient?.telephone}
                onChangeText={txt => {
                  setEditedPatient({...editedPatient, telephone: txt});
                  setErrors({...errors, telephone: ''});
                }}
                style={[
                  styles.input,
                  errors.telephone && styles.errorInput
                ]}
                keyboardType="phone-pad"
              />
              {errors.telephone && <Text style={styles.errorText}>{errors.telephone}</Text>}
              
              <TextInput
                placeholder="Adresse *"
                value={editedPatient?.adresse}
                onChangeText={txt => {
                  setEditedPatient({...editedPatient, adresse: txt});
                  setErrors({...errors, adresse: ''});
                }}
                style={[
                  styles.input,
                  errors.adresse && styles.errorInput
                ]}
              />
              {errors.adresse && <Text style={styles.errorText}>{errors.adresse}</Text>}

              <TouchableOpacity 
                style={[
                  styles.dateInput,
                  errors.datenaissance && styles.errorInput
                ]}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={styles.dateInputText}>
                  {editedPatient?.datenaissance ? formatDate(editedPatient.datenaissance) : 'Date de naissance *'}
                </Text>
              </TouchableOpacity>
              {errors.datenaissance && <Text style={styles.errorText}>{errors.datenaissance}</Text>}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={handleCloseModal}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveBtn,
                  isSubmitting && styles.saveBtnDisabled
                ]} 
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Text style={styles.saveBtnText}>Envoi...</Text>
                ) : (
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        date={editedPatient?.datenaissance ? new Date(editedPatient.datenaissance) : new Date()}
        onConfirm={date => {
          setDatePickerVisible(false);
          setEditedPatient(prev => ({
            ...prev,
            datenaissance: date.toISOString().split('T')[0]
          }));
          setErrors({...errors, datenaissance: ''});
        }}
        onCancel={() => setDatePickerVisible(false)}
        maximumDate={new Date()}
      />
    </View>
  );
};

export default ProfilePatient;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loading: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 18,
  },
  header: {
    backgroundColor: '#007bff',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  backIcon: {
    position: 'absolute',
    top: 55,
    right: 20,
  },
  profileContainer: {
    backgroundColor: '#fff',
    top: 5,
    margin: 25,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    marginBottom: 10,
  },
  fullname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 15,
  },
  inlineSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  infoColumn: {
    flex: 1,
    alignItems: 'center',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  verticalDivider: {
    width: 1.5,
    height: 35,
    backgroundColor: '#90caf9',
  },
  infoCard: {
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 2,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 20,
    color: '#007bff',
    fontWeight: '600',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginTop: 6,
  },
  statButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    marginBottom: 50,
    padding: 16,
    borderRadius: 30,
    backgroundColor: '#FF9500',
    borderWidth: 0,
  },
  statText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
    marginLeft: 12,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: 300,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  errorInput: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  imagePickerContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007bff',
    backgroundColor: '#f0f0f0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  imagePickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    alignItems: 'center',
  },
  imagePickerText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  pendingContainer: {
    backgroundColor: '#FFF3E0',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#666',
  },
  statButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
});
