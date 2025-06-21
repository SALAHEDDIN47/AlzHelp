import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Keyboard,
  Dimensions,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithToken } from '../../../../utils/fetchNgrok';

// Suppression des imports non compatibles avec Expo Go
// import * as Speech from 'expo-speech';
// import Voice from '@react-native-voice/voice';

const TYPE_COLORS = [
  { 
    name: 'Médicament', 
    color: '#4CAF50', 
    lightColor: '#E8F5E9',
    icon: 'local-pharmacy',
    count: 0
  },
  { 
    name: 'Communication', 
    color: '#2196F3', 
    lightColor: '#E3F2FD',
    icon: 'chat',
    count: 0
  },
  { 
    name: 'Quotidien', 
    color: '#FF9800', 
    lightColor: '#FFF3E0',
    icon: 'schedule',
    count: 0
  },
  { 
    name: 'Sécurité', 
    color: '#F44336', 
    lightColor: '#FFEBEE',
    icon: 'warning',
    count: 0
  },
  { 
    name: 'Activité', 
    color: '#9C27B0', 
    lightColor: '#F3E5F5',
    icon: 'directions-run',
    count: 0
  },
  { 
    name: 'Événement', 
    color: '#3F51B5', 
    lightColor: '#E8EAF6',
    icon: 'event',
    count: 0
  },
  { 
    name: 'Rendez-vous', 
    color: '#009688', 
    lightColor: '#E0F2F1',
    icon: 'event-available',
    count: 0
  },
  { 
    name: 'Hydratation', 
    color: '#00BCD4', 
    lightColor: '#E0F7FA',
    icon: 'opacity',
    count: 0
  },
  { 
    name: 'Nutrition', 
    color: '#FFC107', 
    lightColor: '#FFF8E1',
    icon: 'restaurant',
    count: 0
  },
  { 
    name: 'Autres', 
    color: '#9E9E9E', 
    lightColor: '#F5F5F5',
    icon: 'more-horiz',
    count: 0
  }
];

