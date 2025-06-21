import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  Animated,
  Easing,
  Clipboard,
  Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import Communications from 'react-native-communications';
import { BASE_URL } from "../utils/fetchNgrok";
import Svg, { Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';


const BLUE = "#2A62F9";
const LIGHT_BLUE = "#C0D2FF";
const BORDER_BLUE = "#A2A7F9";
const CARD_BG = "#DBECFF";
const GREEN = "#08AF62";
const YELLOW = "#FEC303";
const ORANGE = "#FF9800";
const RED = "#FF6347";
const GREY = "#EFEFEF";

const ProgressCircle = ({ percent, color, value }) => {
  const size = 60;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - percent / 100);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#e0e0e0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <Text style={{ position: 'absolute', fontSize: 20, color: color, fontWeight: 'bold' }}>{value}</Text>
    </View>
  );
};

export default function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aidantId, setAidantId] = useState("");
  const [token, setToken] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [aidantName, setAidantName] = useState("");
  const [modalAnim] = useState(new Animated.Value(0));
  const [addPatientModalVisible, setAddPatientModalVisible] = useState(false);
  const [addPatientId, setAddPatientId] = useState("");
  const [addPatientIdBorderColor, setAddPatientIdBorderColor] = useState(BORDER_BLUE);
  const [lienFamilial, setLienFamilial] = useState("");
  const [lienFamilialBorderColor, setLienFamilialBorderColor] = useState(BORDER_BLUE);
  const [image, setImage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const _aidantId = await AsyncStorage.getItem("userId");
        console.log("fetch patients for aidant id :",_aidantId);
        const _token = await AsyncStorage.getItem("token");
        const _aidantName = await AsyncStorage.getItem("aidantName");
        setAidantId(_aidantId);
        setToken(_token);
        setAidantName(_aidantName || "Nom de l'Aidant");
        if (!_aidantId || !_token) throw new Error("Missing credentials");
        const response = await fetch(`${BASE_URL}/api/aidants/${_aidantId}/getPatients`, {
          headers: { 'Authorization': `Bearer ${_token}` }
        });
        console.log
        if (!response.ok) throw new Error("Erreur lors de la récupération des patients");
        const data = await response.json();
        setPatients(data);
        console.log("patients:",data);
        setFilteredPatients(data);
        if (data.length > 0) {
          setSelectedPatient(data[0]);
        }
      } catch (e) {
        Alert.alert("Erreur", e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (nameInput === "") {
      setFilteredPatients(patients);
      return;
    }
    setFilteredPatients(
      patients.filter(p =>
        `${p.nompatient} ${p.prenompatient} ${p.id_patient}`.toLowerCase().includes(nameInput.toLowerCase())
      )
    );
  }, [nameInput, patients]);

  const calculateAge = (dateStr) => {
    if (!dateStr) return '';
    const birthDate = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const checkPatientExists = async (patientId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/patients/${patientId}`);
      console.log("response thispatient:",response);
      if (response.ok) {
        setAddPatientIdBorderColor(GREEN);
        return true;
      } else {
        setAddPatientIdBorderColor(RED);
        console.log("patient deja exist:",patientId);
        return false;
      }
    } catch (error) {
      setAddPatientIdBorderColor(RED);
      console.log("patient deja exist:",patientId);
      return false;
    }
  };

  const checkPatientAlreadyAssociated = async (patientId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/aidants/${aidantId}/getPatients`);
      if (response.ok) {
        const patients = await response.json();
        return patients.some(p => p.id_patient === patientId);
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleAddPatient = async () => {
    if (!addPatientId || !lienFamilial) {
      if (!addPatientId) setAddPatientIdBorderColor(RED);
      if (!lienFamilial) setLienFamilialBorderColor(RED);
      Alert.alert("Erreur", "Tous les champs sont obligatoires");
      return;
    }

    const patientExists = await checkPatientExists(addPatientId);
    if (!patientExists) {
      Alert.alert("Erreur", "Patient non trouvé");
      return;
    }

    const alreadyAssociated = await checkPatientAlreadyAssociated(addPatientId);
    if (alreadyAssociated) {
      Alert.alert("Erreur", "Ce patient est déjà associé à votre compte");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('aidantId', aidantId);
      formData.append('patientId', addPatientId);
      formData.append('lienFamilial', lienFamilial);
      formData.append('token', token);

      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('fichier', {
          uri: image,
          name: filename,
          type,
        });
      }

      const response = await fetch(`${BASE_URL}/api/aidants/addPatientForAidant`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Succès", "Patient ajouté avec succès");
        setAddPatientModalVisible(false);
        setAddPatientId("");
        setLienFamilial("");
        setAddPatientIdBorderColor(BORDER_BLUE);
        setLienFamilialBorderColor(BORDER_BLUE);
        const updatedResponse = await fetch(`${BASE_URL}/api/aidants/${aidantId}/getPatients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (updatedResponse.ok) {
          const data = await updatedResponse.json();
          setPatients(data);
          setFilteredPatients(data);
        }
      } else {
        throw new Error("Relation avec ce patient existe déja!");
      }
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleDeletePatient = async (patientId) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce patient ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/aidants/removePatient`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ aidantId, patientId }),
              });
              if (response.ok) {
                setPatients(prev => prev.filter(p => p.id_patient !== patientId));
                setFilteredPatients(prev => prev.filter(p => p.id_patient !== patientId));
                Alert.alert("Succès", "Patient supprimé avec succès");
              } else {
                throw new Error("Erreur lors de la suppression du patient");
              }
            } catch (e) {
              Alert.alert("Erreur", e.message);
            }
          }
        }
      ]
    );
  };

  const openStatsModal = async (patient) => {
    setStatsLoading(true);
    setModalVisible(true);
    setSelectedPatient(patient);
    try {
      const response = await fetch(`${BASE_URL}/api/rappels/patient/${patient.id_patient}/stats`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des statistiques");
      const stats = await response.json();
      setStats(stats);
    } catch (e) {
      setStats(null);
      Alert.alert("Erreur", "Impossible de charger les statistiques");
    } finally {
      setStatsLoading(false);
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true
      }).start();
    }
  };

  const closeStatsModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      setModalVisible(false);
      setStats(null);
      setSelectedPatient(null);
    });
  };

  const handleCopyId = (id) => {
    Clipboard.setString(id);
    Alert.alert("ID copié:", id);
  };

  const openAddPatientModal = () => {
    setAddPatientModalVisible(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  const closeAddPatientModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setAddPatientModalVisible(false);
      setAddPatientId("");
      setLienFamilial("");
      setAddPatientIdBorderColor(BORDER_BLUE);
      setLienFamilialBorderColor(BORDER_BLUE);
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin des permissions pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Image,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const renderPatient = ({ item }) => (
    <View style={[styles.patientCard, { borderColor: BORDER_BLUE }]}> 
      <View style={styles.leftCard}>
        <View style={styles.photoBox}>
          <Image 
            source={
              item.profile_image 
                ? { uri: `${BASE_URL}/${item.profile_image}` } 
                : require('../assets/default-avatar.png')
            } 
            style={styles.photo}
            onError={(e) => {
              console.error('Erreur de chargement de l\'image:', e.nativeEvent.error);
              // Fallback vers l'image par défaut en cas d'erreur
            }}
          />
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="people" size={18} color={BLUE} style={{marginRight:4}} />
          <Text style={styles.leftText}>{item.lien_familial}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="cake" size={18} color={BLUE} style={{marginRight:4}} />
          <Text style={styles.leftText}>{calculateAge(item.datenaissance)} ans</Text>
        </View>
      </View>
      <View style={styles.rightCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}><MaterialIcons name="person" size={20} color={BLUE} /></View>
          <Text style={styles.infoText}>{item.nompatient} {item.prenompatient}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}><MaterialIcons name="home" size={20} color={BLUE} /></View>
          <Text style={styles.infoText}>{item.adresspat}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}><MaterialIcons name="phone" size={20} color={BLUE} /></View>
          <Text style={styles.infoText}>{item.telephpatient}</Text>
          <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.telephpatient}`)}>
            <MaterialIcons name="call" size={22} color={"#fff"} />
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}><MaterialIcons name="email" size={20} color={BLUE} /></View>
          <Text style={styles.infoText}>{item.emailpatient}</Text>
          <TouchableOpacity style={styles.mailBtn} onPress={() => Communications.email([item.emailpatient],null,null,'','')}>
            <MaterialIcons name="mail" size={22} color={"#fff"} />
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePatient(item.id_patient)}>
            <MaterialIcons name="delete" size={18} color="#fff" />
            <Text style={styles.deleteText}>Supprimer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statsBtn} onPress={() => openStatsModal(item)}>
            <Ionicons name="stats-chart" size={18} color="#fff" />
            <Text style={styles.statsText}>Statistics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{width:40}} />
        <Text style={styles.headerTitle}>Patients</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("/AccueilAidant")}> 
          <MaterialIcons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>


      <View style={styles.searchBarContainer}>
        <Feather name="search" size={22} color={BLUE} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un patient..."
          placeholderTextColor={BLUE}
          value={nameInput}
          onChangeText={setNameInput}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BLUE} style={{ flex: 1, marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatient}
          keyExtractor={item => item.id_patient}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun patient trouvé.</Text>}
        />
      )}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={openAddPatientModal}
      >
        <AntDesign name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={addPatientModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeAddPatientModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay, 
            { 
              opacity: modalAnim,
              backgroundColor: 'rgba(0,0,0,0.5)'
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.modalContent, 
            {
              transform: [{ 
                scale: modalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }],
              opacity: modalAnim
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajouter un patient</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeAddPatientModal}>
              <AntDesign name="closecircle" size={26} color={BLUE} />
            </TouchableOpacity>
          </View>

          <View style={[styles.idInputContainer, { borderColor: addPatientIdBorderColor }]}>
            <TextInput
              style={styles.idInput}
              placeholder="ID patient* (ex: 1AB23HJ9)"
              placeholderTextColor="#A2A7F9"
              value={addPatientId}
              autoCapitalize="characters"
              onChangeText={txt => {
                setAddPatientId(txt.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
                setAddPatientIdBorderColor(BORDER_BLUE);
              }}
              maxLength={12}
            />
          </View>

          <View style={[styles.idInputContainer, { borderColor: lienFamilialBorderColor }]}>
            <TextInput
              style={styles.idInput}
              placeholder="Saisir lien familial*"
              placeholderTextColor="#A2A7F9"
              value={lienFamilial}
              onChangeText={txt => {
                setLienFamilial(txt);
                setLienFamilialBorderColor(BORDER_BLUE);
              }}
            />
          </View>

          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleAddPatient}
          >
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeStatsModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalAnim }]}/>
        <Animated.View style={[styles.modalContent, {
          transform: [{ scale: modalAnim.interpolate({ inputRange: [0,1], outputRange: [0.8,1] }) }],
          opacity: modalAnim
        }]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalstyle}>
              <Text style={styles.modalTitle}>Statistics</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={closeStatsModal}>
                <AntDesign name="closecircle" size={26} color={BLUE} />
              </TouchableOpacity>
            </View>
            
            {selectedPatient && (
              <View style={styles.modalPatientInfo}>
                <Image 
                  source={
                    selectedPatient.profile_image 
                      ? { uri: `${BASE_URL}/${selectedPatient.profile_image}` } 
                      : require('../assets/default-avatar.png')
                  } 
                  style={styles.modalPatientPhoto}
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image dans le modal:', e.nativeEvent.error);
                  }}
                />
                <Text style={styles.modalPatientName}>
                  {selectedPatient.nompatient} {selectedPatient.prenompatient}
                </Text>
              </View>
            )}

          </View>
          {statsLoading ? (
            <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 40 }} />
          ) : stats ? (
            <View>
                <View style={styles.statsBar}>
                <Text style={styles.statsBarText}>Nombre des aidants</Text>
                <View style={styles.statsValueBox}><Text style={styles.statsValue}>{stats.aidants}</Text></View>
              </View>
                <View style={styles.statsBar}>
                <Text style={styles.statsBarText}>Rappels d'aujourd'hui:</Text>
                <View style={styles.statsValueBox}><Text style={styles.statsValue}>{stats.today}</Text></View>
              </View>
              <View style={styles.statsBar}>
                <Text style={styles.statsBarText}>Nombre des rappels</Text>
                <View style={styles.statsValueBox}><Text style={styles.statsValue}>{stats.total}</Text></View>
              </View>
              <View style={styles.statsRow}> 
                <View style={styles.statsCardConf}>
                  <Text style={styles.statsCardTitleConf}>confirmés</Text>
                  <ProgressCircle percent={stats.confPct} color={GREEN} value={stats.confirmes} />
                </View>
                <View style={styles.statsCardFav}>
                  <Text style={styles.statsCardTitleFav}>Favoris</Text>
                  <ProgressCircle percent={stats.favPct} color={YELLOW} value={stats.favoris} />
                </View>
              </View>

            </View>
          ) : (
            <Text style={styles.emptyText}>Erreur lors du chargement des statistiques.</Text>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GREY,
    paddingTop: 0,
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
  patientsContainer: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  patientsList: {
    paddingHorizontal: 10,
  },
  patientCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: BORDER_BLUE,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  leftCard: {
    width: 110,
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderRightWidth: 2,
    borderColor: '#DBECFF',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'center',
  },
  photoBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DBECFF',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0', // Couleur de fond en attendant le chargement
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    flexWrap: 'wrap',
  },
  leftText: {
    fontSize: 13,
    color: BLUE,
    fontWeight: 'bold',
  },
  rightCard: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  iconBox: {
    borderWidth: 1.5,
    borderColor: BORDER_BLUE,
    borderRadius: 8,
    padding: 3,
    marginRight: 7,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  callBtn: {
    backgroundColor: GREEN,
    borderRadius: 8,
    padding: 5,
    marginLeft: 8,
  },
  mailBtn: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    padding: 5,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 15,
  },
  statsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BLUE,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginLeft: 10,
  },
  statsText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 18,
    marginTop: 40,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  modalContent: {
    position: 'absolute',
    top: '30%',
    left: '7%',
    right: '7%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 25,
    zIndex: 2,
    elevation: 10,

  },
  modalHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalstyle: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 22,
    color: BLUE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    borderRadius: 10,
    marginVertical: 7,
    padding: 7,
    justifyContent: 'space-between',
  },
  statsBarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsValueBox: {
    backgroundColor: '#ABC1FC',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginLeft: 10,
  },
  statsValue: {
    color: BLUE,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  statsCardConf: {
    backgroundColor: '#D8EFE4',
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    padding: 10,
  },
  statsCardFav: {
    backgroundColor: '#EFEED8',
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    padding: 10,
  },
  statsCardTitleConf: {
    color: GREEN,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  statsCardTitleFav: {
    color: YELLOW,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmButton: {
    backgroundColor: BLUE,
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  idInputContainer: {
    borderWidth: 2,
    borderRadius: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  idInput: {
    flex: 1,
    fontSize: 18,
    color: BLUE,
    letterSpacing: 2,
    paddingVertical: 10,
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
  },
  patientId: {
    fontSize: 14,
    color: '#888',
  },
  modalPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalPatientPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: BORDER_BLUE,
  },
  modalPatientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BLUE,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BORDER_BLUE,
    marginBottom: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerText: {
    color: BLUE,
    fontSize: 16,
  },
});











