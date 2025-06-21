import { useState, useEffect } from "react";
import { View, Text, Animated, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/fetchNgrok';
import AidantNotification from './components/AidantNotification';
import { Ionicons } from '@expo/vector-icons';

export default function IndexAidant() {
  const [fadeAnim] = useState(new Animated.Value(0)); // Animation pour l'opacité
  const [prenom, setPrenom] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);

  useEffect(() => {
    // Animer le texte de bienvenue
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Récupérer le prénom de l'aidant et vérifier s'il est connecté pour la première fois
    const checkFirstLogin = async () => {
      try {
        const aidantData = await AsyncStorage.getItem("aidantData");
        
        if (!aidantData) {
          console.log("Aucune donnée d'aidant trouvée");
          return; // Si aucune donnée d'aidant n'est trouvée, on arrête l'exécution
        }

        const parsedData = JSON.parse(aidantData);

        // Vérification que les données de l'aidant sont valides
        if (!parsedData || !parsedData.prenom || !parsedData.id) {
          console.log("Données d'aidant invalides");
          return; // Si les données sont invalides, on arrête le processus
        }

        // Si les données sont valides, on accède au prénom de l'aidant
        setPrenom(parsedData.prenom);
        const aidantId = parsedData.id;  // Utilisation de l'ID de l'aidant

        // Vérifier si l'aidant a des patients associés
        const response = await fetch(`${BASE_URL}/api/auth/checkPatientForAidant/${aidantId}`);
        const data = await response.json();

        if (data.isFirstLogin) {
          setIsFirstLogin(true);
          router.replace("/addPatient");  // Redirection vers la page d'ajout de patient
        } else {
          setIsFirstLogin(false);
          router.replace("/Accueil");  // Redirection vers l'accueil de l'aidant
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données", error);
        setIsLoading(false);
      }
    };

    checkFirstLogin();
  }, [fadeAnim, router]);

  // Fonction de test pour simuler une notification de rappel
  const testAidantNotification = (isConfirmed = false) => {
    setNotificationData({
      rappel: {
        id: 123,
        description: 'Test : Rappel pour prise de médicament',
        date: new Date().toISOString().split('T')[0],
        heure: new Date().toTimeString().slice(0,5),
      },
      patient: {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@email.com',
        telephone: '0123456789',
      },
      statut: isConfirmed ? 'confirmé' : 'non confirmé',
    });
    setShowNotification(true);
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
    setNotificationData(null);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C9DFF" />
        <Text style={styles.loadingText}>Vérification de la connexion...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Bienvenue {prenom} sur AlzHelp</Text>
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#4CAF50', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 }}
          onPress={() => testAidantNotification(true)}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>Tester Notification Confirmée</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#FF9800', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 }}
          onPress={() => testAidantNotification(false)}
        >
          <Ionicons name="alert-circle" size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>Tester Notification Non Confirmée</Text>
        </TouchableOpacity>
      </View>
      <AidantNotification
        visible={showNotification}
        notificationData={notificationData}
        onDismiss={handleDismissNotification}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5C9DFF", // Bleu clair
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5C9DFF", // Bleu clair
  },
  loadingText: {
    marginTop: 20,
    color: "white",
    fontSize: 18,
  },
});
