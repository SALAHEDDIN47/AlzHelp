import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter,useLocalSearchParams } from "expo-router";
import { BASE_URL } from "../../utils/fetchNgrok"; // ← AJOUT ICI
import * as Speech from 'expo-speech';


// ... imports

export default function ListeAidantsHorizontale() {
  const [aidants, setAidants] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAidants = async () => {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      try {
        const res = await fetch(`${BASE_URL}/api/aidants/patients/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setAidants(data);
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
      style={styles.card}
      onPress={() => {
        speakInfo(item);
        router.push({
          pathname: "../detailsAidant",
          params: { aidant: encodeURIComponent(JSON.stringify(item)) },
        });
      }}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <Text style={styles.name}>{item.prenomaidant}</Text>
    </TouchableOpacity>
  );

  if (!aidants.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={aidants}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_aidant.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#F1F8F8',
    borderRadius: 40,
    borderColor: "#007AFF",
    borderWidth: 1,
    elevation: 20,
  },
  card: {
    margin: 7,
    alignItems: "center",
    marginLeft: 3,
    alignSelf: 'center',
    borderRadius: 40,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#007AFF",
    elevation: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    width: 80,
  },
  list: {
    backgroundColor: 'transparent',
  },
});
