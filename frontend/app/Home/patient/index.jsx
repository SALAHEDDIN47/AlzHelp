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
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ListeAidantsHorizontale from "./../../components/ListeAidantsHorizontale";
import { fetchWithToken } from '../../../utils/fetchNgrok';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import ConfirmLogout from '../../components/ConfirmLogout';

const Homepicture = require("../../../assets/images/logo.jpg");

export default function Index() {
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoutVisible, setLogoutVisible] = useState(false);

  const router = useRouter();

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
      } catch (error) {
        console.error("Erreur fetch rappels:", error);
        Alert.alert("Erreur", "Impossible de charger les rappels");
      } finally {
        setLoading(false);
      }
    };

    fetchRappels();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (date) => date.toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const formatTime = (date) => date.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit"
  });

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
          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </View>
        <ListeAidantsHorizontale />
      </View>

      <Text style={styles.title}>Rappels</Text>

      <FlatList
        style={styles.listrappels}
        data={rappels}
        keyExtractor={(item) => item.id_rappel.toString()}
        renderItem={({ item }) => (
          <View style={styles.rappel}>
            <Text style={styles.texte}>📌 {item.description}</Text>
            <Text style={styles.texte}>🕒 {item.heure_rappel}</Text>
            <Text style={styles.texte}>📅 {new Date(item.date_rappel).toLocaleDateString("fr-FR")}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <ConfirmLogout visible={logoutVisible} onClose={() => setLogoutVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop:-30,
    flex: 1,
    padding: 0,
    backgroundColor: 'white',
    zIndex:10,
  },
  homepicture: {
    display:'flex',
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
    marginTop:35,
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
    padding:20,
    opacity:0.7,
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
    opacity:0.8,
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
});


