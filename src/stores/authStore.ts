import { create } from 'zustand';
import type { User } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // State
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,

  // Actions
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    }),
}));
