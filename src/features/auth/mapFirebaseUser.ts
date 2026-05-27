import type { User } from "firebase/auth";

export interface MappedFirebaseUser {
  userId: string;
  email: string | null;
  username: string | null;
}

export function mapFirebaseUser(user: User): MappedFirebaseUser {
  return {
    userId: user.uid,
    email: user.email,
    username: user.displayName,
  };
}
