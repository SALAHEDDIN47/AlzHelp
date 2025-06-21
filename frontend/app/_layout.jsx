import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />            {/* Page d'accueil */}
        <Stack.Screen name="SignIn" />
        <Stack.Screen name="SignUp" />
        <Stack.Screen name="choixuser" />
        
        {/* Routes spécifiques aux aidants et patients */}

        <Stack.Screen name="addPatient" />
       
         <Stack.Screen name="indexAidant" />
         <Stack.Screen name="indexPatient" />
         <Stack.Screen name="RemindersPage" />

          <Stack.Screen name="AccueilAidant" />
        <Stack.Screen name="PatientDetailsPage" />
      </Stack>
    </AuthProvider>
  );
}