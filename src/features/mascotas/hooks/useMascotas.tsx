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
      const data: any[] = await apiFetch(`${API_URL}/mascotas`);
      const mapped = (data || []).map((m: any) => ({
        ...m,
        id_mascota: m.idMascota || m.IdMascota || m.id_mascota,
        id_cliente: m.idCliente || m.IdCliente || m.id_cliente,
        nombre: m.nombre || m.Nombre,
        especie: m.especie || m.Especie,
        raza: m.raza || m.Raza,
        cliente: m.cliente || (m.idClienteNavigation || m.IdClienteNavigation ? {
          id_cliente: (m.idClienteNavigation || m.IdClienteNavigation).idCliente || (m.idClienteNavigation || m.IdClienteNavigation).IdCliente,
          nombre: (m.idClienteNavigation || m.IdClienteNavigation).nombre || (m.idClienteNavigation || m.IdClienteNavigation).Nombre,
          cedula: (m.idClienteNavigation || m.IdClienteNavigation).cedula || (m.idClienteNavigation || m.IdClienteNavigation).Cedula
        } : undefined)
      }));
      setMascotas(mapped);
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
      const payload: any = {
        Nombre: mascotaData.nombre,
        Especie: mascotaData.especie,
        Raza: mascotaData.raza,
        Edad: mascotaData.edad ? Number(mascotaData.edad) : null,
        Peso: mascotaData.peso ? Number(mascotaData.peso) : null,
        Observaciones: mascotaData.observaciones,
        Vacunas: mascotaData.vacunas,
        Foto: mascotaData.foto,
        IdCliente: Number(mascotaData.id_cliente),
        FechaNacimiento: mascotaData.fecha_nacimiento ? mascotaData.fecha_nacimiento.split('T')[0] : null,
        FechaDesparasitacion: mascotaData.fecha_desparasitacion ? mascotaData.fecha_desparasitacion.split('T')[0] : null,
        FechaUltimaVacuna: mascotaData.fecha_ultima_vacuna ? mascotaData.fecha_ultima_vacuna.split('T')[0] : null,
        IdClienteNavigation: null,
      };
      const nueva = await apiFetch(`${API_URL}/mascotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      const payload: any = {
        IdMascota: Number(id),
        Nombre: mascotaData.nombre,
        Especie: mascotaData.especie,
        Raza: mascotaData.raza,
        Edad: mascotaData.edad ? Number(mascotaData.edad) : null,
        Peso: mascotaData.peso ? Number(mascotaData.peso) : null,
        Observaciones: mascotaData.observaciones,
        Vacunas: mascotaData.vacunas,
        Foto: mascotaData.foto,
        IdCliente: Number(mascotaData.id_cliente),
        FechaNacimiento: mascotaData.fecha_nacimiento ? mascotaData.fecha_nacimiento.split('T')[0] : null,
        FechaDesparasitacion: mascotaData.fecha_desparasitacion ? mascotaData.fecha_desparasitacion.split('T')[0] : null,
        FechaUltimaVacuna: mascotaData.fecha_ultima_vacuna ? mascotaData.fecha_ultima_vacuna.split('T')[0] : null,
        IdClienteNavigation: null,
      };
      await apiFetch(`${API_URL}/mascotas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setMascotas(prev => prev.map(m => m.id_mascota === id ? { ...m, ...mascotaData } : m));
      return { success: true };
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
