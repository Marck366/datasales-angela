import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, getToken, setToken as persistToken, clearToken, type UserOut } from '@/lib/api';
import { Profile, UserRole } from '@/types';

interface AuthContextType {
  /** JWT en localStorage. `null` si no hay sesión. Sustituye al antiguo `session` de Supabase. */
  token: string | null;
  /** Usuario autenticado (mismo objeto que `profile`, mantenido para retrocompat). */
  user: Profile | null;
  /** Perfil del usuario (mismo objeto que `user`). */
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /** @deprecated mantenido por compat — el flag `session` actual mapea a `token`. */
  session: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUserToProfile = (u: UserOut): Profile => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: (u.role as UserRole) || 'comercial',
  avatar_color: u.avatar_color || 'gray',
  created_at: '',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => {
        setToken(stored);
        setProfile(mapUserToProfile(user));
      })
      .catch(() => {
        clearToken();
        setToken(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { access_token } = await authApi.login(email, password);
      persistToken(access_token);
      const { user } = await authApi.me();
      setToken(access_token);
      setProfile(mapUserToProfile(user));
      return { error: null };
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const detail = error?.response?.data?.detail || error?.message || 'Error de autenticación';
      return { error: new Error(detail) };
    }
  };

  const signOut = async () => {
    clearToken();
    setToken(null);
    setProfile(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user: profile,
        profile,
        loading,
        signIn,
        signOut,
        session: token, // compat: `session` truthy ↔ token presente
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
