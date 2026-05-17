import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, hasSession, clearClientSession, setCsrfToken, type UserOut } from '@/lib/api';
import { Profile, UserRole } from '@/types';

interface AuthContextType {
  /** Usuario autenticado (mismo objeto que `profile`). */
  user: Profile | null;
  /** Perfil del usuario (mismo objeto que `user`). */
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /** Truthy si hay sesión activa. */
  session: boolean;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => {
        setProfile(mapUserToProfile(user));
      })
      .catch(() => {
        clearClientSession();
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { csrf_token } = await authApi.login(email, password);
      setCsrfToken(csrf_token);
      const { user } = await authApi.me();
      setProfile(mapUserToProfile(user));
      return { error: null };
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const detail = error?.response?.data?.detail || error?.message || 'Error de autenticación';
      return { error: new Error(detail) };
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignorar — limpiamos el estado local igualmente
    }
    clearClientSession();
    setProfile(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        loading,
        signIn,
        signOut,
        session: profile !== null,
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
