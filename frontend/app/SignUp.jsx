import { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from "@expo/vector-icons";

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
    lienFamilial: "",
    adresse: "",
  });
  
  const [errors, setErrors] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    telephone: "",
    dateNaissance: "",
    lienFamilial: "",
    adresse: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    const formattedDate = date.toLocaleDateString("fr-FR");
    setForm({ ...form, dateNaissance: formattedDate });
    setErrors({...errors, dateNaissance: ""});
    hideDatePicker();
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(?:\+212|0)([5-7]\d{8})$/;
    const passwordRegex = /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[\W_]).{8,}$/;
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

    const newErrors = {
      nom: "",
      prenom: "",
      email: "",
      password: "",
      confirmPassword: "",
      telephone: "",
      dateNaissance: "",
      lienFamilial: "",
      adresse: "",
    };

    let isValid = true;

    // Validation du nom
    if (!form.nom.trim()) {
      newErrors.nom = "Le nom est obligatoire";
      isValid = false;
    } else if (!nameRegex.test(form.nom)) {
      newErrors.nom = "Le nom ne peut contenir que des lettres";
      isValid = false;
    }

    // Validation du prénom
    if (!form.prenom.trim()) {
      newErrors.prenom = "Le prénom est obligatoire";
      isValid = false;
    } else if (!nameRegex.test(form.prenom)) {
      newErrors.prenom = "Le prénom ne peut contenir que des lettres";
      isValid = false;
    }

    // Validation de l'email
    if (!form.email.trim()) {
      newErrors.email = "L'email est obligatoire";
      isValid = false;
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Adresse email invalide";
      isValid = false;
    }

    // Validation du mot de passe
    if (!form.password) {
      newErrors.password = "Le mot de passe est obligatoire";
      isValid = false;
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password = "8 caractères min, majuscule, minuscule, chiffre, spécial";
      isValid = false;
    }

    // Validation de la confirmation du mot de passe
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirmez votre mot de passe";
      isValid = false;
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      isValid = false;
    }

    // Validation du téléphone
    if (form.telephone && !phoneRegex.test(form.telephone)) {
      newErrors.telephone = "Numéro de téléphone invalide";
      isValid = false;
    }

    // Validation de la date de naissance
    if (form.dateNaissance) {
      if (!dateRegex.test(form.dateNaissance)) {
        newErrors.dateNaissance = "Format invalide (JJ/MM/AAAA)";
        isValid = false;
      } else if (!isValidDate(form.dateNaissance)) {
        newErrors.dateNaissance = "Date invalide";
        isValid = false;
      }
    }

    // Validation spécifique aux aidants
    if (userType === 'aidant' && !form.lienFamilial.trim()) {
      newErrors.lienFamilial = "Le lien familial est obligatoire";
      isValid = false;
    }

    // Validation spécifique aux patients
    if (userType === 'patient') {
      if (!form.adresse.trim()) {
        newErrors.adresse = "L'adresse est obligatoire";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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

  const ErrorText = ({ error }) => (
    error ? <Text style={styles.errorText}>{error}</Text> : null
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Inscription {userType === 'patient' ? 'Patient' : 'Aidant'}
        </Text>

        <Text style={styles.requiredLabel}>* Champs obligatoires</Text>

        <View>
          <TextInput
            style={[styles.input, errors.nom && styles.inputError]}
            placeholder="Nom *"
            value={form.nom}
            onChangeText={(text) => {
              setForm({...form, nom: text});
              if (errors.nom) setErrors({...errors, nom: ""});
            }}
          />
          <ErrorText error={errors.nom} />
        </View>

        <View>
          <TextInput
            style={[styles.input, errors.prenom && styles.inputError]}
            placeholder="Prénom *"
            value={form.prenom}
            onChangeText={(text) => {
              setForm({...form, prenom: text});
              if (errors.prenom) setErrors({...errors, prenom: ""});
            }}
          />
          <ErrorText error={errors.prenom} />
        </View>

        <View>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email *"
            value={form.email}
            onChangeText={(text) => {
              setForm({...form, email: text});
              if (errors.email) setErrors({...errors, email: ""});
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <ErrorText error={errors.email} />
        </View>

        <View>
          <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe *"
              value={form.password}
              onChangeText={(text) => {
                setForm({...form, password: text});
                if (errors.password) setErrors({...errors, password: ""});
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          <ErrorText error={errors.password} />
        </View>

        <View>
          <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirmer le mot de passe *"
              value={form.confirmPassword}
              onChangeText={(text) => {
                setForm({...form, confirmPassword: text});
                if (errors.confirmPassword) setErrors({...errors, confirmPassword: ""});
              }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          <ErrorText error={errors.confirmPassword} />
        </View>

        <View>
          <TextInput
            style={[styles.input, errors.telephone && styles.inputError]}
            placeholder="Téléphone"
            value={form.telephone}
            onChangeText={(text) => {
              setForm({...form, telephone: text});
              if (errors.telephone) setErrors({...errors, telephone: ""});
            }}
            keyboardType="phone-pad"
          />
          <ErrorText error={errors.telephone} />
        </View>

        <View>
          <TouchableOpacity onPress={showDatePicker}>
            <TextInput
              style={[styles.input, errors.dateNaissance && styles.inputError]}
              placeholder="Date de naissance"
              value={form.dateNaissance}
              editable={false}
            />
          </TouchableOpacity>
          <ErrorText error={errors.dateNaissance} />
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          maximumDate={new Date()}
        />

        {userType === 'aidant' && (
          <View>
            <TextInput
              style={[styles.input, errors.lienFamilial && styles.inputError]}
              placeholder="Lien familial avec le patient *"
              value={form.lienFamilial}
              onChangeText={(text) => {
                setForm({...form, lienFamilial: text});
                if (errors.lienFamilial) setErrors({...errors, lienFamilial: ""});
              }}
            />
            <ErrorText error={errors.lienFamilial} />
          </View>
        )}

        {userType === 'patient' && (
          <>
            <View>
              <TextInput
                style={[styles.input, errors.adresse && styles.inputError]}
                placeholder="Adresse *"
                value={form.adresse}
                onChangeText={(text) => {
                  setForm({...form, adresse: text});
                  if (errors.adresse) setErrors({...errors, adresse: ""});
                }}
              />
              <ErrorText error={errors.adresse} />
            </View>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#FFFFFF" 
  },
  title: { 
    fontSize: 28, 
    marginBottom: 20, 
    textAlign: "center", 
    color: "#443C7C", 
    fontWeight: "bold" 
  },
  requiredLabel: { 
    color: "#443C7C", 
    marginBottom: 10, 
    fontStyle: "italic" 
  },
  label: { 
    color: "#443C7C", 
    fontSize: 16, 
    marginBottom: 10 
  },
  picker: {
    backgroundColor: "white", 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 10,
    borderWidth: 1, 
    borderColor: "#d1d1d1", 
    marginBottom: 15,
  },
  input: {
    backgroundColor: "white", 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 10,
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: "#d1d1d1",
  },
  inputError: {
    borderColor: 'red',
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d1d1",
    borderRadius: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  eyeButton: {
    padding: 10,
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
    marginTop: 15 
  },
  linkText: {
    color: "#7A85D6",
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: 'black',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -5,
  },
}); 