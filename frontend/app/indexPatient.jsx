import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import ListeAidantsHorizontale from './components/ListeAidantsHorizontale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithToken, BASE_URL } from '../utils/fetchNgrok';

export default function Index() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState({});
  const [rappels, setRappels] = useState([]);
  const router = useRouter();
const capitalizeWord = (word) => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

const capitalizeFullName = (fullName) => {
  if (!fullName) return '';

  return fullName
    .split(/[\s-]/) // sépare par espace ou tiret
    .map(capitalizeWord)
    .join((match => match.includes('-') ? '-' : ' ')(fullName));
};



  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const userFirstName = await AsyncStorage.getItem('userFirstName');
      const userLastName = await AsyncStorage.getItem('userLastName');


      console.log(userLastName);
      setUser({ id: userId, nom: userLastName, prenom:userFirstName});

    };
        const fetchRappels = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/api/rappels/thisrappels`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setRappels(data);
        } catch (e) {
          console.error('Erreur de parsing JSON:', e);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des rappels:', err);
      }
    };

    fetchRappels();

    fetchUser();

    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const speak = (text) => {
    Speech.speak(text, { language: 'fr-FR' });
  };

  const speakCurrentDate = () => {
    const day = currentTime.toLocaleDateString('fr-FR', { weekday: 'long' });
    speak(`Aujourd'hui, nous sommes ${day}`);
  };

  const speakCurrentTime = () => {
    const time = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    speak(`Il est ${time}`);
  };

const rappelDans24h = rappels.filter(r => {
  const [h, m] = r.heure_rappel.split(':');
  const dateRappel = new Date();
  dateRappel.setHours(h, m, 0, 0);
  if (dateRappel < new Date()) dateRappel.setDate(dateRappel.getDate() + 1);
  return (dateRappel - new Date()) <= 24 * 60 * 60 * 1000; // 24h en ms
});

const sortedRappels = rappelDans24h.sort((a, b) => {
  const [ha, ma] = a.heure_rappel.split(':');
  const [hb, mb] = b.heure_rappel.split(':');
  const da = new Date(), db = new Date();
  da.setHours(ha, ma, 0, 0);
  db.setHours(hb, mb, 0, 0);
  if (da < new Date()) da.setDate(da.getDate() + 1);
  if (db < new Date()) db.setDate(db.getDate() + 1);
  return da - db;
});

const nextRappel = sortedRappels.find(r => r.type_rappel !== 'Médicament');
const nextMedicament = sortedRappels.find(r => r.type_rappel === 'Médicament');


const timeUntil = (rappel) => {
  if (!rappel || !rappel.heure_rappel) return 0;
  const now = new Date();
  const target = new Date();
  const [h, m] = rappel.heure_rappel.split(':');
  target.setHours(h, m, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  const diff = (target - now) / 60000; // en minutes
  return Math.max(0, diff);
};



const renderRappelBox = (rappel, color, labelColor, barColor) => {
  if (!rappel) return null;
  const minutes = timeUntil(rappel);
  const MAX_MINUTES = 1440; // 24h
  const progress = Math.max(0, Math.min(1, (MAX_MINUTES - minutes) / MAX_MINUTES)) * 100;

  return (
    <TouchableOpacity
      style={[styles.rappelBox, { backgroundColor: color }]}
      onPress={() => {
        speak(`Rappel : ${rappel.description}. Il reste ${Math.round(minutes)} minutes.`);
      }}
    >
      <Text style={{ color: labelColor, fontWeight: '600',fontSize:16, }}>Prochain rappel :</Text>
      <Text style={{ marginVertical: 4,fontSize:20, }}>{rappel.description}</Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: barColor }]} />
      </View>
    </TouchableOpacity>
  );
};



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
    <View style={styles.cadre}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={speakCurrentDate}>
          <Text style={styles.dayText}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long' })}
          </Text>
          <Text style={styles.dateText}>
            {currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={speakCurrentTime}>
          <Text style={styles.timeText}>
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileRow}>
        <TouchableOpacity  onPress={() => {
              speak( `Bienvenue ${user.prenom}   ${user.nom} dans votre profil.`);
              router.push("./profile");
            }}>
          <Image source={{ uri: user.image }} style={styles.profileImage} />
        </TouchableOpacity>
        <View>
          <Text style={styles.bonjourText}>Bonjour,</Text>
<Text style={styles.usernameText}>
  {capitalizeFullName(user.prenom)} {capitalizeFullName(user.nom)}
</Text>

        </View>
      </View>
    </View>

      <ListeAidantsHorizontale/>

      {renderRappelBox(nextRappel, '#FFE9E1', 'gray', '#FF7D53')}
      {renderRappelBox(nextMedicament, '#E1EFFF', 'gray', '#53B7FF')}

      <View style={styles.gridRow}>
        {[
          { icon: 'person', label: 'Profile', path: './profile', msg: `Bienvenue ${user.prenom}   ${user.nom} dans votre profil.` },
          { icon: 'medical-services', label: 'Suivi', path: './suivimedical', msg: `Bienvenue ${user.prenom}   ${user.nom} dans votre suivi médical.` },
          { icon: 'pending-actions', label: 'Rappels', path: './rappellistPatient', msg: `Bienvenue ${user.prenom}   ${user.nom}, ce sont vos rappels.` },
          { icon: 'location-on', label: 'Localisation', path: './localisation', msg: `Bienvenue ${user.prenom}   ${user.nom} dans votre espace localisation.` },
        ].map(({ icon, label, path, msg }) => (
          <TouchableOpacity
            key={label}
            style={styles.gridButton}
            onPress={() => {
              speak(msg);
              router.push(path);
            }}
          >
            <MaterialIcons name={icon} size={30} color="white" />
            <Text style={styles.gridLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0, backgroundColor: 'white',  paddingTop:-50,},
  cadre:{backgroundColor: '#EBEBEB', margin:0, padding:40,marginBottom:20},
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',},
  dayText: { fontSize: 40, fontWeight: 'bold' },
  dateText: { fontSize: 25, color: '#444' },
  timeText: { fontSize: 35, color: '#444', fontWeight: '600' },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 ,marginBottom:0, right:10},
  profileImage: { width: 80, height: 80, borderRadius: 50, marginRight: 15, borderWidth: 2, borderColor: '#007AFF' },
  bonjourText: { fontSize: 23 },
  usernameText: { fontSize: 27, fontWeight: 'bold' },
  rappelBox: {
    padding: 20, marginVertical: 10,
    borderRadius: 20,
    marginHorizontal: 15,
  },
  progressContainer: {
    height: 8, backgroundColor: 'white', borderRadius: 5, marginTop: 8, overflow: 'hidden', elevation:2,
  },
  progressBar: {
    height: 8,
  },
  gridRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-around', marginTop: 0,
  },
  gridButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: '45%',
    height: 90,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLabel: {
    color: 'white',
    fontWeight: '600',
    marginTop: 5,
  },
});