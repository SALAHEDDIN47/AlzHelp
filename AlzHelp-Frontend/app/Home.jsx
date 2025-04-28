import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bienvenue dans l'application AlzHelp</Text>
      <Button
        title="Déconnexion"
        color="#35becf"
        onPress={() => router.replace("/SignIn")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});
