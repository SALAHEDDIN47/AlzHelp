import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="index" />      {/* Page d'accueil */}
      <Stack.Screen name="SignUp" />
      <Stack.Screen name="SignIn" />
      <Stack.Screen name="Home" />
    </Stack>
  );
}