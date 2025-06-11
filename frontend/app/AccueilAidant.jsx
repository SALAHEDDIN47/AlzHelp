import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccueilAidant() {
  const [aidantData, setAidantData] = useState(null);

  useEffect(() => {
    // Récupérer les informations de l'aidant depuis AsyncStorage
    const fetchAidantData = async () => {
      const data = await AsyncStorage.getItem("aidantData");
      setAidantData(JSON.parse(data));
    };
    fetchAidantData();
  }, []);

  const handleProfile = () => {
    router.push("/profileAidant");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue {aidantData?.prenom} sur AlzHelp</Text>
      <TouchableOpacity style={styles.button} onPress={handleProfile}>
        <Text style={styles.buttonText}>Mon Profil</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Gérer les Patients</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#5C9DFF",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 20,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 20,
    borderRadius: 25,
  },
  buttonText: {
    color: "#5C9DFF",
    fontSize: 16,
    textAlign: "center",
  },
});
