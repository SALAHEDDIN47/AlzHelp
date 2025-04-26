import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez entrer un email et un mot de passe");
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
        navigation.navigate("Home"); // Redirige vers l'écran principal après connexion
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
      <Text style={styles.appTitle}>AlzHelp</Text>

      <View style={styles.formBox}>
        <Text style={styles.title}>Connexion</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
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

        {isLoading ? (
          <ActivityIndicator size="large" color="#35becf" />
        ) : (
          <Button
            title="Se connecter"
            onPress={handleSignIn}
            color="#35becf"
          />
        )}

        <View style={styles.secondaryButtonContainer}>
          <Button
            title="Créer un compte"
            onPress={() => navigation.navigate("SignUp")}
            color="#666"
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
    justifyContent: "center",
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
    fontSize: 16,
  },
  secondaryButtonContainer: {
    marginTop: 10,
  },
});