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
import ListeAidantsHorizontale from "./components/ListeAidantsHorizontale";
import { BASE_URL, fetchWithToken } from '../utils/fetchNgrok';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons,FontAwesome } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import ConfirmLogout from './components/ConfirmLogout';
import * as Speech from 'expo-speech';



const Homepicture = require("../assets/images/logo.jpg");

export default function Index() {
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoutVisible, setLogoutVisible] = useState(false);
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
      setConfirmedRappels(data.filter(r => r.est_confirmer).map(r => r.id_rappel));
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
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
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

  // Fonction pour basculer l'état épinglé
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


  const formatDate = (date) =>
    date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const formatTime = (date) =>
    date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });

  const speak = (text) => {
    Speech.speak(text, {
      language: 'fr-FR',
      pitch: 1,
      rate: 1,
    });
  };

  const speakCurrentDate = () => {
    speak(`Nous sommes le ${formatDate(currentTime)}`);
  };

  const speakCurrentTime = () => {
    speak(`Il est ${formatTime(currentTime)}`);
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

      <TouchableOpacity
        onPress={() => setLogoutVisible(true)}
        style={{ position: 'relative', zIndex: 10 }}
      >
        <Ionicons name="log-out-outline" size={30} color="black" style={styles.logoutIcon} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.currenttime}>
          <Image source={Homepicture} style={styles.homepicture} />

          <TouchableOpacity onPress={speakCurrentDate}>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={speakCurrentTime}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          </TouchableOpacity>
        </View>

        <ListeAidantsHorizontale />
      </View>

      <Text style={styles.title}>Rappels</Text>



      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.push('./patient/tabs/confirmed')}>
          <FontAwesome name="check-circle" size={25} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('./patient/tabs/pinned')}>
          <FontAwesome name="thumb-tack" size={25} color="#007bff" />
        </TouchableOpacity>
        <Ionicons  name="clipboard-outline" size={30} />
        <TouchableOpacity onPress={() => router.push('./patient/tabs/history')}>
          <FontAwesome name="history" size={25} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('./patient/tabs/filters')}>
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

      <ConfirmLogout visible={logoutVisible} onClose={() => setLogoutVisible(false)} />
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
