import { View, Text } from 'react-native'
import React from 'react'
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/fetchNgrok';
import { useState } from 'react';



export default function Profile() {
const [aidant, setAidant] = useState(null);
const [patients, setPatients] = useState([]);
const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAidantAndPatients = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const aidantId = await AsyncStorage.getItem("aidantId");
        console.log("aidantId:", aidantId);
        if (!token || !aidantId) return;
        
        // Fetch aidant info
        const resAidant = await fetch(`${BASE_URL}/api/aidants/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resAidant.ok) {
          const data = await resAidant.json();
          console.log("aidant infos:",data.image_url);
          setAidant(data);
        }
        
        
        // Fetch patients
        const resPatients = await fetch(`${BASE_URL}/api/aidants/${aidantId}/getPatients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resPatients.ok) {
          const data = await resPatients.json();
          setPatients(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAidantAndPatients();
  }, []);

  return (
    <View style={styles.viewGroup}>
      <Text style={styles.textGroup}>localisation</Text>
      <Text style={styles.textprochain}>Prochainement...</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  viewGroup: {
    flex: 1, // Pour que le View prenne toute la hauteur
    justifyContent: 'center', // Centre verticalement
    alignItems: 'center', // Centre horizontalement
    backgroundColor: 'white', // Optionnel
  },
  textGroup: {
    fontSize: 30, // Taille du texte
    backgroundColor: 'white',
    padding: 10, // Un peu d'espace autour du texte
    color: 'black', // Couleur du texte pour le contraste
  },
  textprochain: {
    fontSize: 20, // Taille du texte
    backgroundColor: 'white',
    padding: 10, // Un peu d'espace autour du texte
    color: 'gray', // Couleur du texte pour le contraste
  },
});