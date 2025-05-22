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
import { useRouter } from "expo-router";
import { BASE_URL } from "../../utils/fetchNgrok"; // ← AJOUT ICI

export default function ListeAidantsHorizontale() {
  const [aidants, setAidants] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAidants = async () => {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      console.log("📦 token récupéré :", token);
      console.log("📦 patientId récupéré :", userId);

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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: "/../Home/patient/detailsAidant",
          params: { aidant: encodeURIComponent(JSON.stringify(item)) },
        });
      }}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <Text style={styles.name}>
        {item.prenomaidant} 
      </Text>
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
     marginLeft: 10 ,
     marginRight:10,
     marginBottom:10,
     margintop:0,
     backgroundColor:'#F1F8F8',
     borderRadius: 40,
     borderColor: "#007AFF",
     borderWidth: 1,
     elevation:20,
     
    },
  title: { 
    fontSize: 25, 
    fontWeight: "bold", 
    marginLeft: 15, 
    marginBottom: 10, 
    alignSelf:'center'
   },
  card: { 
    margin:7,
    alignItems: "center",
     marginLeft:3 ,
     alignSelf:'center',
    borderRadius: 40 ,
    
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#007AFF",
    elevation:10,    
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    width: 80,
  },
  list:{
    backgroundColor:'transparent',
  }
});

