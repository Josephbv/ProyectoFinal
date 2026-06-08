import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';


interface User {
  id_usuario: number;
  correo: string;
  nombre_usuario: string;
  id_rol: number;
  rol?: string;
  nombre_completo?: string;
  cedula?: string;
  id_cliente?: number;
  id_empleado?: number;
  modulos?: string[];
  ultimo_acceso?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const API_URL = '/api/auth';

interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  tipoDocumento: string;
  cedula: string;
  telefono: string;
  direccion: string;
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
          isAuthenticated: !!data.token && !data.mustChangePassword,
        };
      } catch {
        return { user: null, token: null, isAuthenticated: false };
      }
    }
    return { user: null, token: null, isAuthenticated: false };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthUpdate = () => {
      const saved = localStorage.getItem('kaivet_auth_data');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setAuthState({
            user: data.usuario,
            token: data.token,
            isAuthenticated: !!data.token && !data.mustChangePassword,
          });
        } catch (err) {
          console.error("Error al sincronizar auth state:", err);
        }
      } else {
        setAuthState({ user: null, token: null, isAuthenticated: false });
      }
    };

    window.addEventListener('kaivet-auth-update', handleAuthUpdate);
    return () => window.removeEventListener('kaivet-auth-update', handleAuthUpdate);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Correo: email,
          Contrasena: password,
          Email: email, // Fallback
          Password: password // Fallback
        }),
      });

      if (data && data.usuario) {
        // Normalizar rol a string (el backend puede devolver objeto o string)
        const rolRaw = data.usuario.rol;
        const rolStr: string = typeof rolRaw === 'string'
          ? rolRaw
          : (rolRaw as any)?.nombre_rol || (rolRaw as any)?.nombreRol || '';

        const rolLower = rolStr.toLowerCase();
        const isAdminRol = rolLower.includes('administrador') || rolLower.includes('admin') || data.usuario.id_rol === 2;
        const isVetRol = rolLower.includes('veterinario') || rolLower.includes('vet') || data.usuario.id_rol === 3;
        const isClienteRol = rolLower.includes('cliente') || data.usuario.id_rol === 4;

        // Módulos desde el objeto rol (si el backend los anida ahí)
        const modulosDesdeRol = typeof rolRaw === 'object' && rolRaw !== null
          ? ((rolRaw as any).modulos || (rolRaw as any).permisos || null)
          : null;

        const user: User = {
          id_usuario: data.usuario.id_usuario,
          correo: data.usuario.correo,
          nombre_usuario: data.usuario.nombre_usuario,
          nombre_completo: data.usuario.nombre_completo || data.usuario.nombreCompleto || data.usuario.nombre_usuario,
          id_rol: data.usuario.id_rol,
          rol: rolStr, // Siempre string normalizado
          cedula: data.usuario.cedula,
          id_cliente: data.usuario.id_cliente,
          id_empleado: data.usuario.id_empleado,
          // Detector robusto de módulos: API > objeto rol > fallback por nombre de rol
          modulos:
            data.usuario.modulos ||
            data.usuario.permisos ||
            modulosDesdeRol ||
            (isAdminRol
              ? ['Dashboard', 'Ventas', 'Agendamiento', 'Mascotas', 'Clientes', 'Servicios', 'Roles', 'Usuarios', 'Empleados', 'Horario', 'Historial Mascotas']
              : isVetRol
                ? ['Dashboard', 'Agendamiento', 'Mascotas', 'Historial Mascotas', 'Horario']
                : isClienteRol
                  ? ['Mascotas', 'Agendamiento', 'Historial Mascotas', 'Ventas']
                  : []),
          ultimo_acceso: new Date().toISOString()
        };

        const isTemp = password.startsWith('Temp-');
        const authPayload = {
          token: data.token || 'ok',
          usuario: user,
          mustChangePassword: isTemp ? true : undefined
        };

        localStorage.setItem('kaivet_auth_data', JSON.stringify(authPayload));
        setAuthState({ user, token: data.token || 'ok', isAuthenticated: !isTemp });
        window.dispatchEvent(new CustomEvent('kaivet-auth-update'));
        return { success: true, mustChangePassword: isTemp };
      }
      return { success: false, error: 'Respuesta inválida del servidor.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registro público desde la web.
   * IMPORTANTE: El rol siempre se fuerza a Cliente (IdRol=4).
   * La creación de administradores sólo está disponible desde el
   * panel interno de administración (módulo Configuración > Usuarios).
   */
  const register = useCallback(async (registerData: RegisterData) => {
    setLoading(true);
    try {
      // ⚠️ SEGURIDAD: IdRol e IdNombreRol están HARDCODEADOS a Cliente.
      // Nunca tomar estos valores del formulario ni de parámetros externos.
      const ROL_CLIENTE_ID = 4;
      const ROL_CLIENTE_NOMBRE = 'Cliente';

      const payload = {
        Nombre: registerData.nombre,           // ← campo que usa el backend para la tabla Clientes
        NombreUsuario: registerData.nombre,
        NombreCompleto: registerData.nombre,
        Correo: registerData.email,
        Email: registerData.email,
        Contrasena: registerData.password,
        Password: registerData.password,
        TipoDocumento: registerData.tipoDocumento,
        Cedula: registerData.cedula,
        Telefono: registerData.telefono,
        Direccion: registerData.direccion,
        // Rol forzado: SIEMPRE Cliente — no se puede cambiar desde el registro web
        IdRol: ROL_CLIENTE_ID,
        NombreRol: ROL_CLIENTE_NOMBRE,
      };

      const data = await apiFetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });



      return { success: true, data };
    } catch (error: any) {
      const raw: string = (error.message || '').toLowerCase();
      let friendlyError = error.message;

      if ((raw.includes('correo') || raw.includes('email') || raw.includes('mail')) &&
        (raw.includes('exist') || raw.includes('duplica') || raw.includes('registrado') || raw.includes('unique') || raw.includes('already')))
        friendlyError = 'duplicate_email';
      else if ((raw.includes('cedula') || raw.includes('documento') || raw.includes('identificaci')) &&
        (raw.includes('exist') || raw.includes('duplica') || raw.includes('registrado') || raw.includes('unique') || raw.includes('already')))
        friendlyError = 'duplicate_cedula';
      else if (raw.includes('unique') || raw.includes('duplica') || raw.includes('already exist'))
        friendlyError = 'duplicate_generic';

      return { success: false, error: friendlyError };
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Correo: email, Email: email }),
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
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
        body: JSON.stringify({
          Correo: email,
          Token: token,
          NuevaContrasena: newPassword,
          Password: newPassword
        }),
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kaivet_auth_data');
    setAuthState({ user: null, token: null, isAuthenticated: false });
    window.dispatchEvent(new CustomEvent('kaivet-auth-update'));
  }, []);

  const updateUser = useCallback((newData: Partial<User>) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...newData };
      localStorage.setItem('kaivet_auth_data', JSON.stringify({ token: prev.token, usuario: updatedUser }));

      // Emitir evento global para que otros componentes se sincronicen
      window.dispatchEvent(new CustomEvent('kaivet-auth-update'));

      return { ...prev, user: updatedUser };
    });
  }, []);

  return { ...authState, login, register, requestPasswordReset, resetPassword, logout, updateUser, loading };
}
