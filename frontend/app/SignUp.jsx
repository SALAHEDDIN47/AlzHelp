import { useState } from "react";
import { 
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUp() {
  const { userType } = useLocalSearchParams();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    dateNaissance: "",
    id_lien: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Update the handleSubmit function:
const handleSubmit = async () => {
  if (!form.nom || !form.prenom || !form.email || !form.password) {
    Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
    return;
  }

  setIsLoading(true);
  
  try {
    const endpoint = "http://10.0.2.2:3000/api/auth/register";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, userType }),
    });

    const data = await response.json();

    if (response.ok) {
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('userType', userType);
      Alert.alert(
        "Succès", 
        "Inscription réussie !",
        [{ text: "OK", onPress: () => router.replace("/SignIn") }]
      );
    } else {
      Alert.alert("Erreur", data.error || "Échec de l'inscription");
    }
  } catch (error) {
    console.error("Erreur:", error);
    Alert.alert("Erreur", "Connexion au serveur impossible");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Inscription {userType === 'patient' ? 'Patient' : 'Aidant'}
        </Text>

        {isSuccess ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>✓ Inscription réussie!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.requiredLabel}>* Champs obligatoires</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom *"
              value={form.nom}
              onChangeText={(text) => setForm({...form, nom: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Prénom *"
              value={form.prenom}
              onChangeText={(text) => setForm({...form, prenom: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={form.email}
              onChangeText={(text) => setForm({...form, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Mot de passe *"
              value={form.password}
              onChangeText={(text) => setForm({...form, password: text})}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              value={form.telephone}
              onChangeText={(text) => setForm({...form, telephone: text})}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Date de naissance (JJ/MM/AAAA)"
              value={form.dateNaissance}
              onChangeText={(text) => setForm({...form, dateNaissance: text})}
            />

            <TextInput
              style={styles.input}
              placeholder={userType === 'patient' ? "ID de votre aidant" : "ID du patient"}
              value={form.id_lien}
              onChangeText={(text) => setForm({...form, id_lien: text})}
            />

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Traitement en cours...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>S'inscrire</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => router.push("/SignIn")}
            >
              <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#35becf",
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  requiredLabel: {
    color: "white",
    marginBottom: 10,
    fontStyle: "italic",
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
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  successContainer: {
    backgroundColor: 'rgba(0, 200, 0, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },
  successText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  }
});