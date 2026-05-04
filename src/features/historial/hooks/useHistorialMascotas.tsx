import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface HistorialMascota {
  id_historial: number;
  id: number; // Alias to support both
  fecha: string;
  hora?: string;
  tipoVisita: string[];
  veterinario: string;
  motivoConsulta: string;
  descripcion: string;
  sintomas?: string[];
  diagnostico: string | null;
  tratamiento: string | null;
  medicamentos?: any[];
  examenes?: any[];
  peso: number;
  temperatura: number;
  frecuenciaCardiaca: number;
  frecuenciaRespiratoria: number;
  estado: string;
  proximaCita?: string;
  observaciones?: string;
  costo?: number;
  vacunasAplicadas?: string[];
  receta?: string;
  id_mascota: number;
  mascotaId: number; // Alias to support both
  nombreMascota: string;
  nombreCliente: string;
  cedulaCliente?: string;
  mascota?: any;
  avanceCitas?: any;
}

const API_BASE = '/api';

export function useHistorialMascotas() {
  const [historiales, setHistoriales] = useState<HistorialMascota[]>([]);
  const [loading, setLoading] = useState(true);

  const mapHistorial = useCallback((h: any) => {
    if (!h) return {} as HistorialMascota;

    const safeParse = (str: any, fallback: any = []) => {
      if (!str || typeof str !== 'string' || str.trim() === '') return fallback;
      try {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'string' && parsed.startsWith('[')) {
          return JSON.parse(parsed);
        }
        return parsed;
      } catch (e) {
        return fallback;
      }
    };

    try {
      let tipoVisitaArr = [];
      if (typeof h.tipoVisita === 'string') {
        const clean = h.tipoVisita.trim();
        if (clean.startsWith('[') && clean.endsWith(']')) {
          tipoVisitaArr = safeParse(clean, []);
        } else {
          tipoVisitaArr = [clean];
        }
      } else if (Array.isArray(h.tipoVisita)) {
        tipoVisitaArr = h.tipoVisita;
      } else {
        tipoVisitaArr = h.tipoVisita ? [h.tipoVisita] : ['consulta'];
      }

      // Limpiar corchetes y comillas accidentales
      tipoVisitaArr = Array.isArray(tipoVisitaArr)
        ? tipoVisitaArr.map(t => String(t).replace(/[\[\]"]/g, '').trim()).filter(Boolean)
        : ['consulta'];

      if (tipoVisitaArr.length === 0) tipoVisitaArr = ['consulta'];

      return {
        ...h,
        id: h.idHistorial || h.IdHistorial || h.id_historial,
        id_historial: h.idHistorial || h.IdHistorial || h.id_historial,
        mascotaId: h.idMascota || h.IdMascota || h.id_mascota,
        id_mascota: h.idMascota || h.IdMascota || h.id_mascota,
        nombreMascota: h.idMascotaNavigation?.nombre || h.IdMascotaNavigation?.Nombre || h.mascota?.nombre || h.nombreMascota || 'Mascota',
        nombreCliente: h.idMascotaNavigation?.idClienteNavigation?.nombre || h.IdMascotaNavigation?.IdClienteNavigation?.Nombre || h.mascota?.cliente?.nombre || h.nombreCliente || 'Cliente',
        cedulaCliente: h.idMascotaNavigation?.idClienteNavigation?.cedula || h.IdMascotaNavigation?.IdClienteNavigation?.Cedula || h.mascota?.cliente?.cedula || h.cedulaCliente || '',
        descripcion: h.motivoConsulta || h.descripcion || 'Consulta Médica',
        tipoVisita: tipoVisitaArr,
        sintomas: safeParse(h.sintomas, []),
        medicamentos: safeParse(h.medicamentos, []),
        examenes: safeParse(h.examenes, []),
        vacunasAplicadas: safeParse(h.vacunasAplicadas, [])
      };
    } catch (criticalError) {
      console.error('[mapHistorial] Error fatal:', criticalError);
      return { ...h, id: h?.id_historial, tipoVisita: ['consulta'] } as HistorialMascota;
    }
  }, []);

  const cargarHistoriales = useCallback(async (id_mascota?: number) => {
    setLoading(true);
    try {
      let url = id_mascota ? `${API_BASE}/historial/mascota/${id_mascota}` : `${API_BASE}/historial`;
      console.log(`[DEBUG] Intentando cargar historiales desde: ${url}`);

      const data = await apiFetch(url);

      console.log(`[DEBUG] Datos recibidos:`, data);
      const mappedData = (data || []).map(mapHistorial);
      setHistoriales(mappedData);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarHistoriales(); }, [cargarHistoriales]);

  // Recarga al volver a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') cargarHistoriales();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [cargarHistoriales]);


  const crearEntradaHistorial = useCallback(async (entradaData: Partial<HistorialMascota>) => {
    setLoading(true);
    try {
      const payload: any = {
        IdMascota: Number(entradaData.id_mascota || (entradaData as any).mascotaId),
        Fecha: entradaData.fecha ? entradaData.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
        Hora: (entradaData as any).hora || new Date().toTimeString().slice(0, 5),
        TipoVisita: Array.isArray(entradaData.tipoVisita) ? JSON.stringify(entradaData.tipoVisita) : entradaData.tipoVisita,
        Veterinario: (entradaData as any).veterinario,
        MotivoConsulta: (entradaData as any).motivoConsulta,
        Sintomas: typeof entradaData.sintomas === 'string' ? entradaData.sintomas : JSON.stringify(entradaData.sintomas),
        Diagnostico: entradaData.diagnostico,
        Tratamiento: entradaData.tratamiento,
        Medicamentos: typeof entradaData.medicamentos === 'string' ? entradaData.medicamentos : JSON.stringify(entradaData.medicamentos),
        Examenes: typeof entradaData.examenes === 'string' ? entradaData.examenes : JSON.stringify(entradaData.examenes),
        Peso: (entradaData as any).peso ? Number((entradaData as any).peso) : null,
        Temperatura: (entradaData as any).temperatura ? Number((entradaData as any).temperatura) : null,
        FrecuenciaCardiaca: (entradaData as any).frecuenciaCardiaca ? parseInt((entradaData as any).frecuenciaCardiaca) : null,
        FrecuenciaRespiratoria: (entradaData as any).frecuenciaRespiratoria ? parseInt((entradaData as any).frecuenciaRespiratoria) : null,
        ProximaCita: (entradaData as any).proximaCita ? (entradaData as any).proximaCita.split('T')[0] : null,
        Observaciones: entradaData.observaciones || (entradaData as any).observaciones,
        Costo: (entradaData as any).costo ? Number((entradaData as any).costo) : null,
        VacunasAplicadas: typeof entradaData.vacunasAplicadas === 'string' ? entradaData.vacunasAplicadas : JSON.stringify(entradaData.vacunasAplicadas),
        Receta: (entradaData as any).receta,
        Estado: entradaData.estado || 'normal',
        Descripcion: (entradaData as any).descripcion || (entradaData as any).motivoConsulta || entradaData.diagnostico,
        IdMascotaNavigation: null,
      };

      console.log('[DEBUG] Enviando POST a /historial:', payload);

      const nueva = await apiFetch(`${API_BASE}/historial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const mappedNueva = mapHistorial(nueva);
      setHistoriales(prev => [mappedNueva, ...prev]);
      await cargarHistoriales();

      return { success: true, data: mappedNueva };
    } catch (error: any) {
      console.error('[ERROR] Error al crear historial:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [cargarHistoriales, mapHistorial]);

  const actualizarEntradaHistorial = useCallback(async (id: number, entradaData: Partial<HistorialMascota>) => {
    setLoading(true);
    try {
      const payload: any = {
        IdHistorial: Number(id),
        IdMascota: Number(entradaData.id_mascota || (entradaData as any).mascotaId || (entradaData as any).IdMascota),
        Fecha: entradaData.fecha ? (typeof entradaData.fecha === 'string' ? entradaData.fecha.split('T')[0] : new Date(entradaData.fecha).toISOString().split('T')[0]) : null,
        Hora: (entradaData as any).hora || new Date().toTimeString().slice(0, 5),
        TipoVisita: Array.isArray(entradaData.tipoVisita) ? JSON.stringify(entradaData.tipoVisita) : entradaData.tipoVisita,
        Veterinario: (entradaData as any).veterinario,
        MotivoConsulta: (entradaData as any).motivoConsulta,
        Sintomas: typeof entradaData.sintomas === 'string' ? entradaData.sintomas : JSON.stringify(entradaData.sintomas),
        Diagnostico: entradaData.diagnostico,
        Tratamiento: entradaData.tratamiento,
        Medicamentos: typeof entradaData.medicamentos === 'string' ? entradaData.medicamentos : JSON.stringify(entradaData.medicamentos),
        Examenes: typeof entradaData.examenes === 'string' ? entradaData.examenes : JSON.stringify(entradaData.examenes),
        Peso: (entradaData as any).peso ? Number((entradaData as any).peso) : null,
        Temperatura: (entradaData as any).temperatura ? Number((entradaData as any).temperatura) : null,
        FrecuenciaCardiaca: (entradaData as any).frecuenciaCardiaca ? parseInt((entradaData as any).frecuenciaCardiaca) : null,
        FrecuenciaRespiratoria: (entradaData as any).frecuenciaRespiratoria ? parseInt((entradaData as any).frecuenciaRespiratoria) : null,
        ProximaCita: (entradaData as any).proximaCita ? (typeof (entradaData as any).proximaCita === 'string' ? (entradaData as any).proximaCita.split('T')[0] : new Date((entradaData as any).proximaCita).toISOString().split('T')[0]) : null,
        Observaciones: entradaData.observaciones,
        Costo: (entradaData as any).costo ? Number((entradaData as any).costo) : null,
        VacunasAplicadas: typeof entradaData.vacunasAplicadas === 'string' ? entradaData.vacunasAplicadas : JSON.stringify(entradaData.vacunasAplicadas),
        Receta: (entradaData as any).receta,
        Estado: entradaData.estado || 'normal',
        Descripcion: (entradaData as any).descripcion || (entradaData as any).motivoConsulta || entradaData.diagnostico,
        IdMascotaNavigation: null,
      };

      console.log('[DEBUG] Enviando PUT a /historial:', id, payload);

      const actualizada = await apiFetch(`${API_BASE}/historial/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const mappedActualizada = mapHistorial(actualizada);
      setHistoriales(prev => prev.map(h => h.id_historial === id ? mappedActualizada : h));
      await cargarHistoriales();

      return { success: true, data: mappedActualizada };
    } catch (error: any) {
      console.error('[ERROR] Error al actualizar historial:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [cargarHistoriales, mapHistorial]);

  const eliminarEntradaHistorial = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_BASE}/historial/${id}`, { method: 'DELETE' });
      setHistoriales(prev => prev.filter(h => h.id_historial !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { historiales, loading, cargarHistoriales, crearEntradaHistorial, actualizarEntradaHistorial, eliminarEntradaHistorial };
}
