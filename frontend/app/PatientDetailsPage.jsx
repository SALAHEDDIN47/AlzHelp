import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PatientDetailsPage() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const patientId = await AsyncStorage.getItem("patientId");
        console.log("ID patient depuis storage:", patientId);

        if (!patientId) {
          throw new Error("ID patient manquant");
        }

        const response = await fetch(`http://10.0.2.2:3000/patients/${patientId}`);
        
        console.log("Réponse API:", response.status);
        const responseData = await response.text();
        console.log("Données brutes:", responseData);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${responseData}`);
        }

        const data = JSON.parse(responseData);
        setPatient(data);
      } catch (error) {
        console.error("Erreur complète:", error);
        setError(error.message);
        Alert.alert("Erreur", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Détails du Patient</Text>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : patient ? (
        <>
          <Text style={styles.label}>Nom:</Text>
          <Text style={styles.value}>{patient.nompatient || "Non renseigné"}</Text>

          <Text style={styles.label}>Prénom:</Text>
          <Text style={styles.value}>{patient.prenompatient || "Non renseigné"}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{patient.emailpatient || "Non renseigné"}</Text>

          <Text style={styles.label}>Téléphone:</Text>
          <Text style={styles.value}>{patient.telephpatient || "Non renseigné"}</Text>

          <Text style={styles.label}>Date de naissance:</Text>
          <Text style={styles.value}>
            {patient.datenaissance ? new Date(patient.datenaissance).toLocaleDateString() : "Non renseigné"}
          </Text>
        </>
      ) : (
        <Text style={styles.notFound}>Aucune donnée patient disponible</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
  },
  value: {
    marginBottom: 10,
  },
  errorText: {
    color: "red",
    marginTop: 20,
  },
  notFound: {
    fontStyle: "italic",
    marginTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
});