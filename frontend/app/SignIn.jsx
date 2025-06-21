import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons"; // �� Import de l'icône
import NotificationService from '../utils/notificationService';



export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 Etat pour afficher/masquer le mot de passe
  const [successMessage, setSuccessMessage] = useState(null);

    const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null); // Le message disparaît après 3 secondes
    }, 3000);
  };

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
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("userType", userType);
      await AsyncStorage.setItem("aidantName", data.user.nom + " " + data.user.prenom); // Stocker le nom et prénom de l'aidant
      await AsyncStorage.setItem("userId", data.user.id.toString());
      console.log("userId init:", data.user.id);

      // Envoi du token push au backend
      try {
        const pushToken = await NotificationService.registerForPushNotificationsAsync();
        if (pushToken) {
          await NotificationService.saveTokenToBackend(pushToken, data.user.id, userType);
        }
      } catch (e) {
        console.warn('Impossible d\'enregistrer le token push:', e);
      }

      // Afficher un message de succès
      showSuccessMessage("Connecté avec succès"); // Affichage du message de succès

      if (userType === "patient") {
        router.replace("/indexPatient");
      } else if (userType === "aidant") {
        if (data.isFirstLogin) {
          router.replace("/addPatient");
        } else {
          router.replace("/AccueilAidant");
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

  {successMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[styles.radioButton, userType === "patient" && styles.radioButtonActive]}
          onPress={() => setUserType("patient")}
        >
          <Text style={[styles.radioText, userType === "patient" && styles.radioTextActive]}>
            Patient
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioButton, userType === "aidant" && styles.radioButtonActive]}
          onPress={() => setUserType("aidant")}
        >
          <Text style={[styles.radioText, userType === "aidant" && styles.radioTextActive]}>
            Aidant
          </Text>
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

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mot de passe"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#888"
            style={{ marginRight: 10 }}
          />
        </TouchableOpacity>
      </View>

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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d1d1",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
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
    successMessage: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 16,
  },
});