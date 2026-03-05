import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from './apiFetch';

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
  mascota?: any;
  avanceCitas?: any;
}

const API_BASE = '/api';
const DIAGNOSTIC_URL = 'http://localhost:3001/api';

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
        id: h.id_historial,
        mascotaId: h.id_mascota,
        nombreMascota: h.mascota?.nombre || h.nombreMascota || 'Mascota',
        nombreCliente: h.mascota?.cliente?.nombre || h.nombreCliente || 'Cliente',
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

      let data;
      try {
        data = await apiFetch(url);
      } catch (proxyError) {
        console.warn('[DEBUG] Fallo vía proxy, intentando bypass directo a 3001...', proxyError);
        const directUrl = id_mascota ? `${DIAGNOSTIC_URL}/historial/mascota/${id_mascota}` : `${DIAGNOSTIC_URL}/historial`;
        data = await apiFetch(directUrl);
      }

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
      console.log('[DEBUG] Enviando POST a /historial:', entradaData);

      let nueva;
      try {
        nueva = await apiFetch(`${API_BASE}/historial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entradaData),
        });
      } catch (proxyError) {
        console.warn('[DEBUG] Fallo POST vía proxy, intentando bypass directo...', proxyError);
        nueva = await apiFetch(`${DIAGNOSTIC_URL}/historial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entradaData),
        });
      }

      const mappedNueva = mapHistorial(nueva);

      // Actualizar el estado local inmediatamente para evitar depender de la latencia del refresco
      setHistoriales(prev => [mappedNueva, ...prev]);

      // Refrescar desde el servidor para sincronizar relaciones
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
      const actualizada = await apiFetch(`${API_BASE}/historial/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entradaData),
      });

      const mappedActualizada = mapHistorial(actualizada);

      setHistoriales(prev => prev.map(h => h.id_historial === id ? mappedActualizada : h));

      // Forzar carga para sincronizar relaciones completas desde el servidor (nombres, etc)
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
