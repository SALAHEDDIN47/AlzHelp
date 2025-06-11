import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />            {/* Page d'accueil */}
      <Stack.Screen name="SignIn" />
      <Stack.Screen name="SignUp" />
      <Stack.Screen name="choixuser" />
      <Stack.Screen name="addPatient" />
      <Stack.Screen name="AccueilAidant" />
       <Stack.Screen name="indexAidant" />
       <Stack.Screen name="indexPatient" />
    </Stack>
  );
}