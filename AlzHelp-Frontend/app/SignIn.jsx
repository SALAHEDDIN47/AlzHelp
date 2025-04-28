import { useRef, useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://10.0.2.2:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.replace("/Home");
      } else {
        Alert.alert("Erreur", data.message || "Identifiants incorrects");
      }
    } catch (error) {
      Alert.alert("Erreur", "Connexion au serveur impossible");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#35becf" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => router.push("/SignUp")}>
            <Text style={styles.buttonText}>Créer un compte</Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#35becf",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  buttonText: {
    color: "#35becf",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
