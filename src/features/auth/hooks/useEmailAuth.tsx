import { useState, useCallback } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

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
  modulos?: string[];
  id_cliente?: number;
  id_empleado?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const API_URL = '/api/auth';
const ROLES_URL = '/api/roles';

// All modules available in the sidebar
const ALL_MODULES = [
  'Dashboard', 'Ventas', 'Clientes', 'Agendamiento',
  'Mascotas', 'Historial Mascotas', 'Horario', 'Servicios',
  'Empleados', 'Roles', 'Usuarios'
];

// Fetch modules for a given role name from the backend
async function fetchModulosForRol(rolName: string): Promise<string[]> {
  try {
    if (!rolName) return [];
    // Siempre consultar al backend para tener la lista real del rol
    const data = await apiFetch(`${ROLES_URL}/by-name/${encodeURIComponent(rolName)}`);
    return data.modulos || [];
  } catch {
    return [];
  }
}

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
        nombre_usuario: userData.nombre?.trim(),
        nombre_rol: userData.nombre_rol || 'cliente',
        telefono: userData.telefono,
        direccion: userData.direccion,
        cedula: userData.cedula,
        tipoDocumento: userData.tipoDocumento
      };

      const data = await apiFetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Fetch modules for the role
      const rolName = data.usuario?.rol || payload.nombre_rol || 'cliente';
      const modulos = await fetchModulosForRol(rolName);
      const usuarioConModulos = { ...data.usuario, modulos };

      localStorage.setItem('kaivet_auth_data', JSON.stringify({ ...data, usuario: usuarioConModulos }));
      setAuthState({
        user: usuarioConModulos,
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

      // Fetch modules for the role
      const rolName = data.usuario?.rol || '';
      const modulos = await fetchModulosForRol(rolName);
      const usuarioConModulos = { ...data.usuario, modulos };

      localStorage.setItem('kaivet_auth_data', JSON.stringify({ ...data, usuario: usuarioConModulos }));
      setAuthState({
        user: usuarioConModulos,
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
