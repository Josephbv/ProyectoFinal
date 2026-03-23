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
      const data = await apiFetch(`${API_URL}/users`);
      setUsuarios(data || []);
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
