import { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from '@react-native-picker/picker';

export default function SignUp() {
  const { userType } = useLocalSearchParams();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    telephone: "",
    dateNaissance: "",
    lienFamilial: "",      // pour aidant
    adresse: "",           // pour patient
    niveauMaladie: "léger", // Valeur par défaut
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Fonction pour afficher le calendrier
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    const formattedDate = date.toLocaleDateString("fr-FR"); // Format de date français
    setForm({ ...form, dateNaissance: formattedDate });
    hideDatePicker();
  };

  // Fonction de soumission du formulaire
  const handleSubmit = async () => {
    console.log("Formulaire soumis");
    if (!form.nom || !form.prenom || !form.email || !form.password) {
      console.log("Champs manquants");
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(?:\+212|0)([5-7]\d{8})$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    const nameRegex = /^[A-Za-z]+$/; 
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19|20)\d{2}$/;

    function isValidDate(dateStr) {
      const [day, month, year] = dateStr.split(/[\/\-]/).map(Number);
      const date = new Date(year, month - 1, day);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    }

    if (!nameRegex.test(form.nom) || !nameRegex.test(form.prenom)) {
      Alert.alert("Erreur", "Les noms ne peuvent contenir que des lettres.");
      return;
    }

    if (!emailRegex.test(form.email)) {
      Alert.alert("Erreur", "Adresse email invalide");
      return;
    }

    if (form.telephone && !phoneRegex.test(form.telephone)) {
      Alert.alert("Erreur", "Numéro de téléphone invalide");
      return;
    }

    if (!passwordRegex.test(form.password)) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (form.dateNaissance) {
      if (!dateRegex.test(form.dateNaissance)) {
        Alert.alert("Erreur", "Format de date invalide (JJ/MM/AAAA)");
        return;
      }
      if (!isValidDate(form.dateNaissance)) {
        Alert.alert("Erreur", "Date de naissance invalide");
        return;
      }
    }

    if (userType === 'aidant' && !form.lienFamilial) {
      Alert.alert("Erreur", "Veuillez préciser le lien familial");
      return;
    }

    if (userType === 'patient' && (!form.adresse || !form.niveauMaladie)) {
      Alert.alert("Erreur", "Veuillez remplir l'adresse et le niveau de la maladie");
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

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Réponse non-JSON du serveur :", text);
        Alert.alert("Erreur", "Le serveur a renvoyé une réponse inattendue.");
        return;
      }

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
              placeholder="Confirmer le mot de passe *"
              value={form.confirmPassword}
              onChangeText={(text) => setForm({...form, confirmPassword: text})}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              value={form.telephone}
              onChangeText={(text) => setForm({...form, telephone: text})}
              keyboardType="phone-pad"
            />

            {/* Date Picker */}
            <TouchableOpacity onPress={showDatePicker}>
              <TextInput
                style={styles.input}
                placeholder="Date de naissance"
                value={form.dateNaissance}
                editable={false} // Ne peut pas être modifié manuellement
              />
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              maximumDate={new Date()} // On limite la sélection à la date actuelle
            />

            {userType === 'aidant' && (
              <TextInput
                style={styles.input}
                placeholder="Lien familial avec le patient *"
                value={form.lienFamilial}
                onChangeText={(text) => setForm({...form, lienFamilial: text})}
              />
            )}

            {userType === 'patient' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Adresse *"
                  value={form.adresse}
                  onChangeText={(text) => setForm({...form, adresse: text})}
                />
              </>
            )}

            {/* Liste déroulante niveauMaladie uniquement pour les patients */}
            {userType === 'patient' && (
              <>
                <Text style={styles.label}>Niveau de la maladie *</Text>
                <Picker
                  selectedValue={form.niveauMaladie}
                  style={styles.picker}
                  onValueChange={(itemValue) => setForm({...form, niveauMaladie: itemValue})}
                >
                  <Picker.Item label="Sélectionnez un niveau" value="" />
                  <Picker.Item label="Léger" value="léger" />
                  <Picker.Item label="Modéré" value="modéré" />
                  <Picker.Item label="Avancé" value="avancé" />
                </Picker>
              </>
            )}

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
    backgroundColor: "#FFFFFF",  // Fond blanc clair
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
    color: "#443C7C",  // Violet foncé pour le texte du titre
    fontWeight: "bold",
  },
  requiredLabel: {
    color: "#443C7C",  // Violet foncé
    marginBottom: 10,
    fontStyle: "italic",
  },
  label: {
    color: "#443C7C",  // Violet foncé
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d1d1", // Bordure claire
    marginBottom: 15,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,  // Bordure claire
    borderColor: "#d1d1d1",  // Bordure claire
  },
  button: {
    backgroundColor: "#5C9DFF",  // Bleu clair pour les boutons
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  buttonText: {
    color: "#FFFFFF",  // Texte blanc dans le bouton
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: "#7A85D6",  // Teinte intermédiaire de bleu-violet pour les liens secondaires
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
});
