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

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez entrer un email et un mot de passe");
      return;
    }

    // Ici tu peux ajouter ta logique de connexion (vérification avec un backend par exemple)
    Alert.alert("Connexion réussie", `Bienvenue, ${email}!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>AlzHelp</Text>

      <View style={styles.formBox}>
        <Text style={styles.title}>Se connecter</Text>

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

        <Button title="Se connecter" onPress={handleSignIn} />
        <View style={{ marginTop: 10 }}>
        <Button
    title="Retour à l'inscription"
    onPress={() => navigation.navigate("SignUp")}
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
});
