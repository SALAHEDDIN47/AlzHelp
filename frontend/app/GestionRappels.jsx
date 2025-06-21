import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, TextInput, Clipboard, Animated, Easing, ActivityIndicator, Dimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, Feather, FontAwesome } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { BASE_URL } from '@/utils/fetchNgrok';
import { fetchWithToken } from '../utils/fetchNgrok';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, G } from 'react-native-svg';

dayjs.locale('fr');

const TYPES = [
  { 
    name: 'Médicament', 
    color: '#4CAF50', 
    lightColor: '#E8F5E9',
    icon: 'local-pharmacy',
    faIcon: 'pills'
  },
  { 
    name: 'Communication', 
    color: '#2196F3', 
    lightColor: '#E3F2FD',
    icon: 'chat',
    faIcon: 'comments'
  },
  { 
    name: 'Quotidien', 
    color: '#FF9800', 
    lightColor: '#FFF3E0',
    icon: 'schedule',
    faIcon: 'sun'
  },
  { 
    name: 'Sécurité', 
    color: '#F44336', 
    lightColor: '#FFEBEE',
    icon: 'warning',
    faIcon: 'shield-alt'
  },
  { 
    name: 'Activité', 
    color: '#9C27B0', 
    lightColor: '#F3E5F5',
    icon: 'directions-run',
    faIcon: 'gamepad'
  },
  { 
    name: 'Événement', 
    color: '#3F51B5', 
    lightColor: '#E8EAF6',
    icon: 'event',
    faIcon: 'calendar'
  },
  { 
    name: 'Rendez-vous', 
    color: '#009688', 
    lightColor: '#E0F2F1',
    icon: 'event-available',
    faIcon: 'calendar-check'
  },
  { 
    name: 'Hydratation', 
    color: '#00BCD4', 
    lightColor: '#E0F7FA',
    icon: 'opacity',
    faIcon: 'tint'
  },
  { 
    name: 'Nutrition', 
    color: '#FFC107', 
    lightColor: '#FFF8E1',
    icon: 'restaurant',
    faIcon: 'utensils'
  },
  { 
    name: 'Autres', 
    color: '#9E9E9E', 
    lightColor: '#F5F5F5',
    icon: 'more-horiz',
    faIcon: 'ellipsis-h'
  }
];

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

