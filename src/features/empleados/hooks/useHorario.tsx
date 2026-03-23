import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Horario {
  id_horario: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  id_empleado: number;
  disponible?: boolean;
  empleado?: any;
}

const API_URL = '/api';

export function useHorario() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarHorarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/horarios`);
      setHorarios(data || []);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarHorarios(); }, [cargarHorarios]);

  const crearHorario = useCallback(async (horarioData: Partial<Horario>) => {
    setLoading(true);
    try {
      const nuevo = await apiFetch(`${API_URL}/horarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horarioData),
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
      const actualizado = await apiFetch(`${API_URL}/horarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horarioData),
      });
      setHorarios(prev => prev.map(h => h.id_horario === id ? actualizado : h));
      return { success: true, data: actualizado };
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
