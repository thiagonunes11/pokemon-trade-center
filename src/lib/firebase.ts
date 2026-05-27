import { Platform } from "react-native";
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

function resolveFirebaseConfig() {
  const common = {
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };

  if (Platform.OS === "ios") {
    return {
      ...common,
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_IOS,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_IOS,
    };
  }

  if (Platform.OS === "android") {
    return {
      ...common,
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID,
    };
  }

  // Web / fallback — usa chaves Android ou legado EXPO_PUBLIC_FIREBASE_API_KEY
  return {
    ...common,
    apiKey:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID ??
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    appId:
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID ??
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

const firebaseConfig = resolveFirebaseConfig();

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase não configurado. Copie .env.example para .env e preencha EXPO_PUBLIC_FIREBASE_*.",
    );
  }
  if (appInstance) return appInstance;
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return appInstance;
}

/**
 * Auth Firebase (SDK JS). Arquivos nativos google-services.json / GoogleService-Info.plist
 * são aplicados pelo Expo no prebuild; não é necessário Swift Package Manager no Xcode.
 */
export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase não configurado. Veja .env.example e README (Firebase).",
    );
  }
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}