export default function GestionRappels() {
  const [rappels, setRappels] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedType, setSelectedType] = useState(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [patients, setPatients] = useState([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRappel, setCurrentRappel] = useState({
    description: '',
    type_rappel: '',
    date_rappel: new Date(),
    heure_rappel: new Date(),
    confirmer_rappel: false,
    favori: false,
    id_patient: ''
  });
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [errors, setErrors] = useState({});
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [customType, setCustomType] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));
  const [calendarAnim] = useState(new Animated.Value(0));
  const [filterAnim] = useState(new Animated.Value(0));
  const [typeListAnim] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(true);
  const yearsScrollViewRef = useRef(null);
  const monthsScrollViewRef = useRef(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [rappelToDelete, setRappelToDelete] = useState(null);

  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const screenWidth = Dimensions.get('window').width;

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterTypeOpen, setFilterTypeOpen] = useState(false);
  const [filterStatusOpen, setFilterStatusOpen] = useState(false);
  const [filterSelectedType, setFilterSelectedType] = useState(null);
  const [filterConfirmed, setFilterConfirmed] = useState(false);
  const [filterFavori, setFilterFavori] = useState(false);

  // Ajoutons un état pour forcer le rendu du calendrier
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => { 
    const loadAllData = async () => {
      try {
        await fetchRappels();
        await fetchPatients();
        generateYears();
        // Animer l'apparition des rappels
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // Auto-scroll vers l'année courante
        setTimeout(() => {
          const currentYearIndex = years.findIndex(year => year === dayjs().year());
          if (currentYearIndex !== -1 && yearsScrollViewRef.current) {
            const itemWidth = 80; // Largeur d'un élément année
            const visibleWidth = screenWidth - 40;
            const offset = Math.max(0, ((currentYearIndex * itemWidth) - (visibleWidth / 2) + (itemWidth / 2)));
            yearsScrollViewRef.current.scrollTo({ x: offset, animated: true });
          }
        }, 100);

        // Auto-scroll vers le mois courant
        setTimeout(() => {
          const currentMonthIndex = dayjs().month();
          if (monthsScrollViewRef.current) {
            const itemWidth = 44; // Largeur d'un élément mois
            const visibleWidth = screenWidth - 40;
            const offset = Math.max(0, (currentMonthIndex * itemWidth) - (visibleWidth / 2) + (itemWidth / 2));
            monthsScrollViewRef.current.scrollTo({ x: offset, animated: true });
          }
        }, 100);

      } catch (error) {
        console.error("Erreur chargement initial:", error);
        Alert.alert("Erreur", "Problème de chargement des données");
      }
    };
    
    loadAllData();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: editModalVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: editModalVisible ? 0 : 300,
      duration: 300,
      easing: Easing.out(Easing.back(1)),
      useNativeDriver: true,
    }).start();
  }, [editModalVisible]);

  useEffect(() => {
    Animated.timing(calendarAnim, {
      toValue: showCalendar ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showCalendar]);

  useEffect(() => {
    Animated.timing(filterAnim, {
      toValue: showFilter ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showFilter]);

  useEffect(() => {
    Animated.timing(typeListAnim, {
      toValue: showTypeSuggestions ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showTypeSuggestions]);

  useEffect(() => {
    if (showCalendar) {
      setTimeout(() => {
        const currentYearIndex = years.findIndex(year => year === dayjs().year());
        if (currentYearIndex !== -1 && yearsScrollViewRef.current) {
          const itemWidth = 80;
          const visibleWidth = screenWidth - 40;
          const offset = Math.max(0, (currentYearIndex * itemWidth) - (visibleWidth / 2) + (itemWidth / 2));
          yearsScrollViewRef.current.scrollTo({ x: offset, animated: true });
        }
      }, 100);
      setTimeout(() => {
        const currentMonthIndex = dayjs().month();
        if (monthsScrollViewRef.current) {
          const itemWidth = 44;
          const visibleWidth = screenWidth - 40;
          const offset = Math.max(0, (currentMonthIndex * itemWidth) - (visibleWidth / 2) + (itemWidth / 2));
          monthsScrollViewRef.current.scrollTo({ x: offset, animated: true });
        }
      }, 100);
    }
  }, [showCalendar]);

  useEffect(() => {
    if (patients && patients.length > 0) {
      // Trie du plus récent au plus ancien (suppose id_patient croissant)
      const sorted = [...patients].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.id_patient - a.id_patient;
      });
      setSelectedPatientId(sorted[0].id_patient);
    }
  }, [patients]);

  const fetchRappels = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      const id_aidant = await AsyncStorage.getItem('userId');
      
      if (!token) {
        Alert.alert("Erreur", "Token manquant");
        return;
      }

      const response = await fetch(`${BASE_URL}/api/rappels/aidant_rappels`, {
        headers: { Authorization: `Bearer ${token}` }, 
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error("Réponse non-OK:", text);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Données rappels_aidant reçues:", data);

      if (Array.isArray(data)) {
        // Ajuster les dates pour corriger le décalage
        const adjustedData = data.map(rappel => ({
          ...rappel,
          date_rappel: dayjs(rappel.date_rappel).add(1, 'day').format('YYYY-MM-DD')
        }));
        setRappels(adjustedData);
      } else {
        console.error("Format de données inattendu:", data);
        setRappels([]);
      }

    } catch (error) {
      console.error('Erreur fetchRappels:', {
        message: error.message,
        stack: error.stack
      });
      
      Alert.alert(
        'Erreur', 
        error.message.includes('500') 
          ? 'Problème serveur - Contactez le support'
          : 'Échec du chargement des rappels'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem("userId");
    console.log("fetchPatients userId:",userId);
    console.log("Token verifytoken utilisé :", token);
    
    try {
      const response = await fetch(`${BASE_URL}/api/aidants/${userId}/getPatients`, {
        headers: { Authorization: `Bearer ${token}` }, 
      });

      console.log(`chemin getPatients: ${BASE_URL}/api/aidants/${userId}/getPatients`);
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error("Réponse non-OK:", text);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Données patients reçues:", data);
      
      if (Array.isArray(data)) {
        setPatients(data);
      } else {
        console.error("Format de données inattendu:", data);
        setPatients([]);
      }
    } catch (error) {
      console.error('Erreur fetchPatients:', error);
      Alert.alert('Erreur', 'Impossible de charger les patients');
    }
  };

  const generateYears = () => {
    const yearsList = [];
    for (let i = 1900; i <= 2100; i++) {
      yearsList.push(i);
    }
    setYears(yearsList);
  };

  const validateFields = () => {
    const newErrors = {};
    
    if (!currentRappel.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }
    
    if (!currentRappel.type_rappel.trim()) {
      newErrors.type_rappel = 'Le type est obligatoire';
    } else if (currentRappel.type_rappel === 'Autres' && !customType.trim()) {
      newErrors.customType = 'Veuillez spécifier le type';
    } else if (customType && customType.length > 15) {
      newErrors.customType = 'Le type ne doit pas dépasser 15 caractères';
    }
    
    if (!currentRappel.id_patient) {
      newErrors.id_patient = "L'ID patient est obligatoire";
    }
    
    if (!dayjs(currentRappel.date_rappel).isValid()) {
      newErrors.date_rappel = 'Date invalide';
    }
    
    if (!dayjs(currentRappel.heure_rappel).isValid()) {
      newErrors.heure_rappel = 'Heure invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveRappel = async () => {
    if (!validateFields()) return;

    try {
      if (!Array.isArray(patients)) {
        setPatientError("Erreur de chargement des patients");
        return;
      }

      // Vérification de l'existence du patient
      if (currentRappel.id_patient) {
        const idToCheck = currentRappel.id_patient.toString().trim();
        if (!patients || patients.length === 0) {
          setPatientError("Liste des patients non chargée");
          return;
        }
        const patientExists = patients.some(p => p && p.id_patient && p.id_patient.toString() === idToCheck);
        if (!patientExists) {
          setPatientError("ID patient n'existe pas");
          return;
        }
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Erreur", "Token manquant");
        return;
      }
      const formattedDate = dayjs(currentRappel.date_rappel).format('YYYY-MM-DD');
      const formattedTime = dayjs(currentRappel.heure_rappel).format('HH:mm:ss');
      const finalType = currentRappel.type_rappel === 'Autres' ? customType : currentRappel.type_rappel;

      const body = {
        description: currentRappel.description,
        type_rappel: finalType,
        date_rappel: formattedDate,
        heure_rappel: formattedTime,
        confirmer_rappel: !!currentRappel.confirmer_rappel,
        favori: !!currentRappel.favori,
        id_patient: currentRappel.id_patient || null
      };

      const url = modalMode === 'add'
        ? `${BASE_URL}/api/rappels/create`
        : `${BASE_URL}/api/rappels/${currentRappel.id_rappel}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        Alert.alert('Succès', `Rappel ${modalMode === 'add' ? 'ajouté' : 'modifié'}`);
        setEditModalVisible(false);
        fetchRappels();
      } else {
        let errorText = 'Une erreur est survenue';
        try {
          const errorData = await res.json();
          errorText = errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
          errorText = `Erreur HTTP ${res.status}`;
        }
        Alert.alert('Erreur', errorText);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  const resetForm = () => {
    if (modalMode === 'add') {
      setCurrentRappel({
        description: '',
        type_rappel: '',
        date_rappel: new Date(),
        heure_rappel: new Date(),
        confirmer_rappel: false,
        favori: false,
        id_patient: ''
      });
      setCustomType('');
    } else {
      // Recharger les données originales
      const originalRappel = rappels.find(r => r.id_rappel === currentRappel.id_rappel);
      if (originalRappel) {
        const parsedDate = dayjs(originalRappel.date_rappel).isValid()
          ? dayjs(originalRappel.date_rappel).toDate()
          : new Date();

        const parsedHeure = dayjs(`${dayjs(originalRappel.date_rappel).format('YYYY-MM-DD')}T${originalRappel.heure_rappel}`).isValid()
          ? dayjs(`${dayjs(originalRappel.date_rappel).format('YYYY-MM-DD')}T${originalRappel.heure_rappel}`).toDate()
          : new Date();

        setCurrentRappel({
          ...originalRappel,
          date_rappel: parsedDate,
          heure_rappel: parsedHeure,
        });
      }
    }
    setErrors({});
  };

  const deleteRappel = (id_rappel) => {
    const rappel = rappels.find(r => r.id_rappel === id_rappel);
    setRappelToDelete(rappel);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/rappels/${rappelToDelete.id_rappel}/delete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        Alert.alert('Succès', 'Rappel supprimé avec succès');
        setRappels(prev => prev.filter(r => r.id_rappel !== rappelToDelete.id_rappel));
        setDeleteModalVisible(false);
        setRappelToDelete(null);
      } else {
        const errorData = await res.json();
        Alert.alert('Erreur', errorData.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error deleting rappel:', err);
      Alert.alert('Erreur', err.message || 'Une erreur est survenue');
    }
  };

  // Fonction de filtrage optimisée et corrigée
  const filterRappels = () => {
    if (!rappels || !Array.isArray(rappels)) return [];
    
    return rappels.filter(r => {
      if (!r) return false;
      
      // Vérifier si la date correspond
      const isSameDay = dayjs(r.date_rappel).isSame(selectedDate, 'day');
      
      // Vérifier si le patient correspond
      const patientOK = !selectedPatientId || r.id_patient == selectedPatientId;
      
      // Vérifier si le type correspond
      const typeOK = !filterSelectedType || r.type_rappel === filterSelectedType;
      
      // Convertir explicitement les valeurs booléennes
      // Utiliser double négation pour forcer la conversion en booléen
      const isConfirmed = !!r.confirmer_rappel;
      const isFavorite = !!r.favori;
      
      // Appliquer les filtres
      const confirmedOK = !filterConfirmed || isConfirmed;
      const favoriOK = !filterFavori || isFavorite;
      
      return isSameDay && patientOK && typeOK && confirmedOK && favoriOK;
    });
  };

  const openEditModal = (mode, rappel = null) => {
    setModalMode(mode);
    setPatientError('');
    setErrors({});
    setShowTypeSuggestions(false);
    
    if (mode === 'add') {
      setCurrentRappel({
        description: '',
        type_rappel: '',
        date_rappel: new Date(),
        heure_rappel: new Date(),
        confirmer_rappel: false,
        favori: false,
        id_patient: ''
      });
      setCustomType('');
    } else if (rappel) {
      const parsedDate = dayjs(rappel.date_rappel).isValid()
        ? dayjs(rappel.date_rappel).toDate()
        : new Date();

      const parsedHeure = dayjs(`${dayjs(rappel.date_rappel).format('YYYY-MM-DD')}T${rappel.heure_rappel}`).isValid()
        ? dayjs(`${dayjs(rappel.date_rappel).format('YYYY-MM-DD')}T${rappel.heure_rappel}`).toDate()
        : new Date();

      setCurrentRappel({
        ...rappel,
        date_rappel: parsedDate,
        heure_rappel: parsedHeure,
      });

      // Vérifier si le type n'est pas dans la liste prédéfinie
      if (!TYPES.some(t => t.name === rappel.type_rappel)) {
        setCustomType(rappel.type_rappel);
      }
    }

    setEditModalVisible(true);
  };

  // Ajoutons un effet pour mettre à jour les points du calendrier quand les filtres changent
  useEffect(() => {
    // Forcer le rendu du calendrier quand les filtres changent
    setCalendarKey(prevKey => prevKey + 1);
  }, [filterSelectedType, filterConfirmed, filterFavori, selectedPatientId]);

  // Améliorons la fonction qui génère les jours du mois pour prendre en compte les filtres
  const generateDaysInMonth = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const days = [];
    
    // Ajouter les jours vides du début
    const startDay = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1;
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let i = 1; i <= currentMonth.daysInMonth(); i++) {
      days.push(i);
    }
    
    // Ajouter les jours vides de fin
    const endDay = endOfMonth.day() === 0 ? 0 : 7 - endOfMonth.day();
    for (let i = 1; i <= endDay; i++) {
      days.push(null);
    }
    
    return days;
  };

  const getReminderTypesForDay = (day) => {
    if (!day) return [];
    const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
    
    // Filtrer les rappels pour ce jour en appliquant tous les filtres actifs
    const dayRappels = rappels.filter(r => {
      if (!r || !r.date_rappel) return false;
      
      // Vérifier si la date correspond
      const isSameDay = dayjs(r.date_rappel).isSame(dateStr, 'day');
      if (!isSameDay) return false;
      
      // Vérifier si le patient correspond
      if (selectedPatientId && r.id_patient != selectedPatientId) return false;
      
      // Vérifier si le type correspond
      if (filterSelectedType && r.type_rappel !== filterSelectedType) return false;
      
      // Vérifier si le statut confirmé correspond
      if (filterConfirmed && !r.confirmer_rappel) return false;
      
      // Vérifier si le statut favori correspond
      if (filterFavori && !r.favori) return false;
      
      return true;
    });
    
    const uniqueTypes = [...new Set(dayRappels.map(r => r.type_rappel))];
    return uniqueTypes.map(type => TYPES.find(t => t.name === type) || { name: type, color: '#9E9E9E' }).filter(Boolean);
  };

  const getRappelsByHour = (filteredRappels = []) => {
    // Si aucun rappel n'est fourni, utiliser la fonction de filtrage
    const rappelsToGroup = filteredRappels.length > 0 ? filteredRappels : filterRappels();
    
    // Créer un objet pour regrouper les rappels par heure
    const hourGroups = {};
    
    rappelsToGroup.forEach(rappel => {
      if (!rappel || !rappel.heure_rappel) return;
      
      // Extraire l'heure du format HH:MM:SS
      const hour = rappel.heure_rappel.split(':')[0] + 'h';
      
      if (!hourGroups[hour]) {
        hourGroups[hour] = [];
      }
      
      hourGroups[hour].push(rappel);
    });
    
    // Convertir l'objet en tableau pour FlatList
    return Object.keys(hourGroups).sort().map(hour => ({
      hour,
      rappels: hourGroups[hour]
    }));
  };

  const copyToClipboard = async (patientId) => {
    try {
      const patientName = getPatientNameById(patientId);
      await Clipboard.setString(patientName);
      Alert.alert('Copié', 'Nom du patient copié dans le presse-papiers');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const handleTypeSelect = (type) => {
    setCurrentRappel({...currentRappel, type_rappel: type});
    setShowTypeSuggestions(false);
    if (type !== 'Autres') {
      setCustomType('');
    }
  };

  const renderTypeIcon = (typeName) => {
    const type = TYPES.find(t => t.name === typeName);
    if (!type) return null;
    
    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <MaterialIcons name={type.icon} size={20} color={type.color} style={{marginRight: 5}} />
        <Text>{typeName}</Text>
      </View>
    );
  };

  // Fonction pour obtenir le nom complet du patient à partir de son ID
  const getPatientNameById = (patientId) => {
    if (!patientId || !patients) return "Patient inconnu";
    
    const patient = patients.find(p => p.id_patient == patientId);
    if (!patient) return `Patient #${patientId}`;
    
    return `${patient.nompatient || ''} ${patient.prenompatient || ''}`.trim();
  };

  // Modifions le rendu des rappels pour afficher le nom du patient
  const renderRappel = (rappel) => {
    const type = TYPES.find(t => t.name === rappel.type_rappel) || { 
      name: rappel.type_rappel, 
      color: '#9E9E9E', 
      lightColor: '#F5F5F5',
      icon: 'more-horiz'
    };
    
    // Convertir explicitement en booléen
    const isConfirmed = !!rappel.confirmer_rappel;
    const isFavorite = !!rappel.favori;
    
    // Obtenir le nom du patient
    const patientName = getPatientNameById(rappel.id_patient);
    
    return (
      <View 
        key={rappel.id_rappel} 
        style={[
          styles.card,
          { 
            backgroundColor: type.lightColor,
            borderLeftColor: type.color,
            borderLeftWidth: 5
          }
        ]}
      >
        <View style={styles.badgesContainer}>
          {isFavorite && (
            <View style={styles.circleBadgeFavori}>
              <Ionicons name="star" size={18} color="#FFD700" style={{ alignSelf: 'center' }} />
            </View>
          )}
          {isConfirmed && (
            <View style={styles.circleBadgeConfirme}>
              <Ionicons name="checkmark" size={18} color="#08AF62" style={{ alignSelf: 'center' }} />
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialIcons name={type.icon} size={20} color={type.color} style={{marginRight: 5}} />
            <Text style={[styles.type, { color: type.color }]}>
              {rappel.type_rappel}
            </Text>
          </View>
          <Text style={styles.desc}>{rappel.description}</Text>
          <Text style={styles.time}>🕒 {rappel.heure_rappel}</Text>
          
          {rappel.id_patient && (
            <View style={styles.patientIdContainer}>
              <View style={styles.patientIdBox}>
                <Text style={styles.patientIdText}>{patientName}</Text>
                <TouchableOpacity 
                  onPress={() => copyToClipboard(rappel.id_patient)}
                  style={styles.copyButton}
                >
                  <Feather name="copy" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const scrollToCurrentDate = () => {
    // Scroll vers l'année courante
    const currentYearIndex = years.findIndex(year => year === dayjs().year());
    if (currentYearIndex !== -1 && yearsScrollViewRef.current) {
      const itemWidth = 80; // Largeur d'un élément année (doit matcher le style)
      const visibleWidth = screenWidth - 40;
      const offset = Math.max(0, (currentYearIndex * itemWidth) - (visibleWidth / 2) + (itemWidth / 2));
      yearsScrollViewRef.current.scrollTo({ x: offset, animated: true });
    }

    // Scroll vers le mois courant
    const currentMonthIndex = dayjs().month();
    if (monthsScrollViewRef.current) {
      const itemWidth = 44; // Largeur d'un élément mois (doit matcher le style)
      const visibleWidth = screenWidth - 40;
      const offset = Math.max(0, (currentMonthIndex * itemWidth) - (visibleWidth / 2) + (itemWidth / 2));
      monthsScrollViewRef.current.scrollTo({ x: offset, animated: true });
    }
  };

  // Trie les patients du plus récent au plus ancien (suppose que l'objet patient a une propriété createdAt ou id_patient croissant)
  const sortedPatients = [...patients].sort((a, b) => {
    // Si createdAt existe, trier dessus, sinon sur id_patient (supposé croissant)
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return b.id_patient - a.id_patient;
  });
  // Filtrage des patients par recherche
  const filteredPatients = sortedPatients.filter(p => {
    const fullName = `${p.prenom || ''} ${p.nom || ''}`.toLowerCase();
    return fullName.includes(searchText.toLowerCase());
  });

  // Ajout d'une fonction utilitaire pour la couleur du point calendrier
  const getDayDotColors = (day) => {
    if (!day) return [];
    
    const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
    
    // Filtrer les rappels pour ce jour en appliquant tous les filtres actifs
    const dayRappels = rappels.filter(r => {
      if (!r || !r.date_rappel) return false;
      
      // Vérifier si la date correspond
      const isSameDay = dayjs(r.date_rappel).isSame(dateStr, 'day');
      if (!isSameDay) return false;
      
      // Vérifier si le patient correspond
      if (selectedPatientId && r.id_patient != selectedPatientId) return false;
      
      // Vérifier si le type correspond
      if (filterSelectedType && r.type_rappel !== filterSelectedType) return false;
      
      // Vérifier si le statut confirmé correspond
      if (filterConfirmed && !r.confirmer_rappel) return false;
      
      // Vérifier si le statut favori correspond
      if (filterFavori && !r.favori) return false;
      
      return true;
    });
    
    // Si aucun rappel ne correspond aux filtres pour ce jour, ne pas afficher de point
    if (!dayRappels || dayRappels.length === 0) return [];
    
    // Déterminer les couleurs des points en fonction des types de rappel
    const colors = [];
    
    // Vérifier s'il y a des rappels de type Médicament
    if (dayRappels.some(r => r.type_rappel === 'Médicament')) {
      colors.push('#4CAF50'); // vert
    }
    
    // Vérifier s'il y a d'autres types de rappels
    if (dayRappels.some(r => r.type_rappel !== 'Médicament')) {
      colors.push('#FF9800'); // orange
    }
    
    return colors;
  };

  // Modifions la fonction qui ferme le modal de filtre
  const closeFilterModal = () => {
    setFilterModalVisible(false);
    // Forcer le rendu du calendrier avec une nouvelle clé
    setCalendarKey(prevKey => prevKey + 1);
  };

  return (
    <View style={styles.container}>
      {/* Header bleu avec titre et icône home */}
      <View style={styles.blueHeader}>
        <Text style={styles.headerTitle}>Rappels</Text>
        <TouchableOpacity style={styles.homeIcon} onPress={() => router.replace('/AccueilAidant')}>
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Barre de recherche patient */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher un patient..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      {/* Liste horizontale des patients */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientsList}>
        {filteredPatients.map((patient, idx) => (
        <TouchableOpacity 
            key={patient.id_patient}
            style={[styles.patientCard, selectedPatientId === patient.id_patient && styles.selectedPatientCard]}
            onPress={() => setSelectedPatientId(selectedPatientId === patient.id_patient ? null : patient.id_patient)}
          >
            <View style={styles.patientImageContainer}>
              <Image
                source={patient.profile_image ? { uri: `${BASE_URL}/${patient.profile_image}` } : require('../assets/default-avatar.png')}
                style={styles.patientImage}
              />
            </View>
            <Text style={styles.patientName}>{patient.nompatient || ''} {patient.prenompatient || ''}</Text>
            <View style={styles.lienFamilialRow}>
              <MaterialIcons name="people" size={14} color="#2574f5" style={{marginRight: 3}} />
              <Text style={styles.lienFamilialText}>{patient.lien_familial || '-'}</Text>
            </View>
        </TouchableOpacity>
        ))}
      </ScrollView>
      {/* BARRE CALENDRIER FIXE */}
      <View style={styles.calendarBar}>
        <TouchableOpacity style={styles.calendarBarLeft} onPress={() => setShowCalendar(!showCalendar)}>
          <Text style={styles.calendarBarMonthYear}>{currentMonth.format('MMMM YYYY')}</Text>
          <Ionicons name={showCalendar ? 'chevron-up' : 'chevron-down'} size={18} color="#222" style={{marginLeft: 4}} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.calendarBarDayCircle}
          onPress={() => {
            setSelectedDate(dayjs());
            setCurrentMonth(dayjs());
            setSelectedYear(dayjs().year());
            scrollToCurrentDate();
          }}
        >
          <Text style={styles.calendarBarDayText}>{dayjs().format('DD')}</Text>
        </TouchableOpacity>
      </View>
      {/* CALENDRIER SLIDE SOUS LA BARRE CALENDRIER, SANS DÉCALER LA LISTE PATIENT */}
        <Animated.View 
          key={calendarKey}
          style={[
            styles.calendarContainer,
            {
              opacity: calendarAnim,
              transform: [{
                translateY: calendarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
              }],
              height: showCalendar ? undefined : 0,
              overflow: 'hidden',
              zIndex: 2,
            }
          ]}
          pointerEvents={showCalendar ? 'auto' : 'none'}
        >
          <ScrollView 
            ref={yearsScrollViewRef}
            horizontal 
          style={styles.yearsScrollSmall} 
            showsHorizontalScrollIndicator={false}
          >
            {years.map(year => (
              <TouchableOpacity
                key={year}
              style={[styles.yearItemSmall, selectedYear === year && styles.selectedYearSmall]}
                onPress={() => {
                  setSelectedYear(year);
                  setCurrentMonth(currentMonth.year(year));
                }}
              >
              <Text style={[styles.yearTextSmall, selectedYear === year && styles.selectedYearTextSmall]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        <View style={styles.daysHeaderSmall}>
            {WEEKDAYS.slice(0, 7).map((day, index) => (
            <Text key={index} style={styles.dayHeaderSmall}>{day.charAt(0)}</Text>
            ))}
          </View>
          {[...Array(6)].map((_, weekIndex) => {
            const weekDays = generateDaysInMonth().slice(weekIndex * 7, (weekIndex + 1) * 7);
            if (weekDays.every(day => day === null)) return null;
            return (
              <View key={weekIndex} style={styles.weekRowSmall}>
                {weekDays.map((day, dayIndex) => {
                  // Utiliser la fonction getDayDotColors améliorée pour chaque jour
                  const dotColors = day ? getDayDotColors(day) : [];
                  
                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dayCellSmall,
                        day && day === dayjs().date() && currentMonth.isSame(dayjs(), 'month') && styles.currentDaySmall,
                        day && selectedDate.date() === day && selectedDate.isSame(currentMonth, 'month') && styles.selectedDaySmall
                      ]}
                      onPress={() => {
                        if (day) {
                          setSelectedDate(currentMonth.date(day));
                        }
                      }}
                    >
                      {day && (
                        <>
                          <Text style={[
                            styles.dayTextSmall,
                            day === dayjs().date() && currentMonth.isSame(dayjs(), 'month') && styles.currentDayTextSmall,
                            selectedDate.date() === day && selectedDate.isSame(currentMonth, 'month') && styles.selectedDayTextSmall
                          ]}>
                            {day}
                          </Text>
                          {dotColors.length > 0 && (
                            <View style={styles.reminderDotsContainer}>
                              {dotColors.map((color, index) => (
                                <View 
                                  key={index} 
                                  style={[
                                    styles.reminderDotSmall, 
                                    { backgroundColor: color },
                                    // Si deux points, ajuster la position horizontale
                                    dotColors.length === 2 && {
                                      left: index === 0 ? -1 : 1 
                                    }
                                  ]} 
                                />
                              ))}
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
          <ScrollView 
            ref={monthsScrollViewRef}
            horizontal 
          style={styles.monthsScrollSmall} 
            showsHorizontalScrollIndicator={false}
          >
            {MONTHS.map((month, index) => (
              <TouchableOpacity
                key={index}
              style={[styles.monthItemSmall, currentMonth.month() === index && styles.selectedMonthSmall]}
                onPress={() => {
                  setCurrentMonth(currentMonth.month(index));
                }}
              >
              <Text style={[styles.monthTextSmall, currentMonth.month() === index && styles.selectedMonthTextSmall]}>{month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      {/* En-tête du jour sélectionné */}
      <View style={styles.selectedDayHeader}>
        <Text style={styles.selectedDayName}>{selectedDate.format('ddd').toUpperCase()}</Text>
        <Text style={styles.selectedDayNumber}>{selectedDate.format('DD')}</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filtrerContainer}>
          <Text style={styles.filtrerText}>Filtrer</Text>
          <Ionicons name="filter" size={24} color="#007AFF" style={styles.filtrerIcon}/>
        </TouchableOpacity>
      </View>
      {/* Liste des rappels par heure - Toujours visible */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={getRappelsByHour(filterRappels()).filter(item => item.rappels.length > 0)}
          keyExtractor={(item) => item.hour}
          renderItem={({ item }) => (
            <View style={styles.hourSection}>
              <Text style={styles.hourText}>{item.hour}</Text>
              {item.rappels.map((rappel) => {
                  const type = TYPES.find(t => t.name === rappel.type_rappel) || { 
                    name: rappel.type_rappel, 
                    color: '#9E9E9E', 
                    lightColor: '#F5F5F5',
                    icon: 'more-horiz'
                  };
                  
                  // Obtenir le nom du patient
                  const patientName = getPatientNameById(rappel.id_patient);
                  
                  return (
                    <View 
                      key={rappel.id_rappel} 
                      style={[
                        styles.card,
                        { 
                          backgroundColor: type.lightColor,
                          borderLeftColor: type.color,
                          borderLeftWidth: 5
                        }
                      ]}
                    >
                      <View style={styles.badgesContainer}>
                        {rappel.favori && (
                          <View style={styles.circleBadgeFavori}>
                            <Ionicons name="star" size={18} color="#FFD700" style={{ alignSelf: 'center' }} />
                          </View>
                        )}
                        {rappel.confirmer_rappel && (
                          <View style={styles.circleBadgeConfirme}>
                            <Ionicons name="checkmark" size={18} color="#08AF62" style={{ alignSelf: 'center' }} />
                          </View>
                        )}
                      </View>
                      <View style={styles.cardContent}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <MaterialIcons name={type.icon} size={20} color={type.color} style={{marginRight: 5}} />
                          <Text style={[styles.type, { color: type.color }]}>
                            {rappel.type_rappel}
                          </Text>
                        </View>
                        <Text style={styles.desc}>{rappel.description}</Text>
                        <Text style={styles.time}>🕒 {rappel.heure_rappel}</Text>
                        
                        {rappel.id_patient && (
                          <View style={styles.patientIdContainer}>
                            <View style={styles.patientIdBox}>
                              <Text style={styles.patientIdText}>{patientName}</Text>
                              <TouchableOpacity 
                                onPress={() => copyToClipboard(rappel.id_patient)}
                                style={styles.copyButton}
                              >
                                <Feather name="copy" size={16} color="#007AFF" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardButtons}>
                        <TouchableOpacity 
                          style={styles.redBtn} 
                          onPress={() => deleteRappel(rappel.id_rappel)}
                        >
                          <Ionicons name="trash" size={16} color="white" style={{ marginRight: 4 }} />
                          <Text style={styles.btnText}>Supprimer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.orangeBtn} 
                          onPress={() => openEditModal('edit', rappel)}
                        >
                          <Ionicons name="create" size={16} color="white" style={{ marginRight: 4 }} />
                          <Text style={styles.btnText}>Modifier</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
              })}
            </View>
          )}
          contentContainerStyle={styles.remindersList}
          ListEmptyComponent={
            <Text style={styles.noRemindersText}>Aucun rappel pour cette journée</Text>
          }
        />
      )}

      {/* Bouton d'ajout */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => openEditModal('add')}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal de filtre */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeFilterModal}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalBox}>
            {/* Header */}
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtrer <Ionicons name="filter" size={20} color="#1976D2" /></Text>
              <TouchableOpacity onPress={closeFilterModal}>
                <Ionicons name="close" size={28} color="#1976D2" />
              </TouchableOpacity>
            </View>
            {/* Patient sélectionné */}
            {selectedPatientId && (
              <View style={styles.filterPatientCard}>
                <Image
                  source={patients.find(p => p.id_patient === selectedPatientId)?.profile_image
                    ? { uri: `${BASE_URL}/${patients.find(p => p.id_patient === selectedPatientId).profile_image}` }
                    : require('../assets/default-avatar.png')}
                  style={styles.filterPatientImage}
                />
                <View>
                  <Text style={styles.filterPatientName}>
                    {patients.find(p => p.id_patient === selectedPatientId)?.nompatient || ''} {patients.find(p => p.id_patient === selectedPatientId)?.prenompatient || ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="people" size={14} color="#1976D2" style={{ marginRight: 3 }} />
                    <Text style={styles.filterPatientLien}>
                      {patients.find(p => p.id_patient === selectedPatientId)?.lien_familial || '-'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            {/* Type de rappel */}
            <TouchableOpacity style={styles.filterBar} onPress={() => setFilterTypeOpen(!filterTypeOpen)}>
              <Text style={styles.filterBarLabel}>Type de rappel</Text>
              <Ionicons name={filterTypeOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#1976D2" />
            </TouchableOpacity>
            {filterTypeOpen && (
              <View style={styles.filterTypeList}>
            {TYPES.map(type => (
              <TouchableOpacity
                key={type.name}
                style={[
                      styles.filterTypeItem,
                      filterSelectedType === type.name && styles.filterTypeItemSelected
                ]}
                    onPress={() => setFilterSelectedType(filterSelectedType === type.name ? null : type.name)}
              >
                    <MaterialIcons name={type.icon} size={20} color={type.color} style={{ marginRight: 10 }} />
                    <Text style={{ color: type.color, fontWeight: 'bold' }}>{type.name}</Text>
              </TouchableOpacity>
            ))}
              </View>
            )}
            {/* Statut (confirmés/favoris) */}
            <View style={styles.filterStatusRow}>
              <TouchableOpacity
                style={[
                  styles.filterStatusCircle,
                  filterConfirmed && styles.filterStatusCircleSelected
                ]}
                onPress={() => setFilterConfirmed(!filterConfirmed)}
              >
                {/* Cercle vert Confirmés */}
                <View style={styles.svgWrapper}>
                  <Svg width={90} height={50}>
                    <Circle cx={45} cy={20} r={18} stroke="#08AF62" strokeWidth={4} fill="#D8EFE4" />
                  </Svg>
                  {filterConfirmed && (
                    <View style={styles.iconOverlay}>
                      <Ionicons name="checkmark" size={20} color="#08AF62" />
                    </View>
                  )}
                </View>
                <Text style={styles.filterStatusLabel}>Confirmés</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterStatusCircle,
                  filterFavori && styles.filterStatusCircleSelected
                ]}
                onPress={() => setFilterFavori(!filterFavori)}
              >
                {/* Cercle jaune Favoris */}
                <View style={styles.svgWrapper}>
                  <Svg width={90} height={50}>
                    <Circle cx={45} cy={20} r={18} stroke="#FEC303" strokeWidth={4} fill="#EFEED8" />
                  </Svg>
                  {filterFavori && (
                    <View style={styles.iconOverlay}>
                      <Ionicons name="star" size={20} color="#FEC303" />
                    </View>
                  )}
                </View>
                <Text style={styles.filterStatusLabel}>Favoris</Text>
              </TouchableOpacity>
            </View>
            {/* Footer */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetBtn}
                onPress={() => {
                  setFilterSelectedType(null);
                  setFilterConfirmed(false);
                  setFilterFavori(false);
                }}
              >
                <Text style={styles.filterResetBtnText}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal d'édition */}
      <Modal visible={editModalVisible} transparent animationType="none">
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
              onPress={() => setEditModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {modalMode === 'add' ? 'Ajouter un rappel' : 'Modifier le rappel'}
            </Text>
            
            <TextInput
              placeholder="Description *"
              value={currentRappel.description}
              onChangeText={txt => setCurrentRappel({...currentRappel, description: txt})}
              style={[
                styles.input,
                errors.description && styles.errorInput
              ]}
              multiline
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            
            <View style={styles.typeListContainer}>
              <Text style={styles.typeListTitle}>Sélectionnez un type *</Text>
              <FlatList
                data={TYPES}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      currentRappel.type_rappel === item.name && styles.selectedTypeOption
                    ]}
                    onPress={() => handleTypeSelect(item.name)}
                  >
                    <MaterialIcons name={item.icon} size={20} color={item.color} style={{marginRight: 10}} />
                    <Text style={[
                      styles.typeOptionText,
                      { color: item.color }
                    ]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={styles.typeList}
              />
            </View>
            {errors.type_rappel && <Text style={styles.errorText}>{errors.type_rappel}</Text>}
            
            <TextInput
              placeholder="ID Patient *"
              value={currentRappel.id_patient?.toString() || ''}
              onChangeText={txt => {
                setCurrentRappel({...currentRappel, id_patient: txt});
                setPatientError('');
              }}
              style={[
                styles.input,
                patientError && styles.errorInput
              ]}
              keyboardType="numeric"
            />
            {patientError && <Text style={styles.errorText}>{patientError}</Text>}
            
            <TouchableOpacity 
              style={[
                styles.pickerField,
                errors.date_rappel && styles.errorInput
              ]} 
              onPress={() => setDatePickerVisible(true)}
            >
              <Text>{dayjs(currentRappel.date_rappel).format('DD/MM/YYYY')}</Text>
              {errors.date_rappel && <Text style={styles.errorText}>{errors.date_rappel}</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.pickerField,
                errors.heure_rappel && styles.errorInput
              ]} 
              onPress={() => setTimePickerVisible(true)}
            >
              <Text>{dayjs(currentRappel.heure_rappel).format('HH:mm')}</Text>
              {errors.heure_rappel && <Text style={styles.errorText}>{errors.heure_rappel}</Text>}
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.resetBtn} 
                onPress={resetForm}
              >
                <Text style={styles.resetBtnText}>
                  Réinitialiser
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={saveRappel}
              >
                <Text style={styles.modalBtnText}>
                  {modalMode === 'add' ? 'Ajouter' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        date={currentRappel.date_rappel || new Date()}
        onConfirm={date => {
          setDatePickerVisible(false);
          setCurrentRappel({...currentRappel, date_rappel: date});
          setErrors({...errors, date_rappel: ''});
        }}
        onCancel={() => setDatePickerVisible(false)}
      />
      
      <DateTimePickerModal
        isVisible={timePickerVisible}
        mode="time"
        date={currentRappel.heure_rappel || new Date()}
        onConfirm={time => {
          setTimePickerVisible(false);
          setCurrentRappel({...currentRappel, heure_rappel: time});
          setErrors({...errors, heure_rappel: ''});
        }}
        onCancel={() => setTimePickerVisible(false)}
      />

      {/* Modal de suppression */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <Animated.View 
            style={[
              styles.deleteModalContent,
              { 
                opacity: fadeAnim,
                transform: [{ scale: fadeAnim }]
              }
            ]}
          >
            <View style={styles.deleteModalHeader}>
              <Text style={styles.deleteModalTitle}>Supprimer le rappel</Text>
              <TouchableOpacity 
                style={styles.deleteModalClose} 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setRappelToDelete(null);
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {rappelToDelete && (
              <View style={styles.deleteModalBody}>
                <View style={styles.deleteIconContainer}>
                  <View style={styles.deleteIconCircle}>
                    <Ionicons name="trash" size={40} color="#FF3B30" />
                  </View>
                </View>
                
                <Text style={styles.deleteWarningText}>
                  Êtes-vous sûr de vouloir supprimer ce rappel ?
                </Text>
                
                <View style={styles.deleteInfoCard}>
                  {/* Type du rappel */}
                  <View style={styles.deleteInfoRow}>
                    <View style={styles.deleteInfoLabelContainer}>
                      <Ionicons name="bookmark" size={18} color="#666" />
                      <Text style={styles.deleteInfoLabel}>Type:</Text>
                    </View>
                    <Text style={styles.deleteInfoValue}>
                      {rappelToDelete.type_rappel}
                    </Text>
                  </View>
                  
                  {/* Description */}
                  <View style={styles.deleteInfoRow}>
                    <View style={styles.deleteInfoLabelContainer}>
                      <Ionicons name="document-text" size={18} color="#666" />
                      <Text style={styles.deleteInfoLabel}>Description:</Text>
                    </View>
                    <Text style={styles.deleteInfoValue}>
                      {rappelToDelete.description}
                    </Text>
                  </View>
                  
                  {/* Date */}
                  <View style={styles.deleteInfoRow}>
                    <View style={styles.deleteInfoLabelContainer}>
                      <Ionicons name="calendar" size={18} color="#666" />
                      <Text style={styles.deleteInfoLabel}>Date:</Text>
                    </View>
                    <Text style={styles.deleteInfoValue}>
                      {dayjs(rappelToDelete.date_rappel).format('DD/MM/YYYY')}
                    </Text>
                  </View>
                  
                  {/* Heure */}
                  <View style={styles.deleteInfoRow}>
                    <View style={styles.deleteInfoLabelContainer}>
                      <Ionicons name="time" size={18} color="#666" />
                      <Text style={styles.deleteInfoLabel}>Heure:</Text>
                    </View>
                    <Text style={styles.deleteInfoValue}>
                      {dayjs(rappelToDelete.heure_rappel).format('HH:mm')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity 
                    style={styles.deleteCancelButton} 
                    onPress={() => {
                      setDeleteModalVisible(false);
                      setRappelToDelete(null);
                    }}
                  >
                    <Text style={styles.deleteCancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteConfirmButton} 
                    onPress={handleConfirmDelete}
                  >
                    <Ionicons name="trash" size={18} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.deleteConfirmButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  blueHeader: {
    backgroundColor: '#2574f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
    height:100,
    minHeight: 70,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginTop: -25,
  },
  homeIcon: {
    position: 'absolute',
    right: 20,
    top: 32,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: -15,
    marginBottom: 10,
    elevation: 2,
    height: 40,
  },
  searchBar: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    color: '#333',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  patientsList: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 0,
    minHeight: 90,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginRight: 10,
    marginBottom:-20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    width: 100,
    height:145,
    elevation: 3,
  },
  selectedPatientCard: {
    borderColor: '#2574f5',
    width:110,
  },
  patientImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 5,
    backgroundColor: '#eee',
  },
  patientImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  patientName: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 10,
  },
  lienFamilialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    alignSelf: 'center',
    minHeight: 16,
  },
  lienFamilialText: {
    fontSize: 13,
    color: '#2574f5',
    fontWeight: 'bold',
    flexShrink: 1,
    maxWidth: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#333',
  },
  todayButton: {
    backgroundColor: '#2574f5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  calendarBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    width: '100%',
  },
  calendarBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',    
  },
  calendarBarMonthYear: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    textTransform: 'capitalize',
  },
  calendarBarDayCircle: {
    backgroundColor: '#1976D2',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarBarDayText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  calendarContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 0,
  },
  yearsScrollSmall: {
    maxHeight: 28,
    marginBottom: 4,
    paddingHorizontal: 8,
    flexGrow: 0,
  },
  yearItemSmall: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 12,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedYearSmall: {
    backgroundColor: '#2574f5',
  },
  yearTextSmall: {
    fontSize: 13,
    color: '#333',
  },
  selectedYearTextSmall: {
    color: 'white',
  },
  daysHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 2,
  },
  dayHeaderSmall: {
    width: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
    fontSize: 10,
  },
  weekRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 1,
  },
  dayCellSmall: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    position: 'relative', // Important pour le positionnement du point
  },
  dayTextSmall: {
    fontSize: 14,
    color: '#333',
  },
  currentDaySmall: {
    backgroundColor: '#E3F2FD',
  },
  currentDayTextSmall: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  selectedDaySmall: {
    backgroundColor: '#2196F3',
  },
  selectedDayTextSmall: {
    color: 'white',
    fontWeight: 'bold',
  },
  reminderDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 2, // Positionne le point en bas du jour
    backgroundColor: '#FF9800',
  },
  monthsScrollSmall: {
    maxHeight: 28,
    marginTop: 4,
    paddingHorizontal: 8,
    flexGrow: 0,
  },
  monthItemSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 12,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMonthSmall: {
    backgroundColor: '#2574f5',
  },
  monthTextSmall: {
    fontSize: 13,
    color: '#333',
    textTransform: 'capitalize',
  },
  selectedMonthTextSmall: {
    color: 'white',
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedDayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 5,
  },
  selectedDayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filtrerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  filtrerText: {
    color: '#007AFF',
    marginRight: 5,
  },
  filtrerIcon: {},
  hourSection: {
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  hourText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 10,
  },
  type: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  desc: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  patientIdContainer: {
    marginTop: 5,
  },
  patientIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  patientIdText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  copyButton: {
    marginLeft: 5,
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  redBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    marginRight: 5,
    padding: 8,
    borderRadius: 5,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteModalHeader: {
    backgroundColor: '#FF3B30',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteModalClose: {
    padding: 5,
  },
  deleteModalBody: {
    padding: 20,
  },
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFCDD2',
  },
  deleteWarningText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  deleteInfoCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  deleteInfoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  deleteInfoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
  },
  deleteInfoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 5,
  },
  deleteInfoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteCancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  orangeBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontSize: 12,
  },
  noRemindersText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  remindersList: {
    paddingBottom: 80,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  filterModalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 30,
    maxHeight:700,
    minHeight: 350,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  filterPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 12,
    padding: 10,
  },
  filterPatientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  filterPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  filterPatientLien: {
    fontSize: 14,
    color: '#666',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterBarLabel: {
    fontSize: 16,
    color: '#333',
  },
  filterTypeList: {
    marginVertical: 10,
  },
  filterTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  filterPatientImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  filterPatientName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  filterPatientLien: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: 'bold',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FB',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 2,
  },
  filterBarLabel: {
    fontWeight: 'bold',
    color: '#1976D2',
    fontSize: 16,
  },
  filterTypeList: {
    flexDirection: 'column',
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 6,
  },
  filterTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginVertical: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTypeItemSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F0FF',
  },
  filterStatusRow: {
    flexDirection: 'row',
    marginHorizontal: 65,
    marginVertical: 10,
    justifyContent: 'flex-start',
  },
  filterStatusCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 20,
    padding: 10,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterStatusCircleSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#E3F0FF',
  },
  filterStatusLabel: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: 'bold',
    marginTop: 2,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: 300,
    maxHeight: '100%',
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
  errorInput: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  typeListContainer: {
    marginBottom: 15,
  },
  typeListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  typeList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: 'white',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedTypeOption: {
    backgroundColor: '#f5f5f5',
  },
  typeOptionText: {
    fontSize: 16,
  },
  pickerField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    justifyContent: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  resetBtn: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  modalBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 10,
  },
  badgesContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
  },
  circleBadgeFavori: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  circleBadgeConfirme: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D8EFE4',
    borderWidth: 2,
    borderColor: '#08AF62',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  rappelItem: {
    opacity: 0,
    transform: [{ translateY: 50 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    width:"100%",
    marginTop: 10,
  },
  filterResetBtn: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    paddingHorizontal:130,
    borderRadius: 10,
    marginRight: 0,
    alignItems: 'center',
  },
  filterResetBtnText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  // Styles pour le modal de filtrage
  filterModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
  },
  filterTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  filterTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginRight: 8,
    marginBottom: 8,
  },
  filterTypeIcon: {
    marginRight: 5,
  },
  filterTypeText: {
    fontSize: 14,
  },
  filterStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  filterStatusButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    width: '45%',
  },
  filterStatusButtonSelected: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
  },
  filterStatusIconContainer: {
    marginBottom: 5,
  },
  filterStatusText: {
    fontSize: 14,
  },
  filterActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resetFilterButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    width: '48%',
    alignItems: 'center',
  },
  resetFilterText: {
    color: '#666666',
    fontWeight: '500',
  },
  applyFilterButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    width: '48%',
    alignItems: 'center',
  },
  applyFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  reminderDotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
    height: 6,
  },
  reminderDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  svgWrapper: {
    position: 'relative',
    width: 90,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOverlay: {
    position: 'absolute',
    top: 10,  // Ajusté pour centrer verticalement
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
});