const HomeScreen = () => {
  const [rappels, setRappels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredRappels, setFilteredRappels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    today: 0,
    total: 0,
    confirmed: 0,
    favoris: 0
  });
  const [typeColors, setTypeColors] = useState(TYPE_COLORS);
  const [user, setUser] = useState({ prenom: 'Prénom' });
  const [searchResults, setSearchResults] = useState([]);
  const [modalType, setModalType] = useState(null); // 'today', 'all', 'past', 'current', or type name
  const router = useRouter();
  const [pinnedRappels, setPinnedRappels] = useState([]);
  const [confirmedRappels, setConfirmedRappels] = useState([]);

  const togglePin = async (id_rappel) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Erreur", "Token manquant");
        return;
      }
      
      // Mise à jour optimiste de l'UI avant la réponse du serveur
      const isCurrentlyPinned = pinnedRappels.includes(id_rappel);
      
      // Mettre à jour l'état local immédiatement pour une réponse UI instantanée
      setPinnedRappels(prev => 
        isCurrentlyPinned
          ? prev.filter(id => id !== id_rappel)
          : [...prev, id_rappel]
      );
      
      // Mettre à jour la liste principale des rappels immédiatement
      setRappels(prevRappels =>
        prevRappels.map(rappel =>
          rappel.id_rappel === id_rappel
            ? { ...rappel, favori: !isCurrentlyPinned }
            : rappel
        )
      );
      
      // Ensuite faire l'appel API
      const response = await fetchWithToken(`/api/rappels/${id_rappel}/pin`, token, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Si la réponse API est différente de notre mise à jour optimiste, on corrige
      if (response && typeof response.favori === 'boolean' && 
          response.favori !== !isCurrentlyPinned) {
        
        setPinnedRappels(prev =>
          response.favori
            ? [...prev.filter(id => id !== id_rappel), id_rappel]
            : prev.filter(id => id !== id_rappel)
        );

        setRappels(prevRappels =>
          prevRappels.map(rappel =>
            rappel.id_rappel === id_rappel
              ? { ...rappel, favori: response.favori }
              : rappel
          )
        );
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      Alert.alert("Erreur", "Impossible de modifier le statut favori");
      
      // En cas d'erreur, on revient à l'état précédent
      const isCurrentlyPinned = pinnedRappels.includes(id_rappel);
      setPinnedRappels(prev => 
        isCurrentlyPinned
          ? prev.filter(id => id !== id_rappel)
          : [...prev, id_rappel]
      );
      
      setRappels(prevRappels =>
        prevRappels.map(rappel =>
          rappel.id_rappel === id_rappel
            ? { ...rappel, favori: isCurrentlyPinned }
            : rappel
        )
      );
    }
  };

  const toggleConfirm = async (id_rappel) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Erreur", "Token manquant");
        return;
      }
      
      // Mise à jour optimiste de l'UI avant la réponse du serveur
      const isCurrentlyConfirmed = confirmedRappels.includes(id_rappel);
      
      // Mettre à jour l'état local immédiatement pour une réponse UI instantanée
      setConfirmedRappels(prev => 
        isCurrentlyConfirmed
          ? prev.filter(id => id !== id_rappel)
          : [...prev, id_rappel]
      );
      
      // Mettre à jour la liste principale des rappels immédiatement
      setRappels(prevRappels =>
        prevRappels.map(rappel =>
          rappel.id_rappel === id_rappel
            ? { ...rappel, confirmer_rappel: !isCurrentlyConfirmed }
            : rappel
        )
      );
      
      // Ensuite faire l'appel API
      const response = await fetchWithToken(`/api/rappels/${id_rappel}/confirm`, token, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Si la réponse API est différente de notre mise à jour optimiste, on corrige
      if (response && typeof response.confirmer_rappel === 'boolean' && 
          response.confirmer_rappel !== !isCurrentlyConfirmed) {
        
        setConfirmedRappels(prev =>
          response.confirmer_rappel
            ? [...prev.filter(id => id !== id_rappel), id_rappel]
            : prev.filter(id => id !== id_rappel)
        );

        setRappels(prevRappels =>
          prevRappels.map(rappel =>
            rappel.id_rappel === id_rappel
              ? { ...rappel, confirmer_rappel: response.confirmer_rappel }
              : rappel
          )
        );
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      Alert.alert("Erreur", "Impossible de modifier le statut de confirmation");
      
      // En cas d'erreur, on revient à l'état précédent
      const isCurrentlyConfirmed = confirmedRappels.includes(id_rappel);
      setConfirmedRappels(prev => 
        isCurrentlyConfirmed
          ? prev.filter(id => id !== id_rappel)
          : [...prev, id_rappel]
      );
      
      setRappels(prevRappels =>
        prevRappels.map(rappel =>
          rappel.id_rappel === id_rappel
            ? { ...rappel, confirmer_rappel: isCurrentlyConfirmed }
            : rappel
        )
      );
    }
  };

  useEffect(() => {
    fetchUser();
    fetchRappels();
  }, []);

  const fetchUser = async () => {
    try {
      const prenom = await AsyncStorage.getItem('userFirstName') || 'Prénom';
      setUser({ prenom });
    } catch (error) {
      console.error('Erreur lors de la récupération du prénom:', error);
    }
  };

  const fetchRappels = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const data = await fetchWithToken('/api/rappels/thisrappels', token);
      
      // Ajouter un jour à chaque date_rappel
      const adjustedData = data.map(rappel => ({
        ...rappel,
        date_rappel: (() => {
          const date = new Date(rappel.date_rappel);
          date.setDate(date.getDate() + 1);
          return date.toISOString().split('T')[0];
        })()
      }));
      
      // Tri par date et heure (du plus éloigné au plus proche)
      const sortedData = adjustedData.sort((a, b) => {
        const dateA = new Date(`${a.date_rappel}T${a.heure_rappel}`);
        const dateB = new Date(`${b.date_rappel}T${b.heure_rappel}`);
        return dateB - dateA; // Ordre décroissant
      });
      
      setRappels(sortedData);
      
      // Initialiser les rappels épinglés et confirmés
      setPinnedRappels(sortedData.filter(r => r.favori).map(r => r.id_rappel));
      setConfirmedRappels(sortedData.filter(r => r.confirmer_rappel).map(r => r.id_rappel));
      
      // Calculer les statistiques
      const today = new Date().toISOString().split('T')[0];
      const todayCount = sortedData.filter(r => r.date_rappel === today).length;
      const confirmedCount = sortedData.filter(r => r.confirmer_rappel).length;
      const favorisCount = sortedData.filter(r => r.favori).length;

      // Calculer le nombre de rappels par type
      const updatedTypeColors = TYPE_COLORS.map(type => ({
        ...type,
        count: sortedData.filter(r => r.type_rappel === type.name).length
      }));

      setStats({
        today: todayCount,
        total: sortedData.length,
        confirmed: confirmedCount,
        favoris: favorisCount
      });

      setTypeColors(updatedTypeColors);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de charger les rappels");
    } finally {
      setRefreshing(false);
    }
  };

  const handleTypePress = (type) => {
    setSelectedType(type);
    const filtered = rappels.filter(r => r.type_rappel === type.name);
    setFilteredRappels(filtered);
    setModalType(type.name);
    setModalVisible(true);
  };

  const getFilteredRappels = (type) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    let result = [];
    
    switch(type) {
      case 'today':
        result = rappels.filter(r => r.date_rappel === today);
        break;
      case 'all':
        result = [...rappels];
        break;
      case 'past':
        result = rappels.filter(r => {
          const rappelDate = new Date(`${r.date_rappel}T${r.heure_rappel}`);
          return rappelDate < now;
        });
        break;
      case 'current':
        result = rappels.filter(r => {
          const rappelDate = new Date(`${r.date_rappel}T${r.heure_rappel}`);
          return rappelDate >= now;
        });
        break;
      default:
        result = rappels.filter(r => r.type_rappel === type);
        break;
    }
    
    // Tri par date et heure (du plus éloigné au plus proche)
    return result.sort((a, b) => {
      const dateA = new Date(`${a.date_rappel}T${a.heure_rappel}`);
      const dateB = new Date(`${b.date_rappel}T${b.heure_rappel}`);
      return dateB - dateA; // Ordre décroissant (du plus éloigné au plus proche)
    });
  };

  const StatCard = ({ icon, title, count, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: color }]}
      onPress={onPress}
    >
      <View style={styles.statIconContainer}>
        <MaterialIcons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statCount}>{count}</Text>
      </View>
    </TouchableOpacity>
  );

  const StatusBar = ({ icon, title, count, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.statusBar, { backgroundColor: color }]}
      onPress={onPress}
    >
      <View style={styles.statusBarLeft}>
        <MaterialIcons name={icon} size={24} color="#fff" />
        <Text style={styles.statusBarText}>{title}</Text>
      </View>
      <View style={styles.statusBarRight}>
        <Text style={styles.statusBarCount}>{count}</Text>
        <MaterialIcons name="chevron-right" size={24} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const TypeItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.typeItem, { backgroundColor: item.lightColor }]}
      onPress={() => handleTypePress(item)}
    >
      <View style={styles.typeItemLeft}>
        <MaterialIcons name={item.icon} size={24} color={item.color} />
        <Text style={[styles.typeItemText, { color: item.color }]}>{item.name}</Text>
      </View>
      <View style={styles.typeItemRight}>
        <Text style={[styles.typeItemCount, { color: item.color }]}>{item.count}</Text>
        <MaterialIcons name="chevron-right" size={24} color={item.color} />
      </View>
    </TouchableOpacity>
  );

  const RappelModal = () => {
    const modalTitle = modalType === 'today' ? "Rappels d'aujourd'hui" :
                      modalType === 'all' ? "Tous les rappels" :
                      modalType === 'past' ? "Rappels passés" :
                      modalType === 'current' ? "Rappels en cours" :
                      `${modalType} (${filteredRappels.length})`;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredRappels}
              keyExtractor={item => item.id_rappel.toString()}
              renderItem={({ item }) => {
                const type = typeColors.find(t => t.name === item.type_rappel) || typeColors[9];
                const isFavorite = pinnedRappels.includes(item.id_rappel);
                const isConfirmed = confirmedRappels.includes(item.id_rappel);
                
                return (
                  <View style={[styles.rappelCard, { borderLeftColor: type.color }]}>
                    <View style={styles.rappelHeader}>
                      <View style={styles.rappelTypeContainer}>
                        <MaterialIcons name={type.icon} size={24} color={type.color} />
                        <Text style={[styles.rappelType, { color: type.color }]}>
                          {item.type_rappel}
                        </Text>
                      </View>
                      <View style={styles.rappelIcons}>
                        <TouchableOpacity onPress={() => togglePin(item.id_rappel)}>
                          <MaterialIcons 
                            name={isFavorite ? "star" : "star-border"} 
                            size={24} 
                            color="#FFD700" 
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleConfirm(item.id_rappel)}>
                          <MaterialIcons 
                            name={isConfirmed ? "check-circle" : "check-circle-outline"} 
                            size={24} 
                            color="#4CAF50" 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.rappelDesc}>{item.description}</Text>
                    <Text style={styles.rappelTime}>🕒 {item.heure_rappel}</Text>
                    <Text style={styles.rappelDate}>📅 {item.date_rappel}</Text>
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>Aucun rappel trouvé</Text>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = rappels.filter(r => 
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      // Tri par date et heure (du plus éloigné au plus proche)
      const sortedResults = filtered.sort((a, b) => {
        const dateA = new Date(`${a.date_rappel}T${a.heure_rappel}`);
        const dateB = new Date(`${b.date_rappel}T${b.heure_rappel}`);
        return dateB - dateA; // Ordre décroissant
      });
      setSearchResults(sortedResults);
    }
  }, [searchQuery, rappels]);

  const renderContent = () => {
    
    // Seulement les types de rappels dans la FlatList verticale
    const allItems = [
      ...typeColors.map(type => ({ type: 'type', data: type }))
    ];

    return (
      <FlatList
        data={allItems}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.type === 'title') {
            return <Text style={styles.typesTitle}>{item.data}</Text>;
          } else {
            return <TypeItem item={item.data} />;
          }
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bleu sans flèche retour */}
      <View style={styles.headerContainer}>
        <View style={styles.headerCenter}>
          <MaterialIcons name="filter-list" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Filtres</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('../../../indexPatient')}>
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche simplifiée */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={24} color="#2196F3" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Contenu principal */}
      {searchQuery.trim() === '' ? (
        <>
          {/* Texte de bienvenue réduit */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.welcomeNameText}>{user.prenom} !</Text>
          </View>

          {/* Statistiques */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard
                icon="today"
                title="Aujourd'hui"
                count={stats.today}
                color="#2196F3"
                onPress={() => {
                  setModalType('today');
                  setFilteredRappels(getFilteredRappels('today'));
                  setModalVisible(true);
                }}
              />
              <StatCard
                icon="list"
                title="Tous"
                count={stats.total}
                color="#2196F3"
                onPress={() => {
                  setModalType('all');
                  setFilteredRappels(getFilteredRappels('all'));
                  setModalVisible(true);
                }}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon="history"
                title="Passés"
                count={getFilteredRappels('past').length}
                color="#2196F3"
                onPress={() => {
                  setModalType('past');
                  setFilteredRappels(getFilteredRappels('past'));
                  setModalVisible(true);
                }}
              />
              <StatCard
                icon="schedule"
                title="En cours"
                count={getFilteredRappels('current').length}
                color="#2196F3"
                onPress={() => {
                  setModalType('current');
                  setFilteredRappels(getFilteredRappels('current'));
                  setModalVisible(true);
                }}
              />
            </View>
          </View>

          {/* Section Status avec les deux cadres côte à côte */}
          <View style={styles.statusSection}>
            <Text style={styles.typesTitle}>Status</Text>
            <View style={styles.statsRow}>
              <StatCard
                icon="check-circle"
                title="Confirmés"
                count={stats.confirmed}
                color="#47d147"
                onPress={() => router.push('./confirmed')}
              />
              <StatCard
                icon="star"
                title="Favoris"
                count={stats.favoris}
                color="#ffd633"
                onPress={() => router.push('./pinned')}
              />
            </View>
          </View>

          {/* Liste des types */}
          <View style={styles.typesContainer}>
            <FlatList
              data={typeColors}
              keyExtractor={item => item.name}
              renderItem={({ item }) => <TypeItem item={item} />}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </>
      ) : (
        /* Résultats de recherche */
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>
            Résultats ({searchResults.length})
          </Text>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id_rappel.toString()}
            renderItem={({ item }) => {
              const type = typeColors.find(t => t.name === item.type_rappel) || typeColors[9];
              const isFavorite = pinnedRappels.includes(item.id_rappel);
              const isConfirmed = confirmedRappels.includes(item.id_rappel);
              
              return (
                <View style={[styles.rappelCard, { borderLeftColor: type.color }]}>
                  <View style={styles.rappelHeader}>
                    <View style={styles.rappelTypeContainer}>
                      <MaterialIcons name={type.icon} size={24} color={type.color} />
                      <Text style={[styles.rappelType, { color: type.color }]}>
                        {item.type_rappel}
                      </Text>
                    </View>
                    <View style={styles.rappelIcons}>
                      <TouchableOpacity onPress={() => togglePin(item.id_rappel)}>
                        <MaterialIcons 
                          name={isFavorite ? "star" : "star-border"} 
                          size={24} 
                          color="#FFD700" 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleConfirm(item.id_rappel)}>
                        <MaterialIcons 
                          name={isConfirmed ? "check-circle" : "check-circle-outline"} 
                          size={24} 
                          color="#4CAF50" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.rappelDesc}>{item.description}</Text>
                  <Text style={styles.rappelTime}>🕒 {item.heure_rappel}</Text>
                  <Text style={styles.rappelDate}>📅 {item.date_rappel}</Text>
                </View>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>Aucun résultat trouvé</Text>
            }
          />
        </View>
      )}

      <RappelModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#2196F3',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchContainer: {
    alignItems: 'center',
    marginTop: -20,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    width: '80%',
    height: 50,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 0,
  },
  welcomeText: {
    color: '#2196F3',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  welcomeNameText: {
    color: '#2196F3',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 5,
  },
  statsContainer: {
    padding: 15,
    marginBottom: -15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    width: '48%',
    elevation: 2,
    height: 80, // Hauteur réduite pour les cartes de statut
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statCount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusSection: {
    padding: 15,
    marginBottom: -25,
  },
  typesContainer: {
    flex: 1,
    padding: 15,
  },
  typesTitle: {
    color: '#2196F3',
    fontSize: 23,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 15,
    marginTop: -15,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  typeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  typeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeItemCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rappelCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
    borderLeftWidth: 5,
  },
  rappelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rappelTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rappelType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  rappelIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rappelDesc: {
    fontSize: 16,
    marginBottom: 8,
  },
  rappelTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rappelDate: {
    fontSize: 14,
    color: '#666',
  },
  searchResultsContainer: {
    flex: 1,
    padding: 15,
  },
  searchResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2196F3',
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    width: '100%',
    alignSelf: 'center',
  },
  statusBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBarText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  statusBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBarCount: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
