import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import asynchstorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './fetchNgrok';

// Configuration des notifications pour Expo Go
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permission de notifications non accordée');
        return null;
      }
      
      try {
        // Pour Expo Go, on utilise getExpoPushTokenAsync sans projectId
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'ed00ddc1-ab41-4053-83b6-17f7dd4514d2',
        })).data;
        console.log('Token Expo Push obtenu:', token);
      } catch (error) {
        console.error('Erreur lors de l\'obtention du token:', error);
        // En cas d'erreur, on retourne null pour continuer sans notifications push
        return null;
      }
    } else {
      console.log('Notifications push nécessitent un appareil physique');
      return null;
    }

    return token;
  }

  static async saveTokenToBackend(token, userId, userType) {
    if (!token) {
      console.log('Aucun token à sauvegarder');
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/notification/saveToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          patientId: userType === 'patient' ? userId : null,
          aidantId: userType === 'aidant' ? userId : null,
        }),
      });

      if (response.ok) {
        console.log('Token sauvegardé avec succès');
        return true;
      } else {
        console.error('Erreur lors de la sauvegarde du token');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
      return false;
    }
  }

  static async setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
    try {
      // Écouter les notifications reçues quand l'app est ouverte
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification reçue:', notification);
        onNotificationReceived && onNotificationReceived(notification);
      });

      // Écouter les réponses aux notifications (quand l'utilisateur tape dessus)
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Réponse à la notification:', response);
        onNotificationResponse && onNotificationResponse(response);
      });

      return {
        notificationListener,
        responseListener,
      };
    } catch (error) {
      console.error('Erreur lors de la configuration des listeners:', error);
      return null;
    }
  }

  static async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
        },
        trigger: trigger || null, // null pour notification immédiate
      });
      console.log('Notification locale programmée avec succès');
    } catch (error) {
      console.error('Erreur lors de la planification de la notification locale:', error);
    }
  }

  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  }

  static async getBadgeCountAsync() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Erreur lors de la récupération du badge:', error);
      return 0;
    }
  }

  static async setBadgeCountAsync(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Erreur lors de la définition du badge:', error);
    }
  }

  // Nouvelle méthode pour tester les notifications locales (fonctionne sur émulateur)
  static async testLocalNotification() {
    try {
      await this.scheduleLocalNotification(
        'Test Rappel Médical',
        'Ceci est un test de notification locale',
        {
          rappel: {
            id: 999,
            description: 'Test de notification locale',
            date: new Date().toISOString().split('T')[0],
            heure: new Date().toTimeString().slice(0,5),
          },
          patient: {
            id: 1,
            nom: 'Test',
            prenom: 'Patient',
            email: 'test@email.com',
            telephone: '0123456789',
          },
          statut: 'test',
        }
      );
      return true;
    } catch (error) {
      console.error('Erreur lors du test de notification locale:', error);
      return false;
    }
  }
}

// Fonction utilitaire pour traiter les données de notification
export const processNotificationData = (notification) => {
  try {
    const data = notification.request.content.data;
    
    // Si c'est une notification de rappel
    if (data.rappel && data.patient) {
      return {
        type: 'rappel',
        rappel: data.rappel,
        patient: data.patient,
        statut: data.statut || 'nouveau',
      };
    }
    
    // Autres types de notifications peuvent être ajoutés ici
    return {
      type: 'general',
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: data,
    };
  } catch (error) {
    console.error('Erreur lors du traitement des données de notification:', error);
    return null;
  }
};

export default NotificationService;
