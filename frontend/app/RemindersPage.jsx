import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Button } from "react-native";
import { useRouter } from "expo-router";

export default function ManageReminders({ patientId }) {
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminders, setReminders] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch existing reminders for the patient
    const fetchReminders = async () => {
      try {
        const response = await fetch(`http://10.0.2.2:3000/api/patients/${patientId}/reminders`);
        const data = await response.json();
        setReminders(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchReminders();
  }, [patientId]);

  const handleAddReminder = async () => {
    if (!reminderDescription || !reminderTime) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const response = await fetch(`http://10.0.2.2:3000/api/patients/${patientId}/addReminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: reminderDescription, time: reminderTime }),
    });

    if (response.ok) {
      alert("Rappel ajouté avec succès");
      setReminderDescription("");
      setReminderTime("");
    } else {
      alert("Une erreur est survenue.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gérer les rappels pour le patient</Text>

      <TextInput
        style={styles.input}
        placeholder="Description du rappel"
        value={reminderDescription}
        onChangeText={setReminderDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Heure du rappel (HH:MM)"
        value={reminderTime}
        onChangeText={setReminderTime}
      />

      <Button title="Ajouter un rappel" onPress={handleAddReminder} />

      <Text style={styles.subtitle}>Rappels existants:</Text>
      {reminders.map((reminder) => (
        <View key={reminder.id} style={styles.reminderCard}>
          <Text>{reminder.description} - {reminder.time}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "white",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  reminderCard: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
});
