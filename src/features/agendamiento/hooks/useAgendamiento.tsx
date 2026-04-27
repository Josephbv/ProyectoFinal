import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

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
      const data: any[] = await apiFetch(`${API_URL}/agendamiento`);
      const mapped = (data || []).map((a: any) => ({
        ...a,
        id_agendamiento: a.idAgendamiento || a.IdAgendamiento || a.id_agendamiento,
        id_cliente: a.idCliente || a.IdCliente || a.id_cliente,
        id_empleado: a.idEmpleado || a.IdEmpleado || a.id_empleado,
        fecha: a.fecha || a.Fecha,
        hora: a.hora || a.Hora,
        estado: a.estado || a.Estado,
        cliente: a.cliente || (a.idClienteNavigation || a.IdClienteNavigation ? {
          id_cliente: (a.idClienteNavigation || a.IdClienteNavigation).idCliente || (a.idClienteNavigation || a.IdClienteNavigation).IdCliente,
          nombre: (a.idClienteNavigation || a.IdClienteNavigation).nombre || (a.idClienteNavigation || a.IdClienteNavigation).Nombre,
          cedula: (a.idClienteNavigation || a.IdClienteNavigation).cedula || (a.idClienteNavigation || a.IdClienteNavigation).Cedula
        } : undefined),
        empleado: a.empleado || (a.idEmpleadoNavigation || a.IdEmpleadoNavigation ? {
          id_empleado: (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).idEmpleado || (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).IdEmpleado,
          nombre: (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).nombre || (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).Nombre
        } : undefined),
        agendamiento_servicios: a.agendamiento_servicios || (a.idServicios || a.IdServicios ? (a.idServicios || a.IdServicios)
          .filter((s: any) => s !== null)
          .map((s: any) => ({
            id_servicio: s.idServicio || s.IdServicio,
            nombre: s.nombreServicio || s.NombreServicio
          })) : [])
      }));
      setCitas(mapped);
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
