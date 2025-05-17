
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { UserProfileData, UserRole } from '@/services/userService'; // UserRole might be needed if we store it separately
import { getUserDocument } from '@/services/userService';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserProfileData | null; // This will contain role based on fetched doc
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDataAndSetContext = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const profileData = await getUserDocument(firebaseUser.uid);
      setUserData(profileData); // profileData includes the 'role' field
    } else {
      setUserData(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      await fetchUserDataAndSetContext(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserDataAndSetContext]);

  const refreshUserData = useCallback(async () => {
    if (user) {
      setLoading(true);
      await fetchUserDataAndSetContext(user);
      setLoading(false);
    }
  }, [user, fetchUserDataAndSetContext]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
