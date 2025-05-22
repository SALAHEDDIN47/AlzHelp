import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";

export default function ChoixUser() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Logo en haut */}
      <Image
        source={require("../assets/images/logo.jpg")} // Remplacez par le chemin de votre logo
        style={styles.logo}
      />

      {/* Titre "Inscription" */}
      <Text style={styles.title}>Inscription</Text>

      {/* Boutons pour choisir entre Aidant et Patient */}
      <TouchableOpacity style={styles.button}>
        <Link href="/SignUp?userType=aidant" style={styles.buttonText}>
          Je suis un Aidant
        </Link>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Link href="/SignUp?userType=patient" style={styles.buttonText}>
          Je suis un Patient
        </Link>
      </TouchableOpacity>

      {/* Lien pour se connecter */}
      <TouchableOpacity style={styles.linkButton}>
        <Link href="/SignIn" style={styles.linkText}>
          Déjà un compte ? Se connecter
        </Link>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // Fond blanc clair
    paddingHorizontal: 20,
  },
  logo: {
    width: 130, // Taille du logo
    height: 100,
    marginBottom: 45, // Espacement entre le logo et le titre
    alignSelf: "center", // Centrer le logo horizontalement
  },
  title: {
    fontSize: 28,
    marginBottom: 40, // Espacement entre le titre et les boutons
    color: "#443C7C", // Violet foncé pour le texte du titre
    fontWeight: "bold",
    fontFamily: "Arial", // Police choisie (vous pouvez remplacer par une autre police si vous le souhaitez)
  },
  button: {
    backgroundColor: "#5C9DFF",  // Bleu clair pour le fond des boutons
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: "#A48DFF", // Bordure violet clair autour des boutons
  },
  buttonText: {
    color: "#FFFFFF",  // Texte blanc dans les boutons
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: "#7A85D6", // Teinte intermédiaire de bleu-violet pour les liens secondaires
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
