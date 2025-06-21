import React, { useEffect, useState, useRef } from 'react';
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
import { Svg, Circle, Line, Text as SvgText } from 'react-native-svg';
import RappelNotification from './components/RappelNotification';
import NotificationService from '../utils/notificationService';
import { Audio } from 'expo-av';

export default function Index() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState({});
  const [rappels, setRappels] = useState([]);
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [currentRappel, setCurrentRappel] = useState(null);
  const [lastCheckedRappels, setLastCheckedRappels] = useState([]);
  const soundRef = useRef(null); // Référence pour contrôler le son

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

function parseLocalDate(dateString) {
  if (!dateString) return null;
  // Prend uniquement la partie date si format ISO
  const onlyDate = dateString.split('T')[0];
  const [year, month, day] = onlyDate.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Ajoute un jour pour compenser le décalage
  date.setDate(date.getDate() + 1);
  return date;
}

const isToday = (dateString) => {
  const date = parseLocalDate(dateString);
  const now = new Date();
  return (
    date &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

function isValidHourFormat(str) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(str);
}

  // Fonction pour nettoyer les rappels vérifiés après 1 minute
  const cleanupCheckedRappels = () => {
    setLastCheckedRappels([]);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${BASE_URL}/api/patients/thispatient`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const patientData = await response.json();
        console.log("patientData", patientData);
        setUser({
          id: patientData.id_patient,
          nom: patientData.nom,
          prenom: patientData.prenom,
          image: patientData.profile_image ? `${BASE_URL}/${patientData.profile_image}` : null
        });

        await AsyncStorage.setItem('userFirstName', patientData.prenom);
        await AsyncStorage.setItem('userLastName', patientData.nom);
      } catch (e) {
        console.error('Erreur lors de la récupération du patient', e);
      }
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
          
          // Vérifier s'il y a de nouveaux rappels à l'heure actuelle
          checkForCurrentRappels(data);
        } catch (e) {
          console.error('Erreur de parsing JSON:', e);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des rappels:', err);
      }
    };

    fetchRappels();

    fetchUser();

    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Vérifier les rappels toutes les 10 secondes au lieu de 30
    const rappelCheckInterval = setInterval(() => {
      fetchRappels();
    }, 30000);

    // Nettoyer les rappels vérifiés toutes les minutes
    const cleanupInterval = setInterval(() => {
      cleanupCheckedRappels();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(rappelCheckInterval);
      clearInterval(cleanupInterval);
      
      // Nettoyer le son si il y en a un
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const speak = (text) => {
    Speech.speak(text, { language: 'fr-FR' });
  };

  // Fonction pour jouer un son de notification en boucle
  const playNotificationSound = async () => {
    try {
      console.log('🔊 Lecture du son de notification en boucle...');
      
      // Arrêter le son précédent s'il y en a un
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Créer un nouveau son qui se répète
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        { 
          shouldPlay: true, 
          volume: 1,
          isLooping: true // Répéter en boucle
        }
      );
      
      soundRef.current = sound;
      await sound.playAsync();
      
      console.log('🔊 Son de notification en cours de lecture (boucle)...');
    } catch (error) {
      console.log('⚠️ Impossible de jouer le son de notification:', error);
      // Si pas de son en ligne, on continue sans son
    }
  };

  // Fonction pour arrêter le son de notification
  const stopNotificationSound = async () => {
    try {
      if (soundRef.current) {
        console.log('🔇 Arrêt du son de notification...');
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de l\'arrêt du son:', error);
    }
  };

  const speakCurrentDate = () => {
    const day = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const time = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    speak(`Aujourd'hui nous sommes ${day}, maintenant il est ${time}`);
  };

  const speakCurrentTime = () => {
    const time = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    speak(`Il est ${time}`);
  };

const now = new Date();

const rappelsToday = rappels.filter(r => {
  // On ne garde que ceux du jour et qui ont une heure valide
  return isToday(r.date_rappel) && isValidHourFormat(r.heure_rappel);
});

const sortedRappelsToday = rappelsToday
  .map(rappel => {
    const [h, m, s] = rappel.heure_rappel.split(':');
    const rappelDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s);
    return { ...rappel, rappelDate };
  })
  .filter(rappel => rappel.rappelDate > now)
  .sort((a, b) => a.rappelDate - b.rappelDate);

const nextRappelToday = sortedRappelsToday[0];

