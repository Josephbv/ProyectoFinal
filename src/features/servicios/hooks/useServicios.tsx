import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Servicio {
  id_servicio: number;
  nombre_servicio: string;
  precio: number;
  descripcion: string | null;
  // Campos mapeados para el frontend
  id?: number;
  nombre?: string;
  estado?: string;
}

const API_URL = '/api';

export function useServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarServicios = useCallback(async () => {
    setLoading(true);
    try {
      const data: any[] = await apiFetch(`${API_URL}/servicios`);
      const mapped = (data || []).map((s: any) => ({
        ...s,
        id_servicio: s.idServicio || s.IdServicio || s.id_servicio,
        nombre_servicio: s.nombreServicio || s.NombreServicio || s.nombre_servicio || s.nombre || s.Nombre,
        precio: s.precio || s.Precio,
        estado: s.estado || s.Estado || 'activo'
      }));
      setServicios(mapped);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarServicios(); }, [cargarServicios]);

  const agregarServicio = useCallback(async (servicioData: Partial<Servicio>) => {
    setLoading(true);
    try {
      const payload: any = {
        NombreServicio: servicioData.nombre_servicio || servicioData.nombre,
        Precio: servicioData.precio,
        Descripcion: servicioData.descripcion,
        Estado: servicioData.estado || 'activo',
      };
      const nuevo = await apiFetch(`${API_URL}/servicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const mapped = {
        ...nuevo,
        id_servicio: nuevo.idServicio || nuevo.IdServicio || nuevo.id_servicio,
        nombre_servicio: nuevo.nombreServicio || nuevo.NombreServicio || nuevo.nombre_servicio || nuevo.nombre
      };
      setServicios(prev => [mapped, ...prev]);
      return { success: true, data: mapped };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarServicio = useCallback(async (id: number, servicioData: Partial<Servicio>) => {
    setLoading(true);
    try {
      const payload: any = {
        IdServicio: id,
        NombreServicio: (servicioData as any).NombreServicio || servicioData.nombre_servicio || servicioData.nombre,
        Precio: (servicioData as any).Precio ?? servicioData.precio,
        Descripcion: (servicioData as any).Descripcion ?? servicioData.descripcion,
        Estado: (servicioData as any).Estado ?? servicioData.estado,
      };
      await apiFetch(`${API_URL}/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setServicios(prev => prev.map(s => s.id_servicio === id ? { ...s, nombre_servicio: payload.NombreServicio, precio: payload.Precio, descripcion: payload.Descripcion, estado: payload.Estado } : s));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarServicio = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/servicios/${id}`, { method: 'DELETE' });
      setServicios(prev => prev.filter(s => s.id_servicio !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarServicios = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    const mapService = (s: Servicio) => ({
      ...s,
      id: s.id_servicio,
      nombre: s.nombre_servicio
    });

    if (!q) return servicios.map(mapService);

    return servicios
      .filter(s =>
        s.nombre_servicio?.toLowerCase().includes(q) ||
        s.descripcion?.toLowerCase().includes(q)
      )
      .map(mapService);
  }, [servicios]);

  const obtenerEstadisticas = useCallback(() => {
    return {
      totalServicios: servicios.length,
      serviciosActivos: servicios.length, // Placeholder logic
      ingresosPotenciales: servicios.reduce((acc, s) => acc + Number(s.precio || 0), 0)
    };
  }, [servicios]);

  // Map servicios to include 'id' for compatibility with page components
  const serviciosConId = servicios.map(s => ({ ...s, id: s.id_servicio, nombre: s.nombre_servicio }));

  return {
    servicios: serviciosConId,
    loading,
    agregarServicio,
    actualizarServicio,
    eliminarServicio,
    buscarServicios,
    obtenerEstadisticas,
    recargarServicios: cargarServicios
  };
}
