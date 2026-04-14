import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface VentaServicio {
  id_venta: number;
  id_servicio: number;
  cantidad: number | null;
  servicio?: any;
}

export interface Venta {
  id_venta: number;
  fecha: string | null;
  total: number | null;
  estado: 'aprobada' | 'anulada';
  id_cliente: number;
  cliente?: any;
  venta_servicios?: VentaServicio[];
  motivo_anulacion?: string;
}

const API_URL = '/api';

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    try {
      const data: Venta[] = await apiFetch(`${API_URL}/ventas`);
      // Enriquecer ventas anuladas con el motivo guardado localmente
      const enriched = (data || []).map(v => {
        if (v.estado === 'anulada') {
          const motivo = localStorage.getItem(`motivo_anulacion_${v.id_venta}`);
          return motivo ? { ...v, motivo_anulacion: motivo } : v;
        }
        return v;
      });
      setVentas(enriched);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarVentas(); }, [cargarVentas]);

  // Recarga automática cada 30 segundos para mantener el Dashboard actualizado
  useEffect(() => {
    const interval = setInterval(cargarVentas, 30000);
    return () => clearInterval(interval);
  }, [cargarVentas]);

  // Recarga al volver a la pestaña (ej: después de crear una venta)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') cargarVentas();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [cargarVentas]);

  const agregarVenta = useCallback(async (ventaData: any) => {
    setLoading(true);
    try {
      const nuevaVenta = await apiFetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData),
      });
      setVentas(prev => [...prev, nuevaVenta].sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      }));
      return { success: true, data: nuevaVenta };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al crear venta' };
    } finally {
      setLoading(false);
    }
  }, []);

  const anularVenta = useCallback(async (id: number, motivo: string) => {
    setLoading(true);
    try {
      const anulada = await apiFetch(`${API_URL}/ventas/anular/${id}`, { method: 'PATCH' });
      // Guardar el motivo localmente para mostrarlo en el detalle
      localStorage.setItem(`motivo_anulacion_${id}`, motivo);
      setVentas(prev => prev.map(v => v.id_venta === id ? { ...v, estado: 'anulada', motivo_anulacion: motivo } : v));
      return { success: true, data: anulada };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al anular venta' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { ventas, loading, crearVenta: agregarVenta, anularVenta, recargarVentas: cargarVentas };
}
