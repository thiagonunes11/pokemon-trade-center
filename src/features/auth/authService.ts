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

    await updateProfile(user, { displayName: name.trim() });
    await user.reload();
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
