import { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("patient");
  const [isLoading, setIsLoading] = useState(false);

 const handleSignIn = async () => {
  setIsLoading(true);
  try {
    const response = await fetch("http://10.0.2.2:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password, userType: userType }),
    });

    const data = await response.json();

    if (response.ok) {
      // Stocker le token et les données utilisateur dans AsyncStorage
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userType', userType);

      // Stocker les données de l'aidant dans AsyncStorage
      await AsyncStorage.setItem('aidantData', JSON.stringify(data.user));

      console.log("ID de l'aidant avant stockage:", data.user.id); // Affichage de l'ID avant stockage
      await AsyncStorage.setItem("aidantId", data.user.id.toString()); // Stockage dans AsyncStorage

      // Vérification après stockage dans AsyncStorage
      const storedId = await AsyncStorage.getItem("aidantId");
      console.log("ID de l'aidant stocké dans AsyncStorage:", storedId);  // Vérification du stockage

      Alert.alert("Connecté avec succès");

      // Vérification si c'est le premier login pour un aidant
      if (userType === 'patient') {
        router.replace("/Home/patient/index");
      } else if (userType === 'aidant') {
        if (data.isFirstLogin) {
          router.replace("/Home/aidant/addPatient");
        } else {
          router.replace("/Home/aidant/AccueilAidant");
        }
      }
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
    <View style={styles.container}>
      <Image source={require("../assets/images/logo.jpg")} style={styles.logo} />
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

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />

      {isLoading ? (
        <ActivityIndicator size="large" color="white" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/choixuser")}>
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
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 130,
    height: 100,
    marginBottom: 45,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
    color: "#443C7C",
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
    borderWidth: 1,
    borderColor: "#d1d1d1",
  },
  button: {
    backgroundColor: "#5C9DFF",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: "#7A85D6",
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
