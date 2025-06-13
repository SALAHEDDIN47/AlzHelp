import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const ProfilePatient = () => {
  const [patient, setPatient] = useState(null);
  const [rappelsCount, setRappelsCount] = useState(0);
  const router = useRouter();

useEffect(() => {
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token manquant');

      const resPatient = await fetch('http://10.0.2.2:3000/api/patients/thispatient', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resPatient.ok) throw new Error('Erreur patient');
      const patientData = await resPatient.json();
      setPatient(patientData);

      const resRappels = await fetch('http://10.0.2.2:3000/api/rappels/thisrappels', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resRappels.ok) throw new Error('Erreur rappels');
      const rappels = await resRappels.json();

     const ajouterUnJour = (dateStr) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1); // ajoute 1 jour en local
  return date;
}; 

const aujourdHui = new Date();

const rappelsAujourdHui = rappels.filter(r => {
  if (!r.date_rappel) return false;
  const rappelDate = ajouterUnJour(r.date_rappel);
    const match = (
    rappelDate.getFullYear() === aujourdHui.getFullYear() &&
    rappelDate.getMonth() === aujourdHui.getMonth() &&
    rappelDate.getDate() === aujourdHui.getDate()
  );
  console.log(`Rappel : ${r.date_rappel} (+1 jour) => Match (Local) ? ${match}`);
  return match;
});


      setRappelsCount(rappelsAujourdHui.length);
      console.log('Nb rappels aujourd’hui :', rappelsAujourdHui.length);
    } catch (err) {
      console.error('Erreur chargement profil :', err);
    }
  };

  fetchData();
}, []);


  if (!patient) {
    return <Text style={styles.loading}>Chargement...</Text>;
  }

  const formatDate = (isoString) => {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
  const calculateAge = (birthDateString) => {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};


  const personalInfos = [
    {
      key: 'nomcomplet',
      label: 'Nom Prenom',
      value: `${patient.prenom} ${patient.nom}`,
      icon: 'user',
    },
    {
      key: 'email',
      label: 'Email',
      value: patient.email,
      icon: 'envelope',
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      value: patient.telephone,
      icon: 'phone',
    },
    {
      key: 'adresse',
      label: 'Adresse',
      value: patient.adresse,
      icon: 'map-marker-alt',
    },
    {
      key: 'datenaissance',
      label: 'Date de naissance',
      value: formatDate(patient.datenaissance),
      icon: 'calendar',
    },
  ];

  return (
        <View style={{ flex: 1 }}>
      {/* Header avec titre et bouton retour */}
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Photo + nom + adresse + date de naissance */}
      <View style={styles.profileContainer}>
  <Image
    source={{ url: 'https://via.placeholder.com/100' }}
    style={styles.avatar}
  />
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Text style={styles.fullname}>{patient.prenom} {patient.nom}</Text>
  <TouchableOpacity
    onPress={() => {
      const age = calculateAge(patient.datenaissance);
      const message = `Bonjour ${patient.prenom} ${patient.nom}, vous avez ${age} ans, votre adresse est ${patient.adresse}, toutes les autres informations sont au dessous.`;
      Speech.speak(message, { language: 'fr-FR' });
    }}
    style={{ marginLeft: 10 }}
  >
    <Ionicons name="mic" size={24} color="#007bff" />
  </TouchableOpacity>
</View>


  <View style={styles.inlineSection}>
    <View style={styles.infoColumn}>
      <View style={styles.rowItem}>
        <FontAwesome5 name="map-marker-alt" size={20} color="#007bff" />
        <Text style={styles.inlineText}>{patient.adresse}</Text>
      </View>
    </View>

    <View style={styles.verticalDivider} />

    <View style={styles.infoColumn}>
      <View style={styles.rowItem}>
        <FontAwesome5 name="calendar" size={20} color="#007bff" />
        <Text style={styles.inlineText}>{formatDate(patient.datenaissance)}</Text>
      </View>
    </View>
  </View>
</View>


      {/* Bloc rappels */}
      <View style={styles.rappelContainer}>
        <Text style={styles.rappelText}>Vous avez :</Text>
        <Text style={styles.rappelNumber}>{rappelsCount}</Text>
        <Text style={styles.rappelLabel}>Rappels aujourd’hui</Text>
      </View>

      {/* Infos personnelles */}
      <FlatList
        data={personalInfos}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.infoCard}>
            <View style={styles.iconLabelRow}>
              <FontAwesome5 name={item.icon} size={33} color="#007bff" style={{ marginRight: 10 }} />
              <Text style={styles.labelText}>{item.label}</Text>
            </View>
            <Text style={styles.valueText}>{item.value}</Text>
          </View>
        )}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      />

      {/* Bouton Statistics */}
      <TouchableOpacity
        style={styles.statButton}
        onPress={() => router.push('/GestionRappels')}
      >
        <MaterialCommunityIcons name="chart-bar" size={28} color="#007bff" />
        <Text style={styles.statText}>pour aidant...</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

export default ProfilePatient;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loading: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 18,
  },
  header: {
    backgroundColor: '#007bff',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  backIcon: {
    position: 'absolute',
    top: 55,
    right: 20,
  },
  profileContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    marginBottom: 10,
  },
  fullname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  inlineInfo: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 8,
  },
  separator: {
    height: 30,
    width: 2,
    backgroundColor: '#90caf9',
    marginHorizontal: 10,
  },
  rappelContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
    alignItems: 'center',
  },
  rappelText: {
    fontSize: 18,
    marginBottom: 5,
  },
  rappelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007bff',
  },
  rappelLabel: {
    fontSize: 16,
    marginTop: 5,
    color: '#007bff',
  },
  infoCard: {
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 2,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 20,
    color: '#007bff',
    fontWeight: '600',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginTop: 6,
  },
  statButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    marginBottom: 50,
    padding: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#00aaff',
  },
  statText: {
    fontSize: 18,
    color: '#00aaff',
    fontWeight: '600',
    marginLeft: 10,
  },
  inlineSection: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 10,
  width: '100%',
  paddingHorizontal: 10,
},
infoColumn: {
  flex: 1,
  alignItems: 'center',
},
rowItem: {
  flexDirection: 'row',
  alignItems: 'center',
},
inlineText: {
  marginLeft: 8,
  fontSize: 14,
  color: '#333',
},
verticalDivider: {
  width: 1.5,
  height: 35,
  backgroundColor: '#90caf9',
}
});
