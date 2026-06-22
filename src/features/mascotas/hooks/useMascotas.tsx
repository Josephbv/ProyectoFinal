import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';
import { useEmailAuth } from '../../auth/hooks/useEmailAuth';

export interface Mascota {
  id_mascota: number;
  nombre: string;
  especie: string | null;
  raza: string | null;
  sexo: string | null; // Nuevo campo
  color: string | null;
  rasgos_particulares: string | null;
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
  fecha_creacion?: string | null;
}

const API_URL = '/api';

export function useMascotas() {
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useEmailAuth();

  const cargarMascotas = useCallback(async () => {
    setLoading(true);
    try {
      const data: any[] = await apiFetch(`${API_URL}/mascotas`);
      let mapped = (data || []).map((m: any) => {
        const id = m.idMascota || m.IdMascota || m.id_mascota;
        return {
          ...m,
          id_mascota: id,
          id_cliente: m.idCliente || m.IdCliente || m.id_cliente,
          nombre: m.nombre || m.Nombre,
          especie: m.especie || m.Especie,
          raza: m.raza || m.Raza,
          sexo: m.sexo || m.Sexo || null,
          color: m.color || m.Color || null,
          rasgos_particulares: m.rasgosParticulares || m.RasgosParticulares || m.rasgos_particulares || null,
          edad: m.edad ?? m.Edad ?? null,
          peso: m.peso ?? m.Peso ?? null,
          vacunas: m.vacunas || m.Vacunas || null,
          observaciones: m.observaciones || m.Observaciones || null,
          foto: m.foto || m.Foto || null,
          fecha_nacimiento: m.fecha_nacimiento || m.fechaNacimiento || m.FechaNacimiento || null,
          fecha_desparasitacion: m.fecha_desparasitacion || m.fechaDesparasitacion || m.FechaDesparasitacion || null,
          fecha_ultima_vacuna: m.fecha_ultima_vacuna || m.fechaUltimaVacuna || m.FechaUltimaVacuna || null,
          fecha_creacion: m.fecha_creacion || m.fechaCreacion || m.FechaCreacion || null,
          cliente: m.cliente || (m.idClienteNavigation || m.IdClienteNavigation ? {
            id_cliente: (m.idClienteNavigation || m.IdClienteNavigation).idCliente || (m.idClienteNavigation || m.IdClienteNavigation).IdCliente,
            nombre: (m.idClienteNavigation || m.IdClienteNavigation).nombre || (m.idClienteNavigation || m.IdClienteNavigation).Nombre,
            cedula: (m.idClienteNavigation || m.IdClienteNavigation).cedula || (m.idClienteNavigation || m.IdClienteNavigation).Cedula,
            telefono: (m.idClienteNavigation || m.IdClienteNavigation).telefono || (m.idClienteNavigation || m.IdClienteNavigation).Telefono || null,
            correo: (m.idClienteNavigation || m.IdClienteNavigation).correo || (m.idClienteNavigation || m.IdClienteNavigation).Correo || null,
            direccion: (m.idClienteNavigation || m.IdClienteNavigation).direccion || (m.idClienteNavigation || m.IdClienteNavigation).Direccion || null,
          } : undefined)
        };
      });

      // Filtrar por cliente si el rol es Cliente
      if (user?.rol?.toLowerCase().includes('cliente') && user?.id_cliente) {
        mapped = mapped.filter(m => m.id_cliente === user.id_cliente);
      }

      setMascotas(mapped);
    } catch (error) {
      console.error('Error al cargar mascotas:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { cargarMascotas(); }, [cargarMascotas]);

  const crearMascota = useCallback(async (mascotaData: Partial<Mascota>) => {
    setLoading(true);
    try {
      const payload: any = {
        Nombre: mascotaData.nombre,
        Especie: mascotaData.especie,
        Raza: mascotaData.raza,
        Sexo: mascotaData.sexo,
        Color: (mascotaData as any).color || null,
        RasgosParticulares: (mascotaData as any).rasgos_particulares || null,
        Edad: mascotaData.edad ? Number(mascotaData.edad) : null,
        Peso: mascotaData.peso ? Number(mascotaData.peso) : null,
        Observaciones: mascotaData.observaciones,
        Vacunas: mascotaData.vacunas,
        Foto: null,
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
      const id = nueva.idMascota || nueva.IdMascota || nueva.id_mascota;
      const mappedNueva = {
        ...nueva,
        id_mascota: id,
        sexo: mascotaData.sexo || null,
        color: (mascotaData as any).color || null,
        rasgos_particulares: (mascotaData as any).rasgos_particulares || null,
        fecha_creacion: nueva.fechaCreacion || nueva.FechaCreacion || nueva.fecha_creacion || new Date().toISOString()
      };
      setMascotas(prev => [mappedNueva, ...prev]);
      return { success: true, data: mappedNueva };
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
        Sexo: mascotaData.sexo,
        Color: (mascotaData as any).color || null,
        RasgosParticulares: (mascotaData as any).rasgos_particulares || null,
        Edad: mascotaData.edad ? Number(mascotaData.edad) : null,
        Peso: mascotaData.peso ? Number(mascotaData.peso) : null,
        Observaciones: mascotaData.observaciones,
        Vacunas: mascotaData.vacunas,
        Foto: null,
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
