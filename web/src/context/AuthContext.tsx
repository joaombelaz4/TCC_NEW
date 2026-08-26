import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken, ApiError } from '../lib/api';
import type { User } from '../lib/types';

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Como não existe uma rota "quem sou eu" ainda, guardamos o usuário retornado
// no login/cadastro junto com o token, e restauramos os dois do localStorage.
const USER_KEY = 'aquamonitor.user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  function persistSession(res: AuthResponse) {
    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    persistSession(res);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
    persistSession(res);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

export { ApiError };
