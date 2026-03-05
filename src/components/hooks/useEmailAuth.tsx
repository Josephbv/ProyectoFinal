import { useState, useCallback } from 'react';
import { apiFetch } from './apiFetch';

interface User {
  id_usuario: number;
  correo: string;
  nombre_usuario: string;
  id_rol: number;
  rol?: string;
  nombre_completo?: string;
  grupo_usuario?: string;
  permisos_especificos?: string;
  estado?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const API_URL = '/api/auth';

export function useEmailAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('kaivet_auth_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return {
          user: data.usuario,
          token: data.token,
          isAuthenticated: !!data.token,
        };
      } catch (e) {
        return { user: null, token: null, isAuthenticated: false };
      }
    }
    return { user: null, token: null, isAuthenticated: false };
  });

  const [loading, setLoading] = useState(false);

  const register = useCallback(async (userData: any): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const payload = {
        correo: userData.email,
        contrasena: userData.password,
        nombre_usuario: `${userData.nombre || ''} ${userData.apellido || ''}`.trim(),
        nombre_rol: userData.nombre_rol || 'cliente'
      };


      const data = await apiFetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      localStorage.setItem('kaivet_auth_data', JSON.stringify(data));
      setAuthState({
        user: data.usuario,
        token: data.token,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, contrasena: password }),
      });

      localStorage.setItem('kaivet_auth_data', JSON.stringify(data));
      setAuthState({
        user: data.usuario,
        token: data.token,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kaivet_auth_data');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; message?: string; error?: string; token?: string }> => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return { success: true, message: data.message, error: data.error, token: data.token };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, token: string, newPassword: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });
      return { success: true, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ...authState,
    loading,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword
  };
}
