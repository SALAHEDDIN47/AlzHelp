import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithToken } from '../../../../utils/fetchNgrok';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';


export default function Pinned() {
  const [rappels, setRappels] = useState([]);
  const [pinnedRappels, setPinnedRappels] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchRappels = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return Alert.alert("Erreur", "Token manquant");

        const data = await fetchWithToken('/api/rappels/thisrappels', token);
        setRappels(data);
        setPinnedRappels(data.filter(r => r.ispinned).map(r => r.id_rappel));
      } catch (err) {
        console.error("Erreur fetch rappels:", err);
        Alert.alert("Erreur", "Chargement échoué");
      } finally {
        setLoading(false);
      }
    };

   if (isFocused) {
   fetchRappels();
   }
  }, [isFocused]);

  const handleTogglePin = async (id_rappel) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const result = await fetchWithToken(`/api/rappels/${id_rappel}/pin`, token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setPinnedRappels(prev =>
        result.ispinned
          ? [...prev, id_rappel]
          : prev.filter(id => id !== id_rappel)
      );
    } catch (err) {
      console.error("Erreur toggle pin:", err);
      Alert.alert("Erreur", "Impossible de changer l'état d'épingle");
    }
  };

  const pinnedList = rappels.filter(r => pinnedRappels.includes(r.id_rappel));

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />;
  }

  return (
    <FlatList
      data={pinnedList}
      keyExtractor={(item) => item.id_rappel.toString()}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.rappel}>
          <TouchableOpacity
            style={styles.pinButton}
            onPress={() => handleTogglePin(item.id_rappel)}
          >
            <Ionicons
              name={pinnedRappels.includes(item.id_rappel) ? "pin" : "pin-outline"}
              size={pinnedRappels.includes(item.id_rappel) ? 40 : 30}
              color={pinnedRappels.includes(item.id_rappel) ? "#007AFF" : "#888"}
            />
          </TouchableOpacity>
          <Text style={styles.texte}>📌 {item.description}</Text>
          <Text style={styles.texte}>🕒 {item.heure_rappel}</Text>
          <Text style={styles.texte}>📅 {new Date(item.date_rappel).toLocaleDateString("fr-FR")}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  rappel: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    margin: 40,
    elevation: 10,
    position: 'relative',
  },
  texte: {
    fontSize: 20,
    color: 'black',
    
  },
  pinButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    zIndex: 10,
  },
});

