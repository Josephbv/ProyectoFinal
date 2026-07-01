import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';
import { useEmailAuth } from '../../auth/hooks/useEmailAuth';
import { cleanCedula } from '../../../shared/components/utils';

export interface AgendamientoServicio {
  id_agendamiento: number;
  id_servicio: number;
  realizado?: boolean;
  servicio?: any;
}

export interface Agendamiento {
  id_agendamiento: number;
  fecha: string | null;
  hora: string | null;
  id_cliente: number;
  id_mascota?: number;
  id_empleado: number;
  cliente?: any;
  empleado?: any;
  mascota?: any;
  agendamiento_servicios?: AgendamientoServicio[];
  estado?: 'activa' | 'completada' | 'cancelada';
}

const API_URL = '/api';

export function useAgendamiento() {
  const [citas, setCitas] = useState<Agendamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useEmailAuth();

  const cargarCitas = useCallback(async () => {
    setLoading(true);
    try {
      const data: any[] = await apiFetch(`${API_URL}/agendamiento`);
      let mapped = (data || []).map((a: any) => {
        const id = a.idAgendamiento || a.IdAgendamiento || a.id_agendamiento;
        const storedMascota = localStorage.getItem(`cita_mascota_${id}`);
        return {
          ...a,
          id_agendamiento: id,
          id_cliente: a.idCliente || a.IdCliente || a.id_cliente,
          id_mascota: storedMascota ? Number(storedMascota) : (a.idMascota || a.IdMascota || a.id_mascota),
          id_empleado: a.idEmpleado || a.IdEmpleado || a.id_empleado,
          fecha: (() => {
            const raw = a.fecha || a.Fecha;
            if (!raw) return null;
            // If it has a T separator, take only the date part
            if (typeof raw === 'string' && raw.includes('T')) return raw.split('T')[0];
            // If it looks like a full date-time with space, take only the date
            if (typeof raw === 'string' && raw.includes(' ')) return raw.split(' ')[0];
            return raw;
          })(),
          hora: a.hora || a.Hora,
          estado: a.estado || a.Estado,
          cliente: (() => {
            const rawCli = a.cliente || (a.idClienteNavigation || a.IdClienteNavigation ? {
              id_cliente: (a.idClienteNavigation || a.IdClienteNavigation).idCliente || (a.idClienteNavigation || a.IdClienteNavigation).IdCliente,
              nombre: (a.idClienteNavigation || a.IdClienteNavigation).nombre || (a.idClienteNavigation || a.IdClienteNavigation).Nombre,
              cedula: (a.idClienteNavigation || a.IdClienteNavigation).cedula || (a.idClienteNavigation || a.IdClienteNavigation).Cedula
            } : undefined);
            if (!rawCli) return undefined;
            return {
              id_cliente: rawCli.id_cliente || rawCli.idCliente || rawCli.IdCliente,
              nombre: rawCli.nombre || rawCli.Nombre,
              cedula: cleanCedula(rawCli.cedula || rawCli.Cedula)
            };
          })(),
          empleado: a.empleado || (a.idEmpleadoNavigation || a.IdEmpleadoNavigation ? {
            id_empleado: (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).idEmpleado || (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).IdEmpleado,
            nombre: (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).nombre || (a.idEmpleadoNavigation || a.IdEmpleadoNavigation).Nombre
          } : undefined),
          mascota: a.mascota || (a.idMascotaNavigation || a.IdMascotaNavigation ? {
            id_mascota: (a.idMascotaNavigation || a.IdMascotaNavigation).idMascota || (a.idMascotaNavigation || a.IdMascotaNavigation).IdMascota,
            nombre_mascota: (a.idMascotaNavigation || a.IdMascotaNavigation).nombreMascota || (a.idMascotaNavigation || a.IdMascotaNavigation).NombreMascota
          } : undefined),
          agendamiento_servicios: a.agendamiento_servicios || (a.idServicios || a.IdServicios ? (a.idServicios || a.IdServicios)
            .filter((s: any) => s !== null)
            .map((s: any) => ({
              id_servicio: s.idServicio || s.IdServicio,
              nombre: s.nombreServicio || s.NombreServicio
            })) : [])
        };
      });

      // Filtrar por cliente si el rol es Cliente
      if (user?.rol?.toLowerCase().includes('cliente') && user?.id_cliente) {
        mapped = mapped.filter(c => c.id_cliente === user.id_cliente);
      }

      setCitas(mapped);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      const payload: any = {
        Fecha: citaData.fecha ? citaData.fecha.split('T')[0] : null,
        Hora: citaData.hora ? (citaData.hora.length === 5 ? `${citaData.hora}:00` : citaData.hora) : null,
        IdCliente: Number(citaData.id_cliente),
        IdEmpleado: Number(citaData.id_empleado),
        IdMascota: citaData.id_mascota ? Number(citaData.id_mascota) : null,
        Estado: 'activa',
        // Services are sent as a separate array of IDs for the many-to-many relation
        IdServicios: citaData.agendamiento_servicios?.map((s: any) => ({ IdServicio: Number(s.id_servicio) })) || [],
      };
      const nuevaCita = await apiFetch(`${API_URL}/agendamiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const id = nuevaCita.idAgendamiento || nuevaCita.IdAgendamiento || nuevaCita.id_agendamiento;
      if (id && citaData.id_mascota) {
        localStorage.setItem(`cita_mascota_${id}`, citaData.id_mascota.toString());
      }

      const mappedNueva = {
        ...nuevaCita,
        id_agendamiento: id,
        id_cliente: nuevaCita.idCliente || nuevaCita.IdCliente || nuevaCita.id_cliente || Number(citaData.id_cliente),
        id_mascota: Number(citaData.id_mascota),
        id_empleado: nuevaCita.idEmpleado || nuevaCita.IdEmpleado || nuevaCita.id_empleado || Number(citaData.id_empleado),
        fecha: nuevaCita.fecha || nuevaCita.Fecha || citaData.fecha,
        hora: nuevaCita.hora || nuevaCita.Hora || citaData.hora,
        estado: nuevaCita.estado || nuevaCita.Estado || 'activa',
        agendamiento_servicios: citaData.agendamiento_servicios || []
      };

      setCitas(prev => [...prev, mappedNueva].sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      }));
      return { success: true, data: mappedNueva };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al crear cita' };
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarCita = useCallback(async (id: number, datosActualizados: any) => {
    setLoading(true);
    try {
      const payload: any = {
        IdAgendamiento: Number(id),
        Fecha: datosActualizados.fecha ? datosActualizados.fecha.split('T')[0] : null,
        Hora: datosActualizados.hora ? (datosActualizados.hora.length === 5 ? `${datosActualizados.hora}:00` : datosActualizados.hora) : null,
        IdCliente: Number(datosActualizados.id_cliente),
        IdEmpleado: Number(datosActualizados.id_empleado),
        IdMascota: datosActualizados.id_mascota ? Number(datosActualizados.id_mascota) : null,
        Estado: datosActualizados.estado || 'activa',
        IdServicios: datosActualizados.agendamiento_servicios?.map((s: any) => ({ IdServicio: Number(s.id_servicio) })) || [],
      };
      const citaActualizada = await apiFetch(`${API_URL}/agendamiento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (datosActualizados.id_mascota) {
        localStorage.setItem(`cita_mascota_${id}`, datosActualizados.id_mascota.toString());
      }

      setCitas(prev => prev.map(c => c.id_agendamiento === id ? { ...c, ...datosActualizados } : c));
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
      localStorage.removeItem(`cita_mascota_${id}`);
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
