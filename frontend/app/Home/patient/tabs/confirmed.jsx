import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithToken } from '../../../../utils/fetchNgrok';
import { Ionicons } from '@expo/vector-icons';

export default function Confirmed() {
  const [rappels, setRappels] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [showConfirmed, setShowConfirmed] = useState(false);

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

    fetchRappels();
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

  const filtered = showConfirmed
    ? rappels.filter(r => confirmedIds.includes(r.id_rappel))
    : rappels.filter(r => !confirmedIds.includes(r.id_rappel));

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          { backgroundColor: showConfirmed ? '#4CAF50' : '#ccc' }
        ]}
        onPress={() => setShowConfirmed(!showConfirmed)}
      >
        <Text style={{ color: '#fff' }}>
          {showConfirmed ? 'Voir Non Confirmés' : 'Voir Confirmés'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id_rappel.toString()}
        renderItem={({ item }) => (
          <View style={styles.rappel}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => toggleConfirmation(item.id_rappel)}
            >
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={confirmedIds.includes(item.id_rappel) ? "#4CAF50" : "#999"}
              />
            </TouchableOpacity>
            <Text style={styles.texte}>📌 {item.description}</Text>
            <Text style={styles.texte}>🕒 {item.heure_rappel}</Text>
            <Text style={styles.texte}>📅 {new Date(item.date_rappel).toLocaleDateString("fr-FR")}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    padding: 12,
    margin: 16,
    borderRadius: 25,
    alignItems: 'center'
  },
  rappel: {
    padding: 20,
    margin: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    elevation: 6,
    position: 'relative'
  },
  texte: {
    fontSize: 18,
    color: 'black'
  },
  confirmButton: {
    position: 'absolute',
    top: 10,
    right: 10
  }
});
