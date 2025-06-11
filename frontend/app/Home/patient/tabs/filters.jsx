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
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const reminderTypes = ['Tous', 'Médicament', 'Rendez-vous', 'Autre', 'Historique'];

const HomeScreen = () => {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedType, setSelectedType] = useState('Tous');
  const inputRef = useRef(null);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    setReminders([
      { id: '1', titre: 'Prendre médicament du matin', type: 'Médicament' },
      { id: '2', titre: 'Faire une promenade', type: 'Rendez-vous' },
      { id: '3', titre: 'Boire de l’eau', type: 'Médicament' },
      { id: "4", titre: "Prendre vitamine D", type: "Médicament" },
      { id: "5", titre: "Consultation chez le médecin", type: "Rendez-vous" },
      { id: "6", titre: "Prendre antihistaminique", type: "Médicament" },
      { id: "7", titre: "Rendez-vous chez le dentiste", type: "Rendez-vous" },
      { id: "8", titre: "Prendre complément alimentaire", type: "Médicament" },
      { id: "9", titre: "Séance de kinésithérapie", type: "Rendez-vous" },
      { id: "10", titre: "Prendre traitement pour la tension", type: "Médicament" },
      { id: "11", titre: "Visite médicale annuelle", type: "Rendez-vous" },
      { id: "12", titre: "Prendre antidouleur si nécessaire", type: "Médicament" },
      { id: "13", titre: "Rendez-vous chez l'ophtalmologue", type: "Rendez-vous" },
      { id: "14", titre: "Prendre médicament pour le sommeil", type: "Médicament" },
      { id: "15", titre: "Rendez-vous avec un nutritionniste", type: "Rendez-vous" },
      { id: "16", titre: "Prendre traitement contre l'acidité", type: "Médicament" },
      { id: "17", titre: "Rendez-vous chez le podologue", type: "Rendez-vous" },
      { id: "18", titre: "Prendre probiotique", type: "Médicament" },
      { id: "19", titre: "Consultation dermatologique", type: "Rendez-vous" },
      { id: "20", titre: "Prendre médicament pour les articulations", type: "Médicament" },
    ]);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const result = reminders.filter(r =>
        r.titre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReminders(result);
    } else {
      setFilteredReminders([]);
    }
  }, [searchQuery]);

  const toggleSearch = () => {
    if (searchActive) {
      Keyboard.dismiss();
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setSearchActive(false);
        setSearchQuery('');
      });
    } else {
      setSearchActive(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start(() => inputRef.current?.focus());
    }
  };

  const filteredByType =
    selectedType === 'Tous'
      ? reminders
      : reminders.filter(reminder => reminder.type === selectedType);

  const displayList = searchQuery ? filteredReminders : filteredByType;
  const noResults = searchQuery && filteredReminders.length === 0;

  return (
    <View style={styles.container}>
      {/* Barre de Recherche */}
      <View style={styles.header}>
        {!searchActive ? (
          <TouchableOpacity onPress={toggleSearch}>
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
        ) : (
          <View style={styles.searchBar}>
            <TextInput
              ref={inputRef}
              placeholder="Rechercher..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Barre de Choix */}
      <View style={styles.choices}>
        {reminderTypes.map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setSelectedType(type)}
            style={[
              styles.choiceButton,
              selectedType === type && styles.choiceSelected,
            ]}
            activeOpacity={0.7}
          >
            <Text style={{ color: selectedType === type ? 'white' : 'black' }}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des rappels */}
      <FlatList
        data={displayList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.titre}</Text>
            <Text style={styles.type}>{item.type}</Text>
          </View>
        )}
      />

      {/* Aucun résultat */}
      {noResults && (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#777' }}>
          Aucun résultat trouvé.
        </Text>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.push('/confirmed')}>
          <FontAwesome name="check-circle" size={24} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/pinned')}>
          <FontAwesome name="thumb-tack" size={24} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/history')}>
          <FontAwesome name="history" size={24} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/filters')}>
          <FontAwesome name="filter" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  choices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  choiceButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ddd',
    margin: 4,
  },
  choiceSelected: {
    backgroundColor: '#007bff',
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  type: {
    fontSize: 14,
    color: '#777',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
});