// Filtrer les rappels de médicaments
const medicamentRappels = sortedRappelsToday.filter(rappel => 
  rappel.type_rappel && rappel.type_rappel.toLowerCase().includes('medicament')
);
const nextMedicamentRappel = medicamentRappels[0];

const timeUntil = (rappel) => {
  if (!rappel || !rappel.heure_rappel || !isValidHourFormat(rappel.heure_rappel)) return 0;
  const now = new Date();
  const [h, m, s] = rappel.heure_rappel.split(':');
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s);
  if (target < now) target.setDate(target.getDate() + 1); // Si déjà passé, prend le lendemain
  const diff = (target - now) / 60000; // en minutes
  return Math.max(0, diff);
};

const formatDate = (dateString) => {
  const date = parseLocalDate(dateString);
  return date ? date.toLocaleDateString('fr-FR') : '';
};

// Nouvelle fonction pour formater le temps restant de façon naturelle
function formatTimeRemaining(minutes) {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `Il reste ${seconds} seconde${seconds > 1 ? 's' : ''}.`;
  } else if (minutes < 60) {
    const min = Math.round(minutes);
    return `Il reste ${min} minute${min > 1 ? 's' : ''}.`;
  } else if (minutes < 1440) { // moins d'un jour
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (m === 0) {
      return `Il reste ${h} heure${h > 1 ? 's' : ''}.`;
    }
    return `Il reste ${h} heure${h > 1 ? 's' : ''} et ${m} minute${m > 1 ? 's' : ''}.`;
  } else {
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    const m = Math.round(minutes % 60);
    let result = `Il reste ${d} jour${d > 1 ? 's' : ''}`;
    if (h > 0) result += `, ${h} heure${h > 1 ? 's' : ''}`;
    if (m > 0) result += ` et ${m} minute${m > 1 ? 's' : ''}`;
    result += '.';
    return result;
  }
}

const renderRappelBox = (rappel, color, labelColor, barColor, label) => {
  if (!rappel) return null;
  const minutes = timeUntil(rappel);
  const MAX_MINUTES = 1440; // 24h
  const progress = Math.max(0, Math.min(1, (MAX_MINUTES - minutes) / MAX_MINUTES)) * 100;
  const timeSpeech = formatTimeRemaining(minutes);

  return (
    <TouchableOpacity
      style={[styles.rappelBox, { backgroundColor: color }]}
      onPress={() => {
        speak(`${label} ${rappel.description}. ${timeSpeech}`);
      }}
    >
      <Text style={{ color: labelColor, fontWeight: '600', fontSize: 16 }}>{label}</Text>
      <Text style={{ marginVertical: 4, fontSize: 20 }}>{rappel.description}</Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: barColor }]} />
      </View>
    </TouchableOpacity>
  );
};

