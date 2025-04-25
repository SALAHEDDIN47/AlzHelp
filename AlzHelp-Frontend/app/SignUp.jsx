import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router"; // Importation du hook useRouter

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("patient");

  const [birthDate, setBirthDate] = useState(""); // Date sous forme de chaîne
  const [showDateInput, setShowDateInput] = useState(false);

  const router = useRouter(); // Initialisation de router

  const handleSignUp = () => {
    if (!firstName || !lastName || !email || !password || !birthDate) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    // Affichage d'un message de succès
    Alert.alert("Succès", `Bienvenue ${firstName} (${userType}) !`);
    router.push("/signin"); // Rediriger vers la page de connexion après inscription
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>AlzHelp</Text>

      <View style={styles.formBox}>
        <Text style={styles.title}>Créer un compte</Text>

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

        <Button title="S'inscrire" onPress={handleSignUp} />
        <View style={{ marginTop: 10 }}>
        <Button 
    title="Connexion" 
    onPress={() => navigation.navigate("SignIn")} 
  />
        </View>
      </View>
    </View>
  );
}

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
