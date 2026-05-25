import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/safeStorage';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AuthState {
  userId?: string | null;
  username?: string | null;
  login: (username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      login: (username: string) => {
        const id = uuidv4();
        set({ userId: id, username });
      },
      logout: () => set({ userId: null, username: null }),
    }),
    {
      name: 'ptc-auth-storage',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

export default useAuthStore;
