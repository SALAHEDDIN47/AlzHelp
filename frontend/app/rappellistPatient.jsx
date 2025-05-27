import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  StatusBar,

} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, fetchWithToken } from '../utils/fetchNgrok';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons,FontAwesome } from '@expo/vector-icons';
import { useRouter } from "expo-router";

import * as Speech from 'expo-speech';

export default function Index() {
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinnedRappels, setPinnedRappels] = useState([]);
  const [confirmedRappels, setConfirmedRappels] = useState([]);
  const router = useRouter();
  const isFocused = useIsFocused();


  useEffect(() => {
    const fetchRappels = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert("Erreur", "Token manquant");
          return;
        }
        const data = await fetchWithToken('/api/rappels/thisrappels', token);
        setRappels(data);
        console.log("Rappels recupérés:", data);
        // 💡 C’est ici qu’on initialise les rappels épinglés :
      setPinnedRappels(data.filter(r => r.ispinned).map(r => r.id_rappel));
      setConfirmedRappels(data.filter(r => !(r.confirmer_rappel)).map(r => r.id_rappel));
      console.log(" pinned Rappels recupérés:", pinnedRappels);
      console.log("confirmed Rappels recupérés:", confirmedRappels);
      } catch (error) {
        console.error("Erreur fetch rappels:", error);
        Alert.alert("Erreur", "Impossible de charger les rappels");
      } finally {
        setLoading(false);
      }
    };
     if (isFocused) {
    fetchRappels();
     }
  }, [isFocused]);


  // Fonction pour basculer l'état épinglé
const togglePin = async (id_rappel) => {
  try {
    const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert("Erreur", "Token manquant");
          return;
        }
    const response = await fetchWithToken(`/api/rappels/${id_rappel}/pin`, token, {
      method: "PUT",
        headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
       }
    });

    

    if (response && typeof response.ispinned === 'boolean') {
      setPinnedRappels((prev) =>
        response.ispinned 
      ? [...prev, id_rappel] 
      : prev.filter((rId) => rId !== id_rappel)
      );

      // 💡 Mise à jour de la liste principale des rappels
      setRappels((prevRappels) =>
        prevRappels.map((rappel) =>
          rappel.id_rappel === id_rappel
            ? { ...rappel, ispinned: response.ispinned }
            : rappel
        )
      );


    } else {
      console.warn("Erreur dans la réponse serveur");
    }
  } catch (error) {
    console.error("Erreur réseau :", error);
  }
};

  // Fonction pour basculer l'état confirmé
