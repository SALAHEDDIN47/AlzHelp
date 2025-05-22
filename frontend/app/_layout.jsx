import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />            {/* Page d'accueil */}
      <Stack.Screen name="SignIn" />
      <Stack.Screen name="SignUp" />
      <Stack.Screen name="choixuser" />
      
      {/* Routes spécifiques aux aidants et patients */}

      <Stack.Screen name="Home/aidant/addPatient" />
      <Stack.Screen name="Home/aidant/AccueilAidant" />
       <Stack.Screen name="Home/aidant/indexAidant" />
       <Stack.Screen name="Home/patient/index" />
    </Stack>
  );
}