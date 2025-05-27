import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from "expo-router";
import { getPushNotificationToken, requestPermissions } from './notifications';  // Assurez-vous d'importer les bonnes fonctions
import * as Notifications from 'expo-notifications'; // Pour gérer les notifications

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacité de l'animation
  const [token, setToken] = useState(null); // Déclaration d'un état pour le token

  useEffect(() => {
    // Lancer l'animation de fondu d'abord
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Demander les permissions et récupérer le token de notification push
    requestPermissions().then(() => {
      getPushNotificationToken().then(setToken);  // Sauvegarde du token
    });

    // Rediriger automatiquement vers la page SignIn après un petit délai
    const timer = setTimeout(() => {
      router.replace("/SignIn");  // Redirection vers la page SignIn après l'animation
    }, 3000); // Délai de 3 secondes pour laisser le temps à l'animation de se jouer

    return () => clearTimeout(timer); // Nettoyage du timer
  }, [fadeAnim, router]);

  useEffect(() => {
    if (token) {
      // Afficher ou utiliser le token de notification ici si nécessaire
      console.log("Token de notification push : ", token);
      
      // Vous pouvez aussi enregistrer ce token dans votre backend ou AsyncStorage ici
    }
  }, [token]);

  // Gestion des notifications push reçues
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
      // Gérer la notification reçue ici (son, affichage)
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Réponse à la notification:', response);
    });

    // Nettoyage des listeners à la déconnexion du composant
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Affichage du logo */}
      <Image 
        source={require("../assets/images/logo.jpg")} // Chemin vers le logo
        style={styles.logo}
      />
      <Text style={styles.title}>Bienvenue sur AlzHelp</Text>
      {token && <Text style={styles.tokenText}>Token de notification: {token}</Text>}  {/* Affichage du token si disponible */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // Fond clair (blanc)
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    marginBottom: 40,
    color: "#443C7C", // Violet foncé pour le texte
    fontWeight: "bold",
  },
  tokenText: {
    fontSize: 18,
    marginTop: 20,
    color: "green",
  },
  button: {
    backgroundColor: "#5C9DFF", // Bleu clair pour les boutons
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 15,
    width: '100%',
  },
  buttonText: {
    color: "#FFFFFF", // Texte blanc dans le bouton
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: "#7A85D6", // Couleur pour les liens secondaires (teinte intermédiaire)
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
