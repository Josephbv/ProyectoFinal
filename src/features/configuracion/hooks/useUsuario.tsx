import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Usuario {
  id_usuario: number;
  correo: string;
  nombre_usuario: string;
  id_rol: number;
  roles?: {
    id_rol: number;
    nombre_rol: string;
  };
}

const API_URL = '/api/auth';

export function useUsuario() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data: any[] = await apiFetch(`${API_URL}/users`);
      const mapped = (data || []).map((u: any) => ({
        ...u,
        id_usuario: u.idUsuario || u.IdUsuario || u.id_usuario,
        nombre_usuario: u.nombreUsuario || u.NombreUsuario || u.nombre_usuario,
        nombre_completo: u.nombreCompleto || u.NombreCompleto || u.nombre_completo,
        id_rol: u.idRol || u.IdRol || u.id_rol,
        roles: u.roles || (u.idRolNavigation || u.IdRolNavigation ? {
          id_rol: (u.idRolNavigation || u.IdRolNavigation).idRol || (u.idRolNavigation || u.IdRolNavigation).IdRol,
          nombre_rol: (u.idRolNavigation || u.IdRolNavigation).nombreRol || (u.idRolNavigation || u.IdRolNavigation).NombreRol
        } : undefined)
      }));
      setUsuarios(mapped);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  const actualizarUsuario = useCallback(async (id: number, userData: any) => {
    setLoading(true);
    try {
      const actualizado = await apiFetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      setUsuarios(prev => prev.map(u => u.id_usuario === id ? actualizado : u));
      return { success: true, data: actualizado };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarUsuario = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
      setUsuarios(prev => prev.filter(u => u.id_usuario !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { usuarios, loading, actualizarUsuario, eliminarUsuario, recargarUsuarios: cargarUsuarios };
}
