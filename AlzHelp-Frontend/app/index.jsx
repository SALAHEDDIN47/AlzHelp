import { useRef, useEffect } from "react";
import { Link } from "expo-router";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";

export default function Index() {
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
      <Text style={styles.title}>Bienvenue sur AlzHelp</Text>

      <TouchableOpacity style={styles.button}>
        <Link href="/SignUp" style={styles.buttonText}>
          S'inscrire
        </Link>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Link href="/SignIn" style={styles.buttonText}>
          Se connecter
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
    backgroundColor: "#35becf",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 40,
    color: "white",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 15,
  },
  buttonText: {
    color: "#35becf",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
