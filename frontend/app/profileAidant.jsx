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

const ProfileAidant = () => {
  const [aidant, setAidant] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedAidant, setEditedAidant] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const router = useRouter();

  // Fonction pour récupérer les données de l'aidant
  const fetchAidantData = async (token) => {
    try {
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      
      if (!token) {
        throw new Error('Token manquant');
      }
      
      const resAidant = await fetch(`${BASE_URL}/api/aidants/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resAidant.ok) throw new Error('Erreur aidant');
      const aidantData = await resAidant.json();
      
      // Log pour déboguer
      console.log("Données reçues du serveur:", JSON.stringify(aidantData, null, 2));
      
      // Vérifier si la date de naissance est présente et sous quel nom
      if (aidantData.d_naissanceaidant && !aidantData.dateNaissance) {
        aidantData.dateNaissance = aidantData.d_naissanceaidant;
      }
      
      setAidant(aidantData);
    } catch (err) {
      console.error('Erreur chargement profil :', err);
    }
  };

  useEffect(() => {
    fetchAidantData();
  }, []);

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
        fadeAnim.setValue(0);
        slideAnim.setValue(300);
      });
    }
  }, [editModalVisible]);

  if (!aidant) {
    return <Text style={styles.loading}>Chargement...</Text>;
  }

  const formatDate = (isoString) => {
    try {
      if (!isoString) return 'Non définie';
      
      // Vérifier si la date est déjà au format JJ-MM-AAAA
      if (/^\d{2}-\d{2}-\d{4}$/.test(isoString)) {
        return isoString;
      }
      
      // Essayer de parser la date
      const date = new Date(isoString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.error('Date invalide:', isoString);
        return 'Format invalide';
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Erreur formatDate:', error);
      return 'Erreur format';
    }
  };

  const calculateAge = (birthDateString) => {
    try {
      if (!birthDateString) return 'N/A';
      
      // Essayer de parser la date
      const birthDate = new Date(birthDateString);
      
      // Vérifier si la date est valide
      if (isNaN(birthDate.getTime())) {
        console.error('Date de naissance invalide:', birthDateString);
        return 'N/A';
      }
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      console.error('Erreur calculateAge:', error);
      return 'N/A';
    }
  };

  const personalInfos = [
    {
      key: 'nomcomplet',
      label: 'Nom Prenom',
      value: `${aidant.prenom} ${aidant.nom}`,
      icon: 'user',
    },
    {
      key: 'email',
      label: 'Email',
      value: aidant.email,
      icon: 'envelope',
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      value: aidant.telephone,
      icon: 'phone',
    },
    {
      key: 'datenaissance',
      label: 'Date de naissance',
      value: formatDate(aidant.dateNaissance || aidant.d_naissanceaidant),
      icon: 'calendar',
    },
  ];

  const handleEdit = () => {
    if (!aidant) return;
    
    // Log pour déboguer
    console.log("Données aidant avant édition:", JSON.stringify(aidant, null, 2));
    
    // Déterminer quelle propriété utiliser pour la date de naissance
    let dateNaissance = aidant.dateNaissance || aidant.d_naissanceaidant || '';
    
    setEditedAidant({
      nom: aidant.nom || '',
      prenom: aidant.prenom || '',
      telephone: aidant.telephone || '',
      email: aidant.email || '',
      dateNaissance: dateNaissance
    });
    
    console.log("Données éditées:", {
      nom: aidant.nom || '',
      prenom: aidant.prenom || '',
      telephone: aidant.telephone || '',
      email: aidant.email || '',
      dateNaissance: dateNaissance
    });
    
    setEditModalVisible(true);
  };

  const handleCloseModal = () => {
    setErrors({});
    setEditModalVisible(false);
  };

  const handleSave = async () => {
    try {
      if (!editedAidant || !aidant) {
        Alert.alert('Erreur', 'Données invalides');
        return;
      }

      // Vérification des champs obligatoires
      const newErrors = {};
      if (!editedAidant.prenom?.trim()) newErrors.prenom = 'Le prénom est obligatoire';
      if (!editedAidant.nom?.trim()) newErrors.nom = 'Le nom est obligatoire';
      if (!editedAidant.email?.trim()) newErrors.email = 'L\'email est obligatoire';
      if (!editedAidant.telephone?.trim()) newErrors.telephone = 'Le téléphone est obligatoire';
      if (!editedAidant.dateNaissance) newErrors.dateNaissance = 'La date de naissance est obligatoire';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Session expirée');
        return;
      }

      const formData = new FormData();
      formData.append('nom', editedAidant.nom);
      formData.append('prenom', editedAidant.prenom);
      formData.append('telephone', editedAidant.telephone);
      formData.append('email', editedAidant.email);
      formData.append('dateNaissance', editedAidant.dateNaissance);
      
      // Log pour déboguer
      console.log("Données envoyées au serveur:", {
        nom: editedAidant.nom,
        prenom: editedAidant.prenom,
        telephone: editedAidant.telephone,
        email: editedAidant.email,
        dateNaissance: editedAidant.dateNaissance
      });

      if (editedAidant.profileImage) {
        const imageUri = editedAidant.profileImage;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('profileImage', {
          uri: imageUri,
          name: filename,
          type
        });
      }

      try {
        const response = await fetch(`${BASE_URL}/api/aidants/${aidant.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData
        });

        if (response.ok) {
          const updatedAidant = await response.json();
          console.log("Réponse du serveur après mise à jour:", JSON.stringify(updatedAidant, null, 2));
          
          // S'assurer que dateNaissance est défini
          if (!updatedAidant.dateNaissance && updatedAidant.d_naissanceaidant) {
            updatedAidant.dateNaissance = updatedAidant.d_naissanceaidant;
          }
          
          // Mettre à jour l'état avec les nouvelles données
          setAidant(updatedAidant);
          
          // Fermer le modal et afficher un message de succès
          setEditModalVisible(false);
          Alert.alert('Succès', 'Profil mis à jour avec succès');
          
          // Rafraîchir les données depuis le serveur
          fetchAidantData(token);
        } else {
          const errorData = await response.json();
          console.error("Erreur de mise à jour:", errorData);
          Alert.alert('Erreur', errorData.error || 'Impossible de mettre à jour le profil');
        }
      } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur générale:', error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
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
      setEditedAidant(prev => ({
        ...prev,
        profileImage: result.assets[0].uri
      }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={() => router.push('./AccueilAidant')} style={styles.backIcon}>
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileContainer}>
        <Image
          source={aidant && aidant.image_url ? 
            { uri: aidant.full_image_url || `${BASE_URL}/${aidant.image_url.replace(/^.*[\\\/]/, '')}` } : 
            require('../assets/default-avatar.png')}
          style={styles.avatar}
          onError={(e) => {
            // Essayer avec une URL alternative
            if (aidant && aidant.image_url) {
              // Extraire juste le nom du fichier
              const filename = aidant.image_url.split('/').pop();
              setAidant(prev => ({
                ...prev,
                full_image_url: `${BASE_URL}/uploads/profiles/${filename}`
              }));
            } else {
              setAidant(prev => ({
                ...prev,
                image_url: null
              }));
            }
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.fullname}>{aidant.prenom} {aidant.nom}</Text>
          <TouchableOpacity
            onPress={() => {
              const dateNaissance = aidant.dateNaissance || aidant.d_naissanceaidant;
              const age = calculateAge(dateNaissance);
              console.log("Date de naissance:", dateNaissance);
              console.log("Age calculé:", age);
              
              let message;
                message = `Bonjour ${aidant.prenom} ${aidant.nom}, vous avez ${age} ans, votre ID est ${aidant.id}, toutes les autres informations sont au dessous.`;
                           
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
              <Text style={styles.inlineText}>ID: {aidant.id_aidant}</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.infoColumn}>
            <View style={styles.rowItem}>
              <FontAwesome5 name="birthday-cake" size={20} color="#007bff" />
              <Text style={styles.inlineText}>
                {typeof calculateAge(aidant.dateNaissance || aidant.d_naissanceaidant) === 'number' 
                  ? `${calculateAge(aidant.dateNaissance || aidant.d_naissanceaidant)} ans` 
                  : calculateAge(aidant.dateNaissance || aidant.d_naissanceaidant)}
              </Text>
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
          style={styles.statButton}
          onPress={handleEdit}
        >
          <Ionicons name="create" size={28} color="white" />
          <Text style={styles.statText}>Modifier</Text>
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
                    (aidant && aidant.image_url ? 
                      { uri: aidant.full_image_url || `${BASE_URL}/${aidant.image_url.replace(/^.*[\\\/]/, '')}` } : 
                      require('../assets/default-avatar.png'))}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image dans le modal:', e.nativeEvent.error);
                    // Fallback vers l'image par défaut en cas d'erreur
                    if (aidant && aidant.image_url) {
                      const filename = aidant.image_url.split('/').pop();
                      setAidant(prev => ({
                        ...prev,
                        full_image_url: `${BASE_URL}/uploads/profiles/${filename}`
                      }));
                    }
                  }}
                />
                <View style={styles.imagePickerOverlay}>
                  <Ionicons name="camera" size={24} color="white" />
                  <Text style={styles.imagePickerText}>Changer la photo</Text>
                </View>
              </TouchableOpacity>

              <TextInput
                placeholder="Prénom *"
                value={editedAidant?.prenom}
                onChangeText={txt => {
                  setEditedAidant({...editedAidant, prenom: txt});
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
                value={editedAidant?.nom}
                onChangeText={txt => {
                  setEditedAidant({...editedAidant, nom: txt});
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
                value={editedAidant?.email}
                onChangeText={txt => {
                  setEditedAidant({...editedAidant, email: txt});
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
                value={editedAidant?.telephone}
                onChangeText={txt => {
                  setEditedAidant({...editedAidant, telephone: txt});
                  setErrors({...errors, telephone: ''});
                }}
                style={[
                  styles.input,
                  errors.telephone && styles.errorInput
                ]}
                keyboardType="phone-pad"
              />
              {errors.telephone && <Text style={styles.errorText}>{errors.telephone}</Text>}

              <TouchableOpacity 
                style={[
                  styles.dateInput,
                  errors.dateNaissance && styles.errorInput
                ]}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={styles.dateInputText}>
                  {editedAidant?.dateNaissance ? formatDate(editedAidant.dateNaissance) : 'Date de naissance *'}
                </Text>
              </TouchableOpacity>
              {errors.dateNaissance && <Text style={styles.errorText}>{errors.dateNaissance}</Text>}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        date={editedAidant?.dateNaissance ? new Date(editedAidant.dateNaissance) : new Date()}
        onConfirm={date => {
          setDatePickerVisible(false);
          setEditedAidant(prev => ({
            ...prev,
            dateNaissance: date.toISOString().split('T')[0]
          }));
          setErrors({...errors, dateNaissance: ''});
        }}
        onCancel={() => setDatePickerVisible(false)}
        maximumDate={new Date()}
      />
    </View>
  );
};

export default ProfileAidant;

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
}); 
