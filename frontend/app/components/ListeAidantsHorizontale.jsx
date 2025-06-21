import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter,useLocalSearchParams } from "expo-router";
import { BASE_URL } from "../../utils/fetchNgrok";
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';

const BLUE = "#007AFF";
const { width } = Dimensions.get('window');
const AIDANT_CARD_SIZE = 70;

export default function ListeAidantsHorizontale() {
  const [aidants, setAidants] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAidants = async () => {
      const token = await AsyncStorage.getItem("token");
      console.log("token:", token);
      const userId = await AsyncStorage.getItem("userId");
      console.log("userId:", userId);
      try {
        const res = await fetch(`${BASE_URL}/api/aidants/AidantsForpatients/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        
        // Trier les aidants par date d'ajout (le plus récent en premier)
        const sortedAidants = data.sort((a, b) => {
          // Utiliser accompagnement_created_at pour trier par date d'ajout de l'accompagnement
          if (a.accompagnement_created_at && b.accompagnement_created_at) {
            return new Date(b.accompagnement_created_at) - new Date(a.accompagnement_created_at);
          }
          // Par défaut, on garde l'ordre d'arrivée (les plus récents en premier)
          return 0;
        });
        
        setAidants(sortedAidants);
      } catch (err) {
        console.error("Erreur lors du fetch des aidants:", err);
      }
    };

    fetchAidants();
  }, []);

  const speakInfo = (aidant) => {
    const age = new Date().getFullYear() - new Date(aidant.d_naissanceaidant).getFullYear();
    const msg = `C'est ton aidant : ${aidant.prenomaidant} ${aidant.nomaidant}, son âge est ${age} ans. Pour le contacter, vous pouvez cliquer sur l'un des boutons devant vous.`;
    Speech.speak(msg, { language: 'fr-FR' });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.aidantCard}
      onPress={() => {
        speakInfo(item);
        router.push({
          pathname: "../detailsAidant",
          params: { aidant: encodeURIComponent(JSON.stringify(item)) },
        });
      }}
    >
      <Image 
        source={
          item.image_url 
            ? { uri: `${BASE_URL}/${item.image_url}` }
            : require('../../assets/default-avatar.png')
        } 
        style={styles.aidantImage} 
      />
      <Text style={styles.aidantName} numberOfLines={1}>{item.prenomaidant}</Text>
      <Text style={styles.aidantName} numberOfLines={1}>{item.nomaidant}</Text>
      <View style={styles.lienFamilialRow}>
        <MaterialIcons name="people" size={16} color={BLUE} style={{marginRight: 3}} />
        <Text style={styles.lienFamilialText} numberOfLines={1}>{item.lien_familial || "-"}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!aidants.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Mes Aidants</Text>
      <FlatList
      
        data={aidants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_aidant.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 3,
    color: '#333',
  },
  aidantCard: {
    width: AIDANT_CARD_SIZE + 15,
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#f7f7f7',
    borderRadius: 15,
    padding: 6,
    elevation: 2,
  },
  aidantImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
    backgroundColor: '#e0e0e0',
  },
  aidantName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 70,
  },
  lienFamilialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    maxWidth: 80,
    alignSelf: 'center',
  },
  lienFamilialText: {
    fontSize: 11,
    color: BLUE,
    fontWeight: 'bold',
    flexShrink: 1,
    maxWidth: 60,
  },
});
