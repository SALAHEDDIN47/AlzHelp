import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Accueil() {
  const [rappels, setRappels] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetch("http://10.0.2.2:3000/api/rappels") // Modifier si nécessaire
      .then(res => res.json())
      .then(data => setRappels(data))
      .catch(err => console.error("Erreur récupération rappels:", err));

    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderRappel = ({ item }) => {
    const [date, time] = item.date_heure_rappel.split("T");
    return (
      <View style={styles.rappelBox}>
        <Text style={styles.rappelTitle}>{item.titre_rappel} ({item.type_rappel})</Text>
        <Text style={styles.rappelDesc}>{item.description}</Text>
        <Text style={styles.rappelTime}>{time.slice(0, 5)}  {date}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Rappels :</Text>

      <FlatList
        data={rappels}
        keyExtractor={(item) => item.id_rappel.toString()}
        renderItem={renderRappel}
      />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => Alert.alert("SOS")}>
          <Text style={styles.navItem}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert("Navigation")}>
          <Text style={styles.navItem}>Navigation</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/Accueil")}>
          <Text style={styles.navItem}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert("Suivi Médical")}>
          <Text style={styles.navItem}>Suivi Médical</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/Profil")}>
          <Text style={styles.navItem}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  rappelBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  rappelTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  rappelDesc: {
    marginBottom: 4,
  },
  rappelTime: {
    fontStyle: "italic",
    color: "#666",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#eee",
  },
  navItem: {
    fontWeight: "bold",
  },
});
