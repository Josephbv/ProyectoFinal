import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

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
      const data: any[] = await apiFetch(API_URL);
      const mapped = (data || []).map((r: any) => ({
        ...r,
        id: (r.idRol || r.IdRol || r.id_rol || r.id)?.toString(),
        id_rol: r.idRol || r.IdRol || r.id_rol,
        nombre: r.nombreRol || r.NombreRol || r.nombre_rol || r.nombre || 'Sin nombre',
        activo: r.activo !== undefined ? r.activo : r.Activo,
        modulos: (r.modulos || (r.idPermisos || r.IdPermisos || [])
          .filter((p: any) => p !== null)
          .map((p: any) => p.nombreModulo || p.NombreModulo || p.descripcion || 'Módulo'))
      }));
      setRoles(mapped);
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
        body: JSON.stringify({
          Nombre: nuevoRol.nombre,
          Activo: nuevoRol.activo,
          Modulos: nuevoRol.modulos
        })
      });
      const mappedData = {
        ...data,
        id: (data.idRol || data.IdRol || data.id_rol || data.id)?.toString(),
        id_rol: data.idRol || data.IdRol || data.id_rol,
        nombre: data.nombreRol || data.NombreRol || data.nombre_rol || data.nombre || 'Sin nombre',
        activo: data.activo !== undefined ? data.activo : data.Activo,
        modulos: (data.modulos || (data.idPermisos || data.IdPermisos || [])
          .filter((p: any) => p !== null)
          .map((p: any) => p.nombreModulo || p.NombreModulo || p.descripcion || 'Módulo'))
      };
      setRoles(prev => [...prev, mappedData]);
      return { success: true, data: mappedData };
    } catch (error) {
      return { success: false, error: 'Error al crear rol' };
    } finally {
      setLoading(false);
    }
  };

  const actualizarRol = async (id: string, datosActualizados: Partial<Rol>) => {
    setLoading(true);
    try {
      const rolExistente = roles.find(r => r.id === id);
      const activo = datosActualizados.activo !== undefined ? datosActualizados.activo : (rolExistente ? rolExistente.activo : true);

      await apiFetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          IdRol: Number(id),
          Nombre: datosActualizados.nombre,
          Activo: activo,
          Modulos: datosActualizados.modulos
        })
      });
      setRoles(prev => prev.map(rol => rol.id === id ? { ...rol, ...datosActualizados, activo } : rol));
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
