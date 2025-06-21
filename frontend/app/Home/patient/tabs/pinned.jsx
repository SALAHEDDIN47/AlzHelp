import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Animated, Easing, Alert, Modal, Dimensions, Image, Keyboard, ActivityIndicator, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithToken } from '../../../../utils/fetchNgrok';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const TYPE_COLORS = [
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

const getTypeLabel = (typeName) => typeName === 'Communication' ? 'Contact' : typeName;

export default function Pinned() {
  const [rappels, setRappels] = useState([]);
  const [pinnedRappels, setPinnedRappels] = useState([]);
  const [user, setUser] = useState({ prenom: 'Prénom' });
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [animType] = useState(TYPE_COLORS.map(() => new Animated.Value(0)));
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState();
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const prenom = await AsyncStorage.getItem('userFirstName') || 'Prénom';
      setUser({ prenom });
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetchFavoris();
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const fetchFavoris = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const data = await fetchWithToken('/api/rappels/thisrappels', token);
      setRappels(data.filter(r => r.favori));
      setPinnedRappels(data.filter(r => r.favori).map(r => r.id_rappel));
    } catch (e) {
      Alert.alert('Erreur', 'Chargement échoué');
    } finally {
      setRefreshing(false);
    }
  };

  // Animation cercle doré autour de l'icône sélectionnée
  const animateType = idx => {
    Animated.sequence([
      Animated.timing(animType[idx], { toValue: 1, duration: 250, useNativeDriver: false, easing: Easing.out(Easing.exp) }),
      Animated.timing(animType[idx], { toValue: 0, duration: 250, useNativeDriver: false, easing: Easing.in(Easing.exp) })
    ]).start();
  };

  // Tri par longueur de description décroissante
  const sortedRappels = rappels
    .filter(r => {
      // Si aucun filtre n'est actif, retourner tous les rappels
      if (!isFiltered && !selectedType && !search) return true;
      // Sinon appliquer les filtres
      return (!selectedType || r.type_rappel === selectedType) && 
             r.description.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.description.length - a.description.length);

  // Nouveau Header
  const Header = () => (
    <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.headerCenter} onPress={() => {
        setSelectedType(null);
        setSearch('');
        fetchFavoris();
      }}>
        <MaterialIcons name="star" size={28} color="#FFD700" />
        <Text style={styles.favorisText}>Favoris</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerLeft} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerRight} onPress={() => router.push('../../../indexPatient')}>
        <Ionicons name="home" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
  // TypeIcons avec 5 icônes en haut et 5 en bas
  const TypeIcons = () => (
    <View>
      {/* Première rangée de 5 icônes */}
      <View style={styles.typeRow}>
        {TYPE_COLORS.slice(0, 5).map((type, idx) => {
          const selected = selectedType === type.name;
          return (
            <View key={type.name} style={{ alignItems: 'center', flex: 1 }}>
              <Animated.View style={selected ? [styles.typeCircle, {
                borderColor: '#FFD700',
                borderWidth: animType[idx].interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowColor: '#FFD700',
                shadowOpacity: animType[idx],
                shadowRadius: animType[idx].interpolate({ inputRange: [0, 1], outputRange: [0, 8] })
              }] : styles.typeCircle}>
                <TouchableOpacity
                  onPress={() => {
                    const newSelectedType = selected ? null : type.name;
                    setSelectedType(newSelectedType);
                    setIsFiltered(!!newSelectedType || !!search);
                    animateType(idx);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name={type.icon} size={32} color={type.color} />
                </TouchableOpacity>
              </Animated.View>
              <Text style={[styles.typeLabel, { color: type.color }]}>{getTypeLabel(type.name)}</Text>
            </View>
          );
        })}
      </View>
      
      {/* Deuxième rangée de 5 icônes */}
      <View style={styles.typeRow}>
        {TYPE_COLORS.slice(5, 10).map((type, idx) => {
          const actualIdx = idx + 5; // Pour accéder au bon index dans animType
          const selected = selectedType === type.name;
          return (
            <View key={type.name} style={{ alignItems: 'center', flex: 1 }}>
              <Animated.View style={selected ? [styles.typeCircle, {
                borderColor: '#FFD700',
                borderWidth: animType[actualIdx].interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowColor: '#FFD700',
                shadowOpacity: animType[actualIdx],
                shadowRadius: animType[actualIdx].interpolate({ inputRange: [0, 1], outputRange: [0, 8] })
              }] : styles.typeCircle}>
                <TouchableOpacity
                  onPress={() => {
                    const newSelectedType = selected ? null : type.name;
                    setSelectedType(newSelectedType);
                    setIsFiltered(!!newSelectedType || !!search);
                    animateType(actualIdx);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name={type.icon} size={32} color={type.color} />
                </TouchableOpacity>
              </Animated.View>
              <Text style={[styles.typeLabel, { color: type.color }]}>{getTypeLabel(type.name)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  function FavoriCard({ item, index, onDelete }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay: index * 80,
        useNativeDriver: true
      }).start();
    }, []);
    const type = TYPE_COLORS.find(t => t.name === item.type_rappel) || TYPE_COLORS[5];
    return (
      <Animated.View style={[styles.rappelCard, {
        backgroundColor: type.lightColor,
        borderLeftColor: type.color,
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
      }]}>
        <View style={styles.rappelHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name={type.icon} size={28} color={type.color} style={{ marginRight: 8 }} />
            <Text style={[styles.rappelType, { color: type.color }]}>{item.type_rappel}</Text>
          </View>
          <MaterialIcons name="star" size={24} color="#FFD700" style={{ marginLeft: 8 }} />
        </View>
        <Text style={styles.rappelDesc}>{item.description}</Text>
        <Text style={styles.rappelTime}>🕒 {item.heure_rappel}</Text>
        <Text style={styles.rappelDate}>📅 {(() => { const d = new Date(item.date_rappel); return d ? d.toLocaleDateString('fr-FR') : ''; })()}</Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item)}
        >
          <MaterialIcons name="delete" size={20} color="#fff" />
          <Text style={styles.deleteBtnText}>Supprimer</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Nouveau ConfirmModal inspiré de confirmed.jsx
  const ConfirmModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 18, padding: 28, width: 340, alignItems: 'center', elevation: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18, color: '#222', textAlign: 'center' }}>
            Voulez-vous supprimer ce favori ?
          </Text>
          {toDelete && (() => {
            const type = TYPE_COLORS.find(t => t.name === toDelete.type_rappel) || TYPE_COLORS[5];
            const dateStr = (() => { const d = new Date(toDelete.date_rappel); return d ? d.toLocaleDateString('fr-FR') : ''; })();
            return (
              <View style={{ width: '100%', marginBottom: 18 }}>
                {/* Type */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ backgroundColor: type.lightColor, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name={type.icon} size={20} color={type.color} style={{ marginRight: 7 }} />
                    <Text style={{ color: type.color, fontWeight: 'bold', fontSize: 15 }}>{getTypeLabel(toDelete.type_rappel)}</Text>
                  </View>
                </View>
                {/* Infos dans un cadre à fond blanc, border bleu clair */}
                <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 3, borderWidth: 1, borderColor: '#90CAF9' }}>
                  {/* Description */}
                  <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 15, marginBottom: 5 }}>Description :</Text>
                  <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 20, marginBottom: 10 }}>{toDelete.description}</Text>
                  {/* Date rappel */}
                  <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 15, marginBottom: 10 }}>--------------Date rappel--------------</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#90CAF9', marginRight: 8 }}>
                      <Ionicons name="time" size={16} color="#1976D2" style={{ marginRight: 3 }} />
                      <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 20 }}>{toDelete.heure_rappel}</Text>
                    </View>
                    <View style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#90CAF9' }}>
                      <MaterialIcons name="event" size={16} color="#1976D2" style={{ marginRight: 3 }} />
                      <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 20 }}>{dateStr}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })()}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 18 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#FF5252', borderRadius: 10, paddingHorizontal: '12%', paddingVertical: 10, marginRight: 10 }}
              onPress={async () => {
                try {
                  const token = await AsyncStorage.getItem('token');
                  await fetchWithToken(`/api/rappels/${toDelete.id_rappel}/pin`, token, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                  });
                  setModalVisible(false);
                  setToDelete(null);
                  fetchFavoris();
                } catch (e) {
                  Alert.alert('Erreur', 'Suppression échouée');
                }
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Supprimer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#E3F2FD', borderRadius: 10, paddingHorizontal: '15%', paddingVertical: 10 }}
              onPress={() => { setModalVisible(false); setToDelete(null); }}
            >
              <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.blueBg} />
      <Header />
      <View style={styles.content}>
        <Text style={styles.bonjour}>   Bonjour,</Text>
        <Text style={styles.bonjour}>  {user.prenom} !</Text>
        <TypeIcons />
        <View style={styles.rappelsTitleRow}>
           {(isFiltered || selectedType) && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setSelectedType(null);
              setSearch('');
              setIsFiltered(false);
            }}
          >
            <MaterialIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
          <View style={styles.inlineSearchBar}>
            <TextInput
              placeholder="Entrez pour rechercher..."
              placeholderTextColor="#aaa"
              style={styles.inlineSearchInput}
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                setIsFiltered(!!text || !!selectedType);
              }}
              returnKeyType="search"
              autoCorrect={true}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            <Ionicons name="search" size={18} color="#FFD700" style={{ marginLeft: 4 }} />
          </View>
        </View>
       
        
        <FlatList
          data={sortedRappels}
          keyExtractor={item => item.id_rappel.toString()}
          renderItem={({ item, index }) => (
            <FavoriCard item={item} index={index} onDelete={(item) => { setToDelete(item); setModalVisible(true); }} />
          )}
          contentContainerStyle={{ 
            paddingBottom: 40, 
            paddingTop: 10,
            flexGrow: 1 // Assure que le contenu prend toute la hauteur disponible
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
              <Text style={styles.emptyText}>{refreshing ? 'Chargement...' : 'Aucun favoris trouvé'}</Text>
          }
          refreshing={refreshing}
          onRefresh={fetchFavoris}
          keyboardShouldPersistTaps="handled"
          // Personnalisation du composant de rafraîchissement
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchFavoris}
              colors={['#1a1aff']}
              tintColor="#1a1aff"
              progressViewOffset={30}
              size="default"
            />
          }
        />
      </View>
      <ConfirmModal />
    </View>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  blueBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: 220,
    backgroundColor: '#2196F3',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 0
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 18,
    paddingBottom: 10,
    zIndex: 2
  },
  headerLeft: { position: 'relative', left: 10, top: -20, backgroundColor: 'transparent', padding: 4 },
  headerCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center', top: 20, backgroundColor: 'transparent' },
  headerRight: { position: 'absolute', left: 360, top: 20, backgroundColor: 'transparent', padding: 4 },
  favorisText: { color: '#FFD700', fontWeight: 'bold', fontSize: 20, marginLeft: 4 },
  content: { flex: 1, marginTop: 10, paddingHorizontal: 16, zIndex: 1 },
  bonjour: { color: '#fff', fontWeight: 'bold', fontSize: 26, marginBottom: 10, marginTop: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 18,
    elevation: 2
  },
  searchInput: { flex: 1, fontSize: 16, color: '#222', paddingVertical: 4 },
  typeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 10, // Espace entre les deux rangées
    paddingHorizontal: 5 // Ajoute un peu d'espace sur les côtés
  },
  typeCircle: {
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#fff',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  typeLabel: { 
    fontSize: 11, // Légèrement réduit pour s'adapter à l'espace
    fontWeight: 'bold', 
    marginTop: 2,
    textAlign: 'center' // Assure que le texte est centré sous l'icône
  },
  rappelsTitleRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8
  },
  rappelsTitle: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  rappelsLine: {
    flex: 1, height: 2, backgroundColor: '#ccc', marginLeft: 10, borderRadius: 2
  },
  rappelCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    marginHorizontal: 2,
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rappelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  rappelType: { fontSize: 16, fontWeight: 'bold' },
  rappelDesc: { fontSize: 18, color: '#222', marginBottom: 4, fontWeight: '500' },
  rappelTime: { fontSize: 15, color: '#222', marginBottom: 2, fontWeight: '500' },
  rappelDate: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF5252',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7, alignSelf: 'flex-end', marginTop: 8
  },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 6 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 20,
  },
  emptyText: { 
    color: '#888', 
    fontSize: 16, 
    textAlign: 'center'
  },
  inlineSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingLeft:10,
    paddingRight:10,
    paddingVertical: 2,
    marginLeft: 10,
    minWidth: 250,
    maxWidth:260,
    elevation: 1,
  },
  inlineSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    paddingVertical: 2,
    height: 28,
    paddingRight:5,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center',
    elevation: 2,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
});
