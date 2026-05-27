import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getAuthErrorMessage } from "./authErrors";
import { mapFirebaseUser, type MappedFirebaseUser } from "./mapFirebaseUser";
import { createUserProfile, updateUserProfile } from "./userProfileService";

function rethrowAuthError(error: unknown): never {
  throw new Error(getAuthErrorMessage(error));
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<MappedFirebaseUser> {
  try {
    const auth = getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    const trimmedName = displayName.trim();
    if (trimmedName) {
      await updateProfile(credential.user, { displayName: trimmedName });
      await credential.user.reload();
    }

    // Criar perfil no Firestore (não bloqueia auth se falhar)
    try {
      await createUserProfile(credential.user);
    } catch (firestoreError) {
      console.warn("[Auth] Falha ao criar perfil no Firestore:", firestoreError);
    }

    return mapFirebaseUser(credential.user);
  } catch (error) {
    rethrowAuthError(error);
  }
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<MappedFirebaseUser> {
  try {
    const auth = getFirebaseAuth();
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    return mapFirebaseUser(credential.user);
  } catch (error) {
    rethrowAuthError(error);
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } catch (error) {
    rethrowAuthError(error);
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  } catch (error) {
    rethrowAuthError(error);
  }
}

export async function updateUserDisplayName(name: string): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) {
      throw Object.assign(new Error("Você precisa estar conectado."), {
        code: "auth/not-authenticated",
      });
    }

    const trimmed = name.trim();
    await updateProfile(user, { displayName: trimmed });
    await user.reload();

    // Espelhar no Firestore (não bloqueia se falhar)
    try {
      await updateUserProfile(user.uid, { displayName: trimmed });
    } catch (firestoreError) {
      console.warn("[Auth] Falha ao atualizar perfil no Firestore, tentando criar perfil legado:", firestoreError);
      try {
        await createUserProfile(user);
      } catch (createError) {
        console.warn("[Auth] Falha crítica ao criar perfil legado no Firestore:", createError);
      }
    }
  } catch (error) {
    rethrowAuthError(error);
  }
}

export function subscribeToAuthState(
  callback: (user: MappedFirebaseUser | null) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(getFirebaseAuth(), (user: User | null) => {
    callback(user ? mapFirebaseUser(user) : null);
  });
}
