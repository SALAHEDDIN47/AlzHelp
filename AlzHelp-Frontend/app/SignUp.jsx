import { useRef, useEffect, useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function SignUp() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userType: "patient",
    birthDate: "",
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (Object.values(form).some((value) => !value)) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await fetch("http://10.0.2.2:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Succès", "Inscription réussie !");
        router.push("/SignIn");
      } else {
        Alert.alert("Erreur", data.error || "Échec de l'inscription");
      }
    } catch (error) {
      Alert.alert("Erreur", "Connexion au serveur impossible");
      console.error(error);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Inscription</Text>

      {Object.keys(form).map((key) => (
        key !== "userType" ? (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={
              key === "firstName" ? "Prénom" :
              key === "lastName" ? "Nom" :
              key === "birthDate" ? "Date de naissance (JJ/MM/AAAA)" : 
              key.charAt(0).toUpperCase() + key.slice(1)
            }
            value={form[key]}
            onChangeText={(text) => setForm({ ...form, [key]: text })}
            secureTextEntry={key === "password"}
            keyboardType={key === "email" ? "email-address" : "default"}
          />
        ) : null
      ))}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>S'inscrire</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/SignIn")}>
        <Text style={styles.buttonText}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
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
