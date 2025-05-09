import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const [userType, setUserType] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = await AsyncStorage.getItem('token');
      const type = await AsyncStorage.getItem('userType');
      setUserType(type);

      try {
        const endpoint = type === 'patient' 
          ? "http://10.0.2.2:3000/api/patients/me" 
          : "http://10.0.2.2:3000/api/aidants/me";

        const response = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error("Erreur de récupération des données:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userType');
    router.replace("/SignIn");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Bienvenue {userInfo?.prenom || ''} ({userType === 'patient' ? 'Patient' : 'Aidant'})
      </Text>

      {userType === 'aidant' && (
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push("/PatientsList")}
        >
          <Text style={styles.menuButtonText}>Mes Patients</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => router.push("/Profile")}
      >
        <Text style={styles.menuButtonText}>Mon Profil</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  menuButton: {
    backgroundColor: "#35becf",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  menuButtonText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
});