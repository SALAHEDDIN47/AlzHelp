import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function ProfileAidant() {
  const [aidantData, setAidantData] = useState(null);
  const [patients, setPatients] = useState([]);

  // Charger les données de l'aidant depuis AsyncStorage
  useEffect(() => {
    const fetchData = async () => {
      const aidantId = await AsyncStorage.getItem("aidantId");
      const aidantData = await AsyncStorage.getItem("aidantData");
      setAidantData(JSON.parse(aidantData));

      // Récupérer les patients associés à l'aidant
      const response = await fetch(`http://10.0.2.2:3000/api/aidant/${aidantId}/patients`);
      const data = await response.json();
      setPatients(data.patients);
    };

    fetchData();
  }, []);

  // Fonction pour supprimer un patient de la liste
  const handleRemovePatient = async (patientId) => {
    const aidantId = await AsyncStorage.getItem("aidantId");
    const response = await fetch("http://10.0.2.2:3000/api/aidant/removePatient", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ aidantId, patientId }),
    });

    if (response.ok) {
      Alert.alert("Succès", "Patient supprimé avec succès");
      setPatients((prevPatients) =>
        prevPatients.filter((patient) => patient.id !== patientId)
      );
    } else {
      Alert.alert("Erreur", "Une erreur est survenue");
    }
  };

  return (
    <View style={styles.container}>
      {aidantData ? (
        <>
          <Image
            source={require("../../../assets/images/icon.png")} // Exemple d'image de profil
            style={styles.profileImage}
          />
          <Text style={styles.welcomeText}>
            Bonjour {aidantData.prenom}, bienvenue sur AlzHelp !
          </Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Nom: {aidantData.nom}</Text>
            <Text style={styles.infoText}>Email: {aidantData.email}</Text>
            <Text style={styles.infoText}>Téléphone: {aidantData.telephone}</Text>
          </View>

          <View style={styles.patientsContainer}>
            <Text style={styles.patientsTitle}>Mes patients :</Text>
            {patients.map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                <Text style={styles.patientName}>{patient.nom}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePatient(patient.id)}
                >
                  <Text style={styles.removeButtonText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => router.push("/Home/aidant/Accueil")}
            >
              <Text style={styles.footerButtonText}>Accueil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={async () => {
                await AsyncStorage.removeItem("aidantId");
                await AsyncStorage.removeItem("aidantData");
                router.replace("/SignIn");
              }}
            >
              <Text style={styles.footerButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.loadingText}>Chargement...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5C9DFF",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    width: "100%",
    marginTop: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#443C7C",
  },
  patientsContainer: {
    marginBottom: 30,
    width: "100%",
  },
  patientsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  patientCard: {
    backgroundColor: "#ffffff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientName: {
    fontSize: 16,
    color: "#443C7C",
  },
  removeButton: {
    backgroundColor: "#FF5733",
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  footerButton: {
    backgroundColor: "#35becf",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    width: 100,
    alignItems: "center",
  },
  footerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
  },
});
