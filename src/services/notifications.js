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
      projectId: 'ca75a761-625f-42c8-ae5a-18c0b4154e51' // EAS projectId do app.json
    })).data;

    // Salva token no Firestore
    await setDoc(doc(db, 'users', me.uid), { pushToken: token }, { merge: true });
    console.log('✅ Push token salvo no Firestore:', token.substring(0, 30) + '...');
    console.log('✅ Token completo:', token);

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

// Função para testar notificações push
export async function testPushNotification() {
  console.log('🔵 BOTÃO CLICADO! Função testPushNotification chamada');
  const me = auth.currentUser;
  if (!me) {
    console.log('❌ Você precisa estar logado para testar');
    console.log('❌ auth.currentUser é:', me);
    return;
  }
  
  console.log('✅ Usuário logado:', me.uid);

  try {
    const myDoc = await getDoc(doc(db, 'users', me.uid));
    if (!myDoc.exists()) {
      console.log('❌ Seu perfil não foi encontrado');
      return;
    }

    const pushToken = myDoc.data().pushToken;
    if (!pushToken) {
      console.log('❌ Você não tem pushToken. Abra a tela Home para registrar.');
      return;
    }

    console.log('🧪 TESTE: Enviando notificação de teste...');
    console.log('🔑 Seu token:', pushToken.substring(0, 30) + '...');

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: '🧪 Teste de Notificação',
        body: 'Se você recebeu isso, as notificações push estão funcionando!',
        data: { type: 'test' },
        priority: 'high',
      }),
    });

    const result = await response.json();
    console.log('📬 Resposta:', JSON.stringify(result, null, 2));
    
    if (result.data) {
      const status = Array.isArray(result.data) ? result.data[0]?.status : result.data.status;
      if (status === 'ok') {
        console.log('✅ Notificação de teste enviada com sucesso!');
        console.log('💡 Feche o app completamente e aguarde alguns segundos para receber a notificação.');
      } else {
        console.log('❌ Erro ao enviar:', result.data);
      }
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para enviar notificação de nova mensagem
export async function sendMessageNotification(chatId, senderId, messageText) {
  try {
    // Busca informações do chat
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) return;

    const chatData = chatDoc.data();
    const users = chatData.users || [];
    
    // Encontra o destinatário (quem não é o remetente)
    const recipientId = users.find(uid => uid !== senderId);
    if (!recipientId) return;

    // Busca dados do remetente e destinatário
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    const recipientDoc = await getDoc(doc(db, 'users', recipientId));
    
    if (!senderDoc.exists() || !recipientDoc.exists()) return;

    const senderName = senderDoc.data().firstName || 'Alguém';
    const recipientToken = recipientDoc.data().pushToken;

    if (!recipientToken) {
      console.log('⚠️ Destinatário não tem pushToken:', recipientId);
      return;
    }

    console.log('📤 Enviando notificação de mensagem para:', recipientId);

    // Envia notificação
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientToken,
        sound: 'default',
        title: `💬 ${senderName}`,
        body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
        data: { type: 'message', chatId, senderId },
        priority: 'high',
      }),
    });

    const result = await response.json();
    if (result.data) {
      const status = Array.isArray(result.data) ? result.data[0]?.status : result.data.status;
      if (status === 'ok') {
        console.log('✅ Notificação de mensagem enviada!');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de mensagem:', error);
  }
}

export async function sendMatchNotification(otherUserId, otherName) {
  try {
    const otherDoc = await getDoc(doc(db, 'users', otherUserId));
    if (!otherDoc.exists()) {
      console.log('❌ Usuário não encontrado para notificação:', otherUserId);
      return;
    }

    const otherData = otherDoc.data();
    const pushToken = otherData.pushToken;

    if (!pushToken) {
      console.log('❌ Usuário não tem pushToken:', otherUserId);
      console.log('💡 Dica: O usuário precisa abrir o app pelo menos uma vez para registrar o token');
      return;
    }

    console.log('📤 Enviando notificação push para:', otherUserId);
    console.log('🔑 Token:', pushToken.substring(0, 30) + '...');

    // Envia notificação via Expo Push Notification API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
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
        priority: 'high',
      }),
    });

    const result = await response.json();
    console.log('📬 Resposta da API:', JSON.stringify(result, null, 2));
    
    if (result.data) {
      if (Array.isArray(result.data)) {
        const status = result.data[0]?.status;
        if (status === 'ok') {
          console.log('✅ Notificação enviada com sucesso!');
        } else {
          console.log('❌ Erro no envio:', result.data[0]);
        }
      } else if (result.data.status === 'ok') {
        console.log('✅ Notificação enviada com sucesso!');
      } else {
        console.log('❌ Erro na resposta da notificação:', result.data);
      }
    } else {
      console.log('❌ Resposta inesperada:', result);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    console.error('Detalhes do erro:', error.message);
  }
}