const toggleConfirm = async (id_rappel) => {
  try {
    const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert("Erreur", "Token manquant");
          return;
        }
    const response = await fetchWithToken(`/api/rappels/${id_rappel}/confirm`, token, {
      method: "PUT",
        headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
    });

    

    if (response && typeof response.est_confirmer === 'boolean') {
      setConfirmedRappels((prev) =>
        response.est_confirmer 
      ? [...prev, id_rappel] 
      : prev.filter((rId) => rId !== id_rappel)
      );

      // 💡 Mise à jour de la liste principale des rappels
      setRappels((prevRappels) =>
        prevRappels.map((rappel) =>
          rappel.id_rappel === id_rappel
            ? { ...rappel, est_confirmer: response.est_confirmer }
            : rappel
        )
      );


    } else {
      console.warn("Erreur dans la réponse serveur");
    }
  } catch (error) {
    console.error("Erreur réseau :", error);
  }
};

  const speak = (text) => {
    Speech.speak(text, {
      language: 'fr-FR',
      pitch: 1,
      rate: 1,
    });
  };

 

  const speakRappel = (item) => {
    const texte = `Rappel : ${item.description}. Prévu à ${item.heure_rappel}, le ${new Date(item.date_rappel).toLocaleDateString("fr-FR")}`;
    speak(texte);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />


      <Text style={styles.title}>Rappels</Text>



      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.push('./Home/patient/tabs/confirmed')}>
          <FontAwesome name="check-circle" size={25} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('./Home/patient/tabs/pinned')}>
          <FontAwesome name="thumb-tack" size={25} color="#007bff" />
        </TouchableOpacity>
        <Ionicons  name="clipboard-outline" size={30} />
        <TouchableOpacity onPress={() => router.push('./Home/patient/tabs/history')}>
          <FontAwesome name="history" size={25} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('./Home/patient/tabs/filters')}>
          <FontAwesome name="filter" size={25} color="#007bff" />
        </TouchableOpacity>
      </View>




      <FlatList
        style={styles.listrappels}
        data={rappels}
        keyExtractor={(item) => item.id_rappel.toString()}
        renderItem={({ item }) => {

          const ispinned = pinnedRappels.includes(item.id_rappel);
          const est_confirmer = item.est_confirmer;
         
         return( 

          <TouchableOpacity onPress={() => speakRappel(item)}>
            <View style={styles.rappel}>

              {/* 📌 Bouton épingle */}
          <TouchableOpacity
            style={styles.pinButton}
            onPress={() => togglePin(item.id_rappel)}
          >
            <Ionicons
              name={ispinned ? "pin" : "pin-outline"}
              size={ispinned ? 40 : 30}
              color={ispinned ? "#007AFF" : "#888"}
            />
          </TouchableOpacity>


            <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => toggleConfirm(item.id_rappel)}
          >
            <Ionicons
              name={est_confirmer ? "checkmark-circle-outline" : "close-circle-outline"}
              size={est_confirmer ? 40 : 30}
              color={est_confirmer ? "#007AFF" : "#888"}
            />
          </TouchableOpacity>

              <Text style={styles.texte}>📌 {item.description}</Text>
              <Text style={styles.texte}>🕒 {item.heure_rappel}</Text>
              <Text style={styles.texte}>📅 {new Date(item.date_rappel).toLocaleDateString("fr-FR")}</Text>
            </View>
          </TouchableOpacity>
         );
        }
         }
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 120 }}
         extraData={pinnedRappels}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -30,
    flex: 1,
    padding: 0,
    backgroundColor: 'white',
    zIndex: 10,
  },
  homepicture: {
    display: 'flex',
    position: 'absolute',
    borderRadius: 40,
    height: 200,
    width: 250,
    opacity: 1,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 10,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    backgroundColor: '#9FDFE9',
    borderWidth: 2,
    borderColor: '#9FDFE9',
    marginTop: -50,
    elevation: 5,
  },
  dateText: {
    marginTop: 35,
    marginBottom: 40,
    marginLeft: 7,
    marginRight: 7,
    fontSize: 30,
    fontWeight: 'bold',
    color: '#222',
    alignSelf: 'center',
    backgroundColor: '#F1F8F8',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#007AFF",
    padding: 20,
    opacity: 0.7,
  },
  timeText: {
    borderRadius: 50,
    backgroundColor: '#F1F8F8',
    borderWidth: 2,
    fontSize: 25,
    color: '#555',
    borderColor: "#007AFF",
    elevation: 10,
    marginLeft: 100,
    marginRight: 100,
    marginTop: 0,
    marginBottom: 20,
    paddingLeft: 25,
    opacity: 0.8,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginVertical: 0,
    textAlign: 'center',
    color: 'black',
    backgroundColor: 'transparent',
    borderRadius: 20,
    margin: 90,
  },
  rappel: {
    padding: 20,
    marginVertical: 5,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    margin: 25,
    elevation: 10,
  },
  texte: {
    fontSize: 20,
    color: 'black',
  },
  currenttime: {
    marginLeft: 50,
    marginRight: 50,
    marginBottom: 30,
    marginTop: 50,
    borderRadius: 40,
    borderColor: "#007AFF",
    borderWidth: 2,
    backgroundColor: 'white',
    elevation: 10,
  },
  listrappels: {
    marginTop: 20,
    marginBottom: 50,
  },
  logoutIcon: {
    position: 'absolute',
    top: -10,
    right: 15,
    zIndex: 10,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    marginTop:10,
    paddingBottom:0,
  },
  pinButton: {
  position: 'absolute',
  top: 10,
  right:10,
  zIndex: 10,
},
});