function AnalogClock({ date, size = 90 }) {
  const hour = date.getHours() % 12;
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const center = size / 2;
  const radius = size / 2 - 4;
  // Calcul des angles
  const hourAngle = ((hour + minute / 60) * 30 - 90) * Math.PI / 180;
  const minuteAngle = ((minute + second / 60) * 6 - 90) * Math.PI / 180;
  const secondAngle = (second * 6 - 90) * Math.PI / 180;
  // Coordonnées des aiguilles
  const hourX = center + Math.cos(hourAngle) * (radius * 0.5);
  const hourY = center + Math.sin(hourAngle) * (radius * 0.5);
  const minuteX = center + Math.cos(minuteAngle) * (radius * 0.8);
  const minuteY = center + Math.sin(minuteAngle) * (radius * 0.8);
  const secondX = center + Math.cos(secondAngle) * (radius * 0.9);
  const secondY = center + Math.sin(secondAngle) * (radius * 0.9);
  // Affichage des numéros d'heures
  const numbers = [];
  for (let i = 1; i <= 12; i++) {
    const angle = ((i * 30) - 90) * Math.PI / 180;
    const numX = center + Math.cos(angle) * (radius * 0.75);
    const numY = center + Math.sin(angle) * (radius * 0.75) + 4;
    numbers.push(
      <SvgText
        key={i}
        x={numX}
        y={numY}
        fontSize={size * 0.13}
        fill="#444"
        textAnchor="middle"
        alignmentBaseline="middle"
        fontWeight="bold"
      >
        {i}
      </SvgText>
    );
  }
  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} stroke="#007AFF" strokeWidth={4} fill="#fff" />
      {numbers}
      <Line x1={center} y1={center} x2={hourX} y2={hourY} stroke="#333" strokeWidth={5} strokeLinecap="round" />
      <Line x1={center} y1={center} x2={minuteX} y2={minuteY} stroke="#007AFF" strokeWidth={4} strokeLinecap="round" />
      <Circle cx={center} cy={center} r={4} fill="#007AFF" />
    </Svg>
  );
}

  // Fonction pour vérifier s'il y a des rappels à l'heure actuelle
  const checkForCurrentRappels = (rappelsData) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    // Utiliser l'heure locale avec les secondes
    const currentTime = now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Format 24h
    });

    console.log(`🔍 Vérification des rappels - Date: ${currentDate}, Heure locale: ${currentTime}`);
    console.log(`📊 Nombre total de rappels à vérifier: ${rappelsData.length}`);

    // Afficher tous les rappels pour debug
    rappelsData.forEach((rappel, index) => {
      console.log(`📋 Rappel ${index + 1}: ID=${rappel.id_rappel}, Date=${rappel.date_rappel}, Heure=${rappel.heure_rappel}, Type=${rappel.type_rappel}, Description=${rappel.description}, Confirmé=${rappel.confirmer_rappel}`);
    });

    const currentRappels = rappelsData.filter(rappel => {
      // Normaliser la date du rappel
      let rappelDate;
      if (rappel.date_rappel) {
        // Si c'est une date ISO, la convertir en format YYYY-MM-DD
        if (rappel.date_rappel.includes('T')) {
          rappelDate = rappel.date_rappel.split('T')[0];
        } else {
          rappelDate = rappel.date_rappel;
        }
        
        // Ajouter un jour pour compenser le décalage de fuseau horaire
        const dateObj = new Date(rappelDate);
        dateObj.setDate(dateObj.getDate() + 1);
        rappelDate = dateObj.toISOString().split('T')[0];
      } else {
        rappelDate = '';
      }
      
      const isSameDate = rappelDate === currentDate;
      
      // Normaliser l'heure du rappel pour ne garder que les heures et minutes
      const rappelTime = rappel.heure_rappel ? rappel.heure_rappel.split(':').slice(0, 2).join(':') : '';
      // Normaliser l'heure actuelle pour ne garder que les heures et minutes
      const currentTimeNormalized = currentTime.split(':').slice(0, 2).join(':');
      const isSameTime = rappelTime === currentTimeNormalized;
      
      const isNotConfirmed = !rappel.confirmer_rappel;
      const isNotAlreadyChecked = !lastCheckedRappels.includes(rappel.id_rappel);
      
      console.log(`🔍 Analyse rappel ${rappel.id_rappel}:`);
      console.log(`   - Date originale: ${rappel.date_rappel}`);
      console.log(`   - Date normalisée: ${rappelDate} (ajout d'un jour)`);
      console.log(`   - Date actuelle: ${currentDate}`);
      console.log(`   - Dates égales: ${rappelDate} === ${currentDate} = ${isSameDate}`);
      console.log(`   - Heure rappel: ${rappel.heure_rappel} → normalisée: ${rappelTime}`);
      console.log(`   - Heure actuelle: ${currentTime} → normalisée: ${currentTimeNormalized}`);
      console.log(`   - Heures égales: ${rappelTime} === ${currentTimeNormalized} = ${isSameTime}`);
      console.log(`   - Non confirmé: ${!rappel.confirmer_rappel} = ${isNotConfirmed}`);
      console.log(`   - Non vérifié: ${!lastCheckedRappels.includes(rappel.id_rappel)} = ${isNotAlreadyChecked}`);
      
      return isSameDate && isSameTime && isNotConfirmed && isNotAlreadyChecked;
    });

    console.log(`🎯 Rappels correspondants trouvés: ${currentRappels.length}`);

    if (currentRappels.length > 0) {
      console.log('🔔 RAPPEL TROUVÉ ! Affichage de la notification...');
      console.log('📝 Détails du rappel:', currentRappels[0]);
      
      // Afficher la notification pour le premier rappel trouvé
      setCurrentRappel(currentRappels[0]);
      setShowNotification(true);
      
      console.log('✅ État de la notification mis à jour:');
      console.log('   - currentRappel:', currentRappels[0]);
      console.log('   - showNotification: true');
      
      // Marquer ce rappel comme vérifié pour éviter les doublons
      setLastCheckedRappels(prev => {
        const newList = [...prev, currentRappels[0].id_rappel];
        console.log(`📝 Liste des rappels vérifiés mise à jour:`, newList);
        return newList;
      });
      
      // Envoyer une notification locale
      console.log('📱 Envoi de notification locale...');
      NotificationService.scheduleLocalNotification(
        'Rappel Médical',
        `Il est l'heure de votre ${currentRappels[0].type_rappel}: ${currentRappels[0].description}`,
        {
          rappel: currentRappels[0],
          statut: 'nouveau'
        }
      );

      // Parler le rappel avec un délai pour laisser le temps à la notification de s'afficher
      const message = `Rappel médical : ${currentRappels[0].description}. Il est l'heure de votre ${currentRappels[0].type_rappel}.`;
      console.log('🗣️ Synthèse vocale programmée:', message);
      
      // Délai de 2 secondes avant la synthèse vocale pour laisser le temps à la notification de s'afficher
      setTimeout(() => {
        console.log('🔊 Lancement de la synthèse vocale et du son...');
        // Jouer le son de notification
        playNotificationSound();
        // Parler le message
        speak(message);
      }, 2000);
      
    } else {
      console.log('📭 Aucun nouveau rappel trouvé pour cette heure');
      console.log(`📝 Rappels vérifiés actuellement:`, lastCheckedRappels);
    }
  };

  const handleConfirmRappel = async (rappelId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/rappels/${rappelId}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Rappel confirmé avec succès');
        setShowNotification(false);
        setCurrentRappel(null);
        
        // Arrêter le son de notification
        await stopNotificationSound();
        
        // Recharger les rappels
        const res = await fetch(`${BASE_URL}/api/rappels/thisrappels`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setRappels(data);
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation du rappel:', error);
    }
  };

  const handleDismissNotification = async () => {
    setShowNotification(false);
    setCurrentRappel(null);
    
    // Arrêter le son de notification
    await stopNotificationSound();
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

        <TouchableOpacity onPress={speakCurrentTime} style={{ alignItems: 'center' }}>
          <AnalogClock date={currentTime} size={90} />
          <Text style={{ fontSize: 28, color: '#007AFF', fontWeight: 'bold', marginTop: 6 }}>
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

      {nextRappelToday && renderRappelBox(nextRappelToday, '#FFE9E1', 'gray', '#FF7D53', 'Prochain rappel :')}

      {sortedRappelsToday.filter(r => r.type_rappel && r.type_rappel.toLowerCase().includes('médicament'))[0] && 
        renderRappelBox(
          sortedRappelsToday.filter(r => r.type_rappel && r.type_rappel.toLowerCase().includes('médicament'))[0],
          '#E1F5FE',
          'gray',
          '#0288D1',
          'Prochain médicament :'
        )
      }

      {!nextRappelToday && !sortedRappelsToday.filter(r => r.type_rappel && r.type_rappel.toLowerCase().includes('medicament'))[0] && (
        <Text style={{textAlign: 'center', color: 'gray', margin: 20}}>
          Aucun rappel à venir aujourd'hui.
        </Text>
      )}

      <View style={styles.gridRow}>
        {[
          { icon: 'person', label: 'Profile', path: './profile', msg: `Bienvenue ${user.prenom}   ${user.nom} dans votre profil.` },
          { icon: 'medical-services', label: 'Suivi', path: './suivi/MedicalTracking', msg: `Bienvenue ${user.prenom}   ${user.nom} dans votre suivi médical.` },
          { icon: 'pending-actions', label: 'Rappels', path: './Home/patient/tabs/filters', msg: `Bienvenue ${user.prenom}   ${user.nom}, ce sont vos rappels.` },
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

      {/* Composant de notification de rappel */}
      <RappelNotification
        visible={showNotification}
        rappel={currentRappel}
        onConfirm={handleConfirmRappel}
        onDismiss={handleDismissNotification}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0, backgroundColor: 'white',  paddingTop:-50,},
  cadre: {
    backgroundColor: '#F3F4F6', // gris très clair
    borderRadius: 30,
    margin: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 15,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',},
  dayText: { fontSize: 36, fontWeight: 'bold' },
  dateText: { fontSize: 22, color: '#444' },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 25, marginBottom:0, right:10},
  profileImage: { width: 70, height: 70, borderRadius: 45, marginRight: 15, borderWidth: 2, borderColor: '#007AFF' },
  bonjourText: { fontSize: 21 },
  usernameText: { fontSize: 24, fontWeight: 'bold' },
  rappelBox: {
    padding: 15, marginVertical: 5,
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
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});