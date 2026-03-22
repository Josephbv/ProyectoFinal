import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from './apiFetch';

export interface AgendamientoServicio {
  id_agendamiento: number;
  id_servicio: number;
  servicio?: any;
}

export interface Agendamiento {
  id_agendamiento: number;
  fecha: string | null;
  hora: string | null;
  id_cliente: number;
  id_empleado: number;
  cliente?: any;
  empleado?: any;
  agendamiento_servicios?: AgendamientoServicio[];
  estado?: 'activa' | 'completada' | 'cancelada';
}

const API_URL = '/api';

export function useAgendamiento() {
  const [citas, setCitas] = useState<Agendamiento[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarCitas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/agendamiento`);
      setCitas(data || []);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  // Recarga automática cada 30 segundos
  useEffect(() => {
    const interval = setInterval(cargarCitas, 30000);
    return () => clearInterval(interval);
  }, [cargarCitas]);

  // Recarga al volver a la pestaña del navegador
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') cargarCitas();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [cargarCitas]);


  const agendarCita = useCallback(async (citaData: any) => {
    setLoading(true);
    try {
      const nuevaCita = await apiFetch(`${API_URL}/agendamiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...citaData, estado: 'activa' }),
      });
      setCitas(prev => [...prev, nuevaCita].sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      }));
      return { success: true, data: nuevaCita };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al crear cita' };
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarCita = useCallback(async (id: number, datosActualizados: any) => {
    setLoading(true);
    try {
      const citaActualizada = await apiFetch(`${API_URL}/agendamiento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados),
      });
      setCitas(prev => prev.map(c => c.id_agendamiento === id ? citaActualizada : c));
      return { success: true, data: citaActualizada };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al actualizar cita' };
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarCita = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/agendamiento/${id}`, { method: 'DELETE' });
      setCitas(prev => prev.filter(c => c.id_agendamiento !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al eliminar cita' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { citas, loading, agendarCita, actualizarCita, eliminarCita, recargarCitas: cargarCitas };
}
