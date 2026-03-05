import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './apiFetch';

export interface Rol {
  id: string; // Keep abstract ID for UI compatibility
  id_rol?: number; // DB matched id
  nombre: string;
  nombre_rol?: string; // DB matched nombre
  modulos: string[];
  activo: boolean;
  fechaModificacion: string;
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const API_URL = '/api/roles';

  const cargarRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(API_URL);
      setRoles(data || []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarRoles();
  }, [cargarRoles]);

  const crearRol = async (nuevoRol: Omit<Rol, 'id' | 'fechaModificacion'>) => {
    setLoading(true);
    try {
      const data = await apiFetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRol)
      });
      setRoles(prev => [...prev, data]);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al crear rol' };
    } finally {
      setLoading(false);
    }
  };

  const actualizarRol = async (id: string, datosActualizados: Partial<Rol>) => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });
      setRoles(prev => prev.map(rol => rol.id === id ? { ...rol, ...data } : rol));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al actualizar rol' };
    } finally {
      setLoading(false);
    }
  };

  const eliminarRol = async (id: string) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setRoles(prev => prev.filter(rol => rol.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar rol' };
    } finally {
      setLoading(false);
    }
  };

  const obtenerRolPorId = (id: string): Rol | undefined => {
    return roles.find(rol => rol.id === id);
  };

  const toggleActivoRol = async (id: string) => {
    const rol = obtenerRolPorId(id);
    if (rol) {
      if (rol.nombre === 'Administrador' && rol.activo) {
        return { success: false, error: 'No se puede desactivar el rol de Administrador' };
      }
      return await actualizarRol(id, { activo: !rol.activo });
    }
    return { success: false, error: 'Rol no encontrado' };
  };

  return {
    roles,
    loading,
    crearRol,
    actualizarRol,
    eliminarRol,
    obtenerRolPorId,
    toggleActivoRol,
    cargarRoles
  };
};
