import {
  loginWithEmail,
  logoutUser,
  registerWithEmail,
  sendPasswordReset,
  subscribeToAuthState,
  updateUserDisplayName,
} from "@/features/auth";
import type { MappedFirebaseUser } from "@/features/auth/mapFirebaseUser";
import { create } from "zustand";

interface AuthState {
  userId: string | null;
  email: string | null;
  username: string | null;
  isAuthReady: boolean;
  isLoading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  setSession: (user: MappedFirebaseUser | null) => void;
  setAuthReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  username: null,
  isAuthReady: false,
  isLoading: false,

  setSession: (user) =>
    set({
      userId: user?.userId ?? null,
      email: user?.email ?? null,
      username: user?.username ?? null,
    }),

  setAuthReady: (ready) => set({ isAuthReady: ready }),

  register: async (email, password, displayName) => {
    set({ isLoading: true });
    try {
      await registerWithEmail(email, password, displayName);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await loginWithEmail(email, password);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutUser();
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true });
    try {
      await sendPasswordReset(email);
    } finally {
      set({ isLoading: false });
    }
  },

  updateDisplayName: async (name) => {
    set({ isLoading: true });
    try {
      await updateUserDisplayName(name);
      const { userId, email } = useAuthStore.getState();
      if (userId) {
        set({ userId, email, username: name.trim() || null });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));

/** Sincroniza sessão Firebase → Zustand. Chamar no boot do app. */
export function initAuthListener(): () => void {
  try {
    return subscribeToAuthState((user) => {
      useAuthStore.getState().setSession(user);
      useAuthStore.getState().setAuthReady(true);
    });
  } catch (error) {
    console.error("[Auth] Falha ao iniciar listener:", error);
    useAuthStore.getState().setSession(null);
    useAuthStore.getState().setAuthReady(true);
    return () => {};
  }
}

export default useAuthStore;
