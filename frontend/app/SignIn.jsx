import { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("patient");
  const [isLoading, setIsLoading] = useState(false);

  // Update the handleSignIn function:
const handleSignIn = async () => {
  setIsLoading(true);
  try {
    const response = await fetch("http://10.0.2.2:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, userType }),
    });

    const data = await response.json();

    if (response.ok) {
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userType', userType);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
      router.replace("/Home");
    } else {
      Alert.alert("Erreur", data.error || "Identifiants incorrects");
    }
  } catch (error) {
    Alert.alert("Erreur", "Connexion au serveur impossible");
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[styles.radioButton, userType === 'patient' && styles.radioButtonActive]}
          onPress={() => setUserType('patient')}
        >
          <Text style={[styles.radioText, userType === 'patient' && styles.radioTextActive]}>Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioButton, userType === 'aidant' && styles.radioButtonActive]}
          onPress={() => setUserType('aidant')}
        >
          <Text style={[styles.radioText, userType === 'aidant' && styles.radioTextActive]}>Aidant</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="white" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/SignUp")}>
            <Text style={styles.linkText}>Créer un compte</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
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
  radioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  radioButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
  },
  radioButtonActive: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#35becf",
  },
  radioText: {
    color: "#666",
  },
  radioTextActive: {
    color: "#35becf",
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
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});