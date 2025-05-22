import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";

export default function AddPatient() {
  const [patientId, setPatientId] = useState("");
  const [aidantId, setAidantId] = useState("");

useEffect(() => {
  const fetchAidantId = async () => {
    const id = await AsyncStorage.getItem("aidantId");
    console.log("ID de l'aidant depuis AsyncStorage:", id); // Vérification du stockage
    setAidantId(id);
  };
  fetchAidantId();
}, []);

const handleAddPatient = async () => {
  if (!patientId) {
    Alert.alert("Erreur", "Veuillez entrer un ID de patient.");
    return;
  }

  console.log("Aidant ID envoyé:", aidantId); // Vérification avant l'envoi de la requête

  try {
    const response = await fetch("http://10.0.2.2:3000/api/aidants/addPatientForAidant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aidantId, patientId }),
    });

    const data = await response.json();
    console.log("Réponse du serveur:", data);  // Ajoutez cette ligne pour vérifier la réponse du serveur

    if (response.ok) {
      Alert.alert("Succès", "Patient ajouté avec succès !");
      router.replace("/Home/aidant/AccueilAidant"); // Redirige vers l'accueil
    } else {
      Alert.alert("Erreur", data.error || "Une erreur est survenue.");
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du patient", error);
    Alert.alert("Erreur", "Impossible d'ajouter le patient");
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter un patient</Text>
      <TextInput
        style={styles.input}
        placeholder="ID du Patient"
        value={patientId}
        onChangeText={setPatientId}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddPatient}>
        <Text style={styles.buttonText}>Ajouter</Text>
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
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "white",
    padding: 10,
    width: "80%",
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#5C9DFF",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
