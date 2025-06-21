import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image, Modal, Animated, Easing, TextInput, ActivityIndicator, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithToken } from '../../../../utils/fetchNgrok';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";

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

const sortRappels = (rappels) => {
  return [...rappels].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.description.length - a.description.length;
  });
};

export default function Confirmed() {
  const [rappels, setRappels] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [user, setUser] = useState({ nom: 'Nom', prenom: 'Prénom', image: null });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRappel, setSelectedRappel] = useState(null);
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [search, setSearch] = useState('');
  const switchAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Animated.timing(switchAnim, {
      toValue: showConfirmed ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [showConfirmed]);

  // Fonctions de navigation
  const handleGoBack = () => {
    router.back();
  };

  const handleHomePress = () => {
    router.push('../../../indexPatient');
  };

  useEffect(() => {
    const fetchRappels = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert("Erreur", "Token manquant");
        const data = await fetchWithToken('/api/rappels/thisrappels', token);
        setRappels(data);
        setConfirmedIds(data.filter(r => r.confirmer_rappel).map(r => r.id_rappel));
      } catch (err) {
        console.error(err);
        Alert.alert("Erreur", "Impossible de charger les rappels");
      }
    };
    const fetchUser = async () => {
      // Récupérer nom, prénom et image comme dans l'accueil
      const nom = await AsyncStorage.getItem('userLastName') || 'Nom';
      const prenom = await AsyncStorage.getItem('userFirstName') || 'Prénom';
      const image = await AsyncStorage.getItem('userImage');
      setUser({ nom, prenom, image });
    };
    fetchRappels();
    fetchUser();
  }, []);

  const toggleConfirmation = async (id_rappel) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const result = await fetchWithToken(`/api/rappels/${id_rappel}/confirm`, token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      setConfirmedIds(prev =>
        result.confirmer_rappel
          ? [...prev, id_rappel]
          : prev.filter(id => id !== id_rappel)
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Erreur de confirmation");
    }
  };

  // Date et heure actuelles
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Helpers pour filtrer
  console.log('DATE COURANTE:', now);
  // Ajoute un jour à la date de rappel et retourne la date JS
  const getRappelDatePlus1 = (r) => {
    if (!r.date_rappel || !r.heure_rappel) return null;
    const datePart = r.date_rappel.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = r.heure_rappel.split(':');
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day) + 1,
      Number(hour),
      Number(minute),
      Number(second || 0)
    );
  };

  const isPast = (r) => {
    const rappelDate = getRappelDatePlus1(r);
    if (!rappelDate) return false;
    return rappelDate <= now;
  };
  const isToday = (r) => {
    const rappelDate = getRappelDatePlus1(r);
    if (!rappelDate) return false;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return rappelDate.getFullYear() === today.getFullYear() && rappelDate.getMonth() === today.getMonth() && rappelDate.getDate() === today.getDate();
  };
  const isNotConfirmed = (r) => !confirmedIds.includes(r.id_rappel);
  const isConfirmed = (r) => confirmedIds.includes(r.id_rappel);

  // Rappels non confirmés et déjà passés
  console.log('RAPPELS RECUS:', rappels);
  const nonConfirmesEtPasses = rappels.filter(r => isNotConfirmed(r) && isPast(r));
  // Rappels du jour courant, non confirmés, déjà passés
  const rappelsAujourdhui = nonConfirmesEtPasses.filter(isToday);
  // Autres rappels non confirmés, déjà passés, hors aujourd'hui
  const rappelsAutres = nonConfirmesEtPasses.filter(r => !isToday(r));

  // Rappels confirmés et déjà passés
  const confirmesEtPasses = rappels.filter(r => isConfirmed(r) && isPast(r));
  // Rappels du jour courant, confirmés, déjà passés
  const rappelsAujourdhuiConfirmes = confirmesEtPasses.filter(isToday);
  // Autres rappels confirmés, déjà passés, hors aujourd'hui
  const rappelsAutresConfirmes = confirmesEtPasses.filter(r => !isToday(r));

  const handleConfirmPress = (rappel) => {
    setSelectedRappel(rappel);
    setModalVisible(true);
  };
  const handleModalConfirm = async () => {
    if (selectedRappel) {
      // Mise à jour locale immédiate
      setConfirmedIds(prev => [...prev, selectedRappel.id_rappel]);
      setModalVisible(false);
      setSelectedRappel(null);
      // Appel API en arrière-plan
      try {
        const token = await AsyncStorage.getItem('token');
        await fetchWithToken(`/api/rappels/${selectedRappel.id_rappel}/confirm`, token, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        // Optionnel : afficher une erreur si la confirmation échoue côté serveur
        console.error(err);
      }
    }
  };
  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedRappel(null);
  };

  // Palette type/couleur/icône pour le modal (similaire à GestionRappels)
  const TYPE_STYLES = {
    'Médicament': { color: '#4CAF50', light: '#E8F5E9', icon: 'local-pharmacy' },
    'Communication': { color: '#2196F3', light: '#E3F2FD', icon: 'chat' },
    'Quotidien': { color: '#FF9800', light: '#FFF3E0', icon: 'schedule' },
    'Sécurité': { color: '#F44336', light: '#FFEBEE', icon: 'warning' },
    'Activité': { color: '#9C27B0', light: '#F3E5F5', icon: 'directions-run' },
    'Événement': { color: '#3F51B5', light: '#E8EAF6', icon: 'event' },
    'Rendez-vous': { color: '#009688', light: '#E0F2F1', icon: 'event-available' },
    'Hydratation': { color: '#00BCD4', light: '#E0F7FA', icon: 'opacity' },
    'Nutrition': { color: '#FFC107', light: '#FFF8E1', icon: 'restaurant' },
    'Autres': { color: '#9E9E9E', light: '#F5F5F5', icon: 'more-horiz' },
  };

  // Nouveau Header inspiré de pinned.jsx
  const Header = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.headerLeft} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
        <Text style={styles.confirmedText}>Confirmés</Text>
      </View>
      <TouchableOpacity style={styles.headerRight} onPress={handleHomePress}>
        <Ionicons name="home" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Fond bleu */}
      <View style={styles.blueBg} />
      
      {/* Nouveau header */}
      <Header />
      
      <View style={styles.content}>
        {/* Bonjour */}
        <Text style={styles.bonjour}>   Bonjour,</Text>
        <Text style={styles.bonjour}>  {user.nom} {user.prenom} !</Text>
        
        {/* Switch animé */}
        <View style={styles.switchContainer}>
          <View style={styles.switchBg}>
            <Animated.View
              style={[
                styles.switchThumb,
                {
                  left: switchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 187],
                  }),
                },
              ]}
            />
            <TouchableOpacity
              style={[styles.switchSide, { left: 0 }]}
              activeOpacity={0.8}
              onPress={() => setShowConfirmed(false)}
            >
              <Text style={[styles.switchText, !showConfirmed && styles.switchTextActive]}>Non confirmés</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchSide, { right: 0 }]}
              activeOpacity={0.8}
              onPress={() => setShowConfirmed(true)}
            >
              <Text style={[styles.switchText, showConfirmed && styles.switchTextActive]}>Confirmés</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Compteur de rappels */}
        <View style={styles.unconfirmedBox}>
          <Text style={styles.unconfirmedText}>
            {showConfirmed ? 'Rappels confirmés' : 'Rappels à confirmer'}
          </Text>
          <View style={styles.unconfirmedCountBox}>
            <Text style={styles.unconfirmedCount}>
              {showConfirmed ? 
                (rappelsAujourdhuiConfirmes.length + rappelsAutresConfirmes.length) : 
                (rappelsAujourdhui.length + rappelsAutres.length)}
            </Text>
          </View>
        </View>

        {/* Liste unique des rappels */}
        <FlatList
          data={[
            { type: 'header', title: 'Aujourd\'hui', icon: 'today' },
            { type: 'today', rappels: sortRappels(showConfirmed ? rappelsAujourdhuiConfirmes : rappelsAujourdhui) },
            { type: 'header', title: 'Rappels', icon: 'list' },
            ...sortRappels(showConfirmed ? rappelsAutresConfirmes : rappelsAutres)
          ].filter(item => 
            item.type === 'header' || 
            item.type === 'today' ||
            item.description.toLowerCase().includes(search.toLowerCase())
          )}
          keyExtractor={(item, index) => 
            item.type === 'header' ? `header-${item.title}` : 
            item.type === 'today' ? 'today-section' : 
            item.id_rappel.toString()
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <MaterialIcons name={item.icon} size={22} color="#666" />
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  {item.title === 'Rappels' && (
                    <View style={styles.inlineSearchBar}>
                      <TextInput
                        placeholder="Entrez pour rechercher..."
                        placeholderTextColor="#aaa"
                        style={styles.inlineSearchInput}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                        clearButtonMode="while-editing"
                      />
                      <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons 
                          name={search ? "close-circle" : "search"} 
                          size={18} 
                          color="#2196F3" 
                          style={{ marginLeft: 4 }} 
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }

            if (item.type === 'today') {
              return (
                <View>
                  <FlatList
                    data={item.rappels.filter(r => r.description.toLowerCase().includes(search.toLowerCase()))}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 10, paddingRight: 10, paddingBottom: 10 }}
                    renderItem={({ item: todayItem }) => {
                      const typeObj = TYPES.find(t => t.name === todayItem.type_rappel) || TYPES[5];
                      return (
                        <View style={[styles.rappelCardHorizontal, { borderLeftColor: typeObj.color }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <MaterialIcons name={typeObj.icon} size={24} color={typeObj.color} style={{ marginRight: 8 }} />
                              <Text style={[styles.rappelType, { color: typeObj.color }]}>{todayItem.type_rappel}</Text>
                            </View>
                            {todayItem.isPinned && (
                              <MaterialIcons name="star" size={24} color={typeObj.color} />
                            )}
                          </View>
                          <Text style={styles.rappelDesc}>{todayItem.description}</Text>
                          <Text style={styles.rappelTime}>🕒 {todayItem.heure_rappel}</Text>
                          <Text style={styles.rappelDate}>📅 {(() => { 
                            const d = getRappelDatePlus1(todayItem); 
                            return d ? d.toLocaleDateString('fr-FR') : ''; 
                          })()}</Text>
                          {!showConfirmed && (
                            <TouchableOpacity
                              style={[styles.confirmBtn, { backgroundColor: typeObj.color }]}
                              onPress={() => handleConfirmPress(todayItem)}
                            >
                              <Text style={styles.confirmBtnText}>confirmer</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    }}
                    ListEmptyComponent={
                      isLoading
                        ? <Text style={styles.emptyText}>Chargement...</Text>
                        : <Text style={styles.emptyText}>Aucun rappel aujourd'hui</Text>
                    }
                  />
                </View>
              );
            }

            const typeObj = TYPES.find(t => t.name === item.type_rappel) || TYPES[5];
            return (
              <View style={[styles.rappelCard, { borderLeftColor: typeObj.color }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name={typeObj.icon} size={24} color={typeObj.color} style={{ marginRight: 8 }} />
                    <Text style={[styles.rappelType, { color: typeObj.color }]}>{item.type_rappel}</Text>
                  </View>
                  {item.isPinned && (
                    <MaterialIcons name="star" size={24} color={typeObj.color} />
                  )}
                </View>
                <Text style={styles.rappelDesc}>{item.description}</Text>
                <Text style={styles.rappelTime}>🕒 {item.heure_rappel}</Text>
                <Text style={styles.rappelDate}>📅 {(() => { 
                  const d = getRappelDatePlus1(item); 
                  return d ? d.toLocaleDateString('fr-FR') : ''; 
                })()}</Text>
                {!showConfirmed && (
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: typeObj.color }]}
                    onPress={() => handleConfirmPress(item)}
                  >
                    <Text style={styles.confirmBtnText}>confirmer</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading
              ? <Text style={styles.emptyText}>Chargement...</Text>
              : <Text style={styles.emptyText}>Aucun rappel trouvé</Text>
          }
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            // Simuler une mise à jour des rappels
            setTimeout(() => {
              setRefreshing(false);
            }, 2000);
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                // Simuler une mise à jour des rappels
                setTimeout(() => {
                  setRefreshing(false);
                }, 2000);
              }}
              colors={['#2196F3']}
              tintColor="#2196F3"
              progressBackgroundColor="transparent"
              progressViewOffset={10}
              size="default"
            />
          }
        />

        {/* Modal de confirmation */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleModalCancel}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 18, padding: 28, width: 340, alignItems: 'center', elevation: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18, color: '#222', textAlign: 'center' }}>
                Voulez-vous confirmer ce rappel ?
              </Text>
              {selectedRappel && (() => {
                const type = TYPE_STYLES[selectedRappel.type_rappel] || TYPE_STYLES['Autres'];
                const dateStr = (() => { const d = getRappelDatePlus1(selectedRappel); return d ? d.toLocaleDateString('fr-FR') : ''; })();
                return (
                  <View style={{ width: '100%', marginBottom: 18 }}>
                    {/* Type */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <View style={{ backgroundColor: type.light, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name={type.icon} size={20} color={type.color} style={{ marginRight: 7 }} />
                        <Text style={{ color: type.color, fontWeight: 'bold', fontSize: 15 }}>{selectedRappel.type_rappel}</Text>
                      </View>
                    </View>
                    {/* Infos dans un cadre à fond blanc, border bleu clair */}
                    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 3, borderWidth: 1, borderColor: '#90CAF9' }}>
                      {/* Description */}
                      <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 15, marginBottom: 5 }}>Description :</Text>
                      <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 20, marginBottom: 10 }}>{selectedRappel.description}</Text>
                      {/* Date rappel */}
                      <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 15, marginBottom: 10 }}>--------------Date rappel--------------</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#90CAF9', marginRight: 8 }}>
                          <Ionicons name="time" size={16} color="#1976D2" style={{ marginRight: 3 }} />
                          <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 20 }}>{selectedRappel.heure_rappel}</Text>
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
                  style={{ backgroundColor: '#007AFF', borderRadius: 10, paddingHorizontal: '12%', paddingVertical: 10, marginRight: 10 }}
                  onPress={handleModalConfirm}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#E3F2FD', borderRadius: 10, paddingHorizontal: '15%', paddingVertical: 10 }}
                  onPress={handleModalCancel}
                >
                  <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blueBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
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
  headerLeft: { 
    backgroundColor: 'transparent', 
    padding: 4 
  },
  headerCenter: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    alignItems: 'center', 
    top: 40,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  headerRight: { 
    backgroundColor: 'transparent', 
    padding: 4 
  },
  confirmedText: { 
    color: '#4CAF50', 
    fontWeight: 'bold', 
    fontSize: 20, 
    marginLeft: 4 
  },
  content: { 
    flex: 1, 
    marginTop: 10, 
    paddingHorizontal: 16, 
    zIndex: 1 
  },
  bonjour: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 26, 
    marginBottom: 10, 
    marginTop: 10 
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 16,
    zIndex: 10,
  },
  switchBg: {
    width: 370,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
    elevation: 2,
  },
  switchThumb: {
    position: 'absolute',
    top: -2,
    width: 185,
    height: 45,
    borderRadius: 18,
    backgroundColor: '#00cc99',
    zIndex: 1,
    shadowColor: '#00cc99',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  switchSide: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    position: 'absolute',
    width: 185,
  },
  switchText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 15,
    zIndex: 3,
  },
  switchTextActive: {
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 6
  },
  iconBack: {
    marginRight: 8
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  headerText: {
    fontSize: 19,
    color: '#222',
    fontWeight: '400',
    marginBottom: 2
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111'
  },
  unconfirmedBox: {
    backgroundColor: '#5CB6FF',
    marginHorizontal: 10,
    marginVertical: 3,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
  },
  unconfirmedText: {
    color: '#fff',
    fontSize: 16
  },
  unconfirmedCountBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 50,
    paddingHorizontal: 40,
    paddingVertical: 4
  },
  unconfirmedCount: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 10,
    marginRight: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 8,
    marginBottom: 0,
    marginTop: 0,
  },
  rappelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    borderLeftWidth: 5,
  },
  rappelType: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2
  },
  rappelDesc: {
    fontSize: 18,
    color: '#222',
    marginBottom: 4,
    fontWeight: '500'
  },
  rappelTime: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
    fontWeight: '500'
  },
  rappelDate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500'
  },
  confirmBtn: {
    borderRadius: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 7
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  inlineSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 2,
    marginLeft: 12,
    minWidth: 250,
    maxWidth: 260,
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
  rappelCardHorizontal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    width: 350,
    height: 160,
    elevation: 3,
    justifyContent: 'space-between',
    borderLeftWidth: 5,
  },
  emptyText: {
    color: '#888',
    marginLeft: 16,
    marginTop: 20
  },
});