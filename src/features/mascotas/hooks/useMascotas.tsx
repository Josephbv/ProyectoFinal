import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Mascota {
  id_mascota: number;
  nombre: string;
  especie: string | null;
  raza: string | null;
  edad: number | null;
  fecha_nacimiento: string | null;
  peso: number | null;
  vacunas: string | null;
  fecha_ultima_vacuna: string | null;
  fecha_desparasitacion: string | null;
  foto: string | null;
  observaciones: string | null;
  id_cliente: number;
  cliente?: any;
}

const API_URL = '/api';

export function useMascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarMascotas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_URL}/mascotas`);
      setMascotas(data || []);
    } catch (error) {
      console.error('Error al cargar mascotas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarMascotas(); }, [cargarMascotas]);

  const crearMascota = useCallback(async (mascotaData: Partial<Mascota>) => {
    setLoading(true);
    try {
      const nueva = await apiFetch(`${API_URL}/mascotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mascotaData),
      });
      setMascotas(prev => [nueva, ...prev]);
      return { success: true, data: nueva };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarMascota = useCallback(async (id: number, mascotaData: Partial<Mascota>) => {
    setLoading(true);
    try {
      const actualizada = await apiFetch(`${API_URL}/mascotas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mascotaData),
      });
      setMascotas(prev => prev.map(m => m.id_mascota === id ? actualizada : m));
      return { success: true, data: actualizada };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarMascota = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/mascotas/${id}`, { method: 'DELETE' });
      setMascotas(prev => prev.filter(m => m.id_mascota !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { mascotas, loading, crearMascota, actualizarMascota, eliminarMascota, recargarMascotas: cargarMascotas };
}
