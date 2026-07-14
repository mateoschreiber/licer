import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { api } from '../api/client';
import { UserSession } from '../types';

interface LoginResponse {
  accessToken: string;
  user: UserSession;
}

interface AuthContextValue {
  user: UserSession | null;
  login: (email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser() {
  const raw = window.localStorage.getItem('user_session');
  return raw ? (JSON.parse(raw) as UserSession) : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserSession | null>(() => loadUser());

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    window.localStorage.setItem('access_token', response.accessToken);
    window.localStorage.setItem('user_session', JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      window.localStorage.removeItem('access_token');
      window.localStorage.removeItem('user_session');
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, mustChangePassword: false };
      window.localStorage.setItem('user_session', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const hasRole = useCallback(
    (roles: string[]) => {
      if (!roles.length) {
        return true;
      }
      if (user?.roles.includes('ADMIN')) {
        return true;
      }
      return Boolean(user?.roles.some((role) => roles.includes(role)));
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, login, changePassword, logout, hasRole }),
    [user, login, changePassword, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
