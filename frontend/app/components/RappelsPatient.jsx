import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, fetchWithToken } from '../../utils/fetchNgrok'; // ← AJOUT

const RappelsPatient = () => {
  const [rappels, setRappels] = useState([]);

  useEffect(() => {
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
  }, []);

  return (
    <ScrollView contentContainerStyle={{ 
      padding: 16,
     }}>
      <Text style={{ fontSize: 20,
         fontWeight: 'bold',
          marginBottom: 10 }}>
        Rappels
      </Text>
      {rappels.length === 0 ? (
        <Text>Aucun rappel trouvé.</Text>
      ) : (
        rappels.map((rappel) => (
          <View
            key={rappel.id_rappel}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              marginBottom: 10,
              backgroundColor: '#f9f9f9',
            }}
          >
            <Text>Description: {rappel.description}</Text>
            <Text>Type: {rappel.type_rappel}</Text>
            <Text>Date: {rappel.date_rappel}</Text>
            <Text>Heure: {rappel.heure_rappel}</Text>
            <Text>Confirmé: {rappel.confirmer_rappel ? 'Oui' : 'Non'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default RappelsPatient;
