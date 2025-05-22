import React from "react";
import { Tabs } from "expo-router";
import CustomNavBar from "../../components/CustomnavBar";  // Assurez-vous que ce composant existe

export default function _layout() {
  return (
    <Tabs
      tabBar={(props) => <CustomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="sos" options={{ title: "SOS" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
