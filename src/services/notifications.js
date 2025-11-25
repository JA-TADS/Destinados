import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Configurar como as notificações aparecem
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  // Ignora erros de configuração no Expo Go
}

export async function registerForPushNotifications() {
  const me = auth.currentUser;
  if (!me) return null;

  try {
    // Solicita permissão
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    // Obtém token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'destinados' // slug do app.json
    })).data;

    // Salva token no Firestore
    await setDoc(doc(db, 'users', me.uid), { pushToken: token }, { merge: true });

    // Configurações Android (apenas se não estiver no Expo Go)
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4D67',
        });
      } catch (error) {
        // Ignora erros de configuração de canal
        console.log('Aviso: Não foi possível configurar o canal de notificações Android');
      }
    }

    return token;
  } catch (error) {
    // Trata erros específicos do Firebase/FCM
    if (error.message?.includes('FirebaseApp') || error.message?.includes('FCM') || error.message?.includes('Firebase')) {
      console.log('Notificações push requerem configuração adicional do Firebase Cloud Messaging (FCM).');
      console.log('Para habilitar notificações push no Android, siga o guia: https://docs.expo.dev/push-notifications/fcm-credentials/');
      return null;
    }
    
    // Ignora erros relacionados ao Expo Go
    if (error.message?.includes('Expo Go') || error.message?.includes('development build')) {
      console.log('Notificações push não estão disponíveis no Expo Go. Use um development build para testar notificações.');
      return null;
    }
    
    // Log apenas para debug, não quebra o app
    console.log('Aviso: Não foi possível registrar notificações push:', error.message);
    return null;
  }
}

export async function sendMatchNotification(otherUserId, otherName) {
  try {
    const otherDoc = await getDoc(doc(db, 'users', otherUserId));
    if (!otherDoc.exists()) return;

    const otherData = otherDoc.data();
    const pushToken = otherData.pushToken;

    if (!pushToken) return;

    // Envia notificação via Expo Push Notification API
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: '🎉 É um Match!',
        body: `Você e ${otherName} se gostaram!`,
        data: { type: 'match', userId: auth.currentUser?.uid },
      }),
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}

