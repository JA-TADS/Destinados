import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Carrega configuração do arquivo ignorado pelo Git
let firebaseConfig;
try {
  firebaseConfig = require("../../config/firebaseConfig.json");
} catch (e) {
  // Fallback: tenta variáveis de ambiente (se configuradas)
  firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };
}

// Inicializa o app apenas se ainda não foi inicializado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializa Auth para React Native/Expo
// Para React Native, precisamos usar initializeAuth com getReactNativePersistence
// Isso garante que o componente auth seja registrado corretamente
let auth;

// Sempre tenta initializeAuth com persistência (necessário para React Native)
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Se já foi inicializado, obtém a instância existente
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    // Para outros erros, tenta getAuth como fallback
    try {
      auth = getAuth(app);
    } catch (getAuthError) {
      // Se ambos falharem, relança o erro de inicialização
      console.error('Erro ao inicializar Firebase Auth:', error);
      throw error;
    }
  }
}

export { auth };
export const db = getFirestore(app);


