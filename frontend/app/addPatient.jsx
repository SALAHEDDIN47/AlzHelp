import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";

export default function AddPatient() {
  const [patientId, setPatientId] = useState("");
  const [id_aidant, setAidantId] = useState("");
  const [lienFamilial, setLienFamilial] = useState(""); // Nouveau champ pour le lien familial

  useEffect(() => {
    const fetchAidantId = async () => {
      const id_aidant = await AsyncStorage.getItem("userId");
      console.log("ID de l'aidant depuis AsyncStorage addPatient:", id_aidant); // Vérification du stockage
      setAidantId(id_aidant);
    };
    fetchAidantId();
  }, []);

  const handleAddPatient = async () => {
    if (!patientId || !lienFamilial) {
      Alert.alert("Erreur", "Veuillez entrer un ID de patient et le lien familial.");
      return;
    }

    console.log("Aidant ID envoyé:", id_aidant); // Vérification avant l'envoi de la requête

    try {
      const response = await fetch("http://10.0.2.2:3000/api/aidants/addPatientForAidant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aidantId: id_aidant, patientId, lienFamilial }),
      });

      const data = await response.json();
      console.log("Réponse du serveur:", data);  // Ajoutez cette ligne pour vérifier la réponse du serveur

      if (response.ok) {
        Alert.alert("Succès", "Patient ajouté avec succès !");
        router.replace("/AccueilAidant"); // Rediriger vers l'accueil
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
      <TextInput
        style={styles.input}
        placeholder="Lien familial avec le patient"
        value={lienFamilial}
        onChangeText={setLienFamilial}  // Lier le texte du champ
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