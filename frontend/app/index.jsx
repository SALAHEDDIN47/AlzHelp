import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacité de l'animation

  useEffect(() => {
    // Lancer l'animation de fondu d'abord
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Rediriger automatiquement vers la page SignIn après un petit délai
    const timer = setTimeout(() => {
      router.replace("/SignIn");  // Redirection vers la page SignIn après l'animation
    }, 3000); // Délai de 3 secondes pour laisser le temps à l'animation de se jouer

    return () => clearTimeout(timer); // Nettoyage du timer
  }, [fadeAnim, router]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Affichage du logo */}
      <Image 
        source={require("../assets/images/logo.jpg")} // Chemin vers le logo
        style={styles.logo}
      />
      <Text style={styles.title}>Bienvenue sur AlzHelp</Text>
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
