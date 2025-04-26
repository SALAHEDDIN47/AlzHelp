import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native"; // Import ajouté

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("patient");
  const [birthDate, setBirthDate] = useState("");
  const navigation = useNavigation(); // Initialisation de la navigation

  const handleSignUp = async () => {
    // Validation des champs
    if (!firstName || !lastName || !email || !password || !birthDate) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      // Envoi des données au backend
      const response = await fetch("http://10.0.2.2:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          userType,
          birthDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Succès", `Bienvenue ${data.first_name} !`);
        navigation.navigate("SignIn"); // Redirection après succès
      } else {
        Alert.alert("Erreur", data.error || "Inscription échouée");
      }
    } catch (error) {
      Alert.alert("Erreur", "Connexion au serveur impossible");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>AlzHelp</Text>

      <View style={styles.formBox}>
        <Text style={styles.title}>Créer un compte</Text>

        {/* Champs du formulaire (inchangés) */}
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Date de naissance (JJ/MM/AAAA)"
          value={birthDate}
          onChangeText={setBirthDate}
        />

        {/* Picker pour le type d'utilisateur */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userType}
            onValueChange={(itemValue) => setUserType(itemValue)}
          >
            <Picker.Item label="Patient" value="patient" />
            <Picker.Item label="Aidant" value="aidant" />
            <Picker.Item label="Médecin" value="medecin" />
          </Picker>
        </View>

        {/* Boutons */}
        <Button title="S'inscrire" onPress={handleSignUp} />
        <View style={{ marginTop: 10 }}>
          <Button
            title="Connexion"
            onPress={() => navigation.navigate("SignIn")} // Navigation corrigée
          />
        </View>
      </View>
    </View>
  );
}

// Styles (inchangés)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#35becf",
    padding: 20,
    paddingTop: 60,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    alignSelf: "center",
    marginBottom: 20,
  },
  formBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 22,
    marginBottom: 15,
    alignSelf: "center",
    color: "#333",
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  pickerContainer: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 15,
  },
});