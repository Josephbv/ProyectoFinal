import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Horario {
  id_horario: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  id_empleado: number;
  disponible?: boolean;
  observaciones?: string;
  empleado?: any;
  // Propiedades Virtuales para Gestión Avanzada
  es_rotativo?: boolean;
  tipo_turno?: 'mañana' | 'tarde' | 'integral' | 'nocturno';
  horas_laboradas?: number;
}

const API_URL = '/api';

export function useHorario() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarHorarios = useCallback(async () => {
    setLoading(true);
    try {
      const data: any[] = await apiFetch(`${API_URL}/horarios`);
      if (!data) {
        setHorarios([]);
        setLoading(false);
        return;
      }
      const mapped = data.map((h: any) => {
        const start = h.horaInicio || h.HoraInicio || h.hora_inicio;
        const end = h.horaFin || h.HoraFin || h.hora_fin;

        // Cálculo de horas laboradas
        let horas = 0;
        if (start && end) {
          const [h1, m1] = start.split(':').map(Number);
          const [h2, m2] = end.split(':').map(Number);
          horas = (h2 + m2 / 60) - (h1 + m1 / 60);
          if (horas < 0) horas += 24; // Cruce de medianoche
        }

        return {
          ...h,
          id_horario: h.idHorario || h.IdHorario || h.id_horario,
          dia_semana: h.diaSemana || h.DiaSemana || h.dia_semana,
          hora_inicio: start,
          hora_fin: end,
          id_empleado: h.idEmpleado || h.IdEmpleado || h.id_empleado,
          disponible: h.disponible !== undefined ? h.disponible : h.Disponible,
          horas_laboradas: Number(horas.toFixed(2)),
          tipo_turno: horas > 8 ? 'integral' : (parseInt(start) < 12 ? 'mañana' : 'tarde'),
          es_rotativo: horas > 0 && horas < 6, // Un turno corto se considera rotativo/refuerzo
          empleado: h.empleado || (h.idEmpleadoNavigation || h.IdEmpleadoNavigation ? {
            id_empleado: (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).idEmpleado || (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).IdEmpleado,
            nombre: (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).nombre || (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).Nombre,
            cedula: (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).cedula || (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).Cedula,
            cargo: (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).cargo || (h.idEmpleadoNavigation || h.IdEmpleadoNavigation).Cargo
          } : undefined)
        };
      });
      setHorarios(mapped);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarHorarios(); }, [cargarHorarios]);

  const crearHorario = useCallback(async (horarioData: Partial<Horario>) => {
    setLoading(true);
    try {
      const payload: any = {
        IdEmpleado: horarioData.id_empleado,
        DiaSemana: horarioData.dia_semana,
        HoraInicio: horarioData.hora_inicio?.length === 5 ? `${horarioData.hora_inicio}:00` : horarioData.hora_inicio,
        HoraFin: horarioData.hora_fin?.length === 5 ? `${horarioData.hora_fin}:00` : horarioData.hora_fin,
        Disponible: horarioData.disponible,
      };
      const nuevo = await apiFetch(`${API_URL}/horarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setHorarios(prev => [nuevo, ...prev]);
      return { success: true, data: nuevo };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarHorario = useCallback(async (id: number, horarioData: Partial<Horario>) => {
    setLoading(true);
    try {
      const payload: any = {
        IdHorario: id,
        IdEmpleado: horarioData.id_empleado,
        DiaSemana: horarioData.dia_semana,
        HoraInicio: horarioData.hora_inicio?.length === 5 ? `${horarioData.hora_inicio}:00` : horarioData.hora_inicio,
        HoraFin: horarioData.hora_fin?.length === 5 ? `${horarioData.hora_fin}:00` : horarioData.hora_fin,
        Disponible: horarioData.disponible,
      };
      await apiFetch(`${API_URL}/horarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setHorarios(prev => prev.map(h => h.id_horario === id ? { ...h, ...horarioData } : h));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarHorario = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/horarios/${id}`, { method: 'DELETE' });
      setHorarios(prev => prev.filter(h => h.id_horario !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { horarios, loading, crearHorario, actualizarHorario, eliminarHorario, recargarHorarios: cargarHorarios };
}
