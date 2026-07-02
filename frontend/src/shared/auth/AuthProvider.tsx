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
    () => ({ user, login, logout, hasRole }),
    [user, login, logout, hasRole],
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
