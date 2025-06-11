import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission de notifications requise');
  }
};

export const getPushNotificationToken = async () => {
  const token = await Notifications.getExpoPushTokenAsync();
  console.log("Token de notification push :", token.data);  // Affichez le token dans la console
  return token.data;  // Retourne le token de notification
};
export default Notifications;