import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Cliente {
  id_cliente: number;
  nombre: string;
  tipo_documento: string | null;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  mascotas?: Mascota[];
}

export interface Mascota {
  id_mascota: number;
  nombre: string;
  especie: string | null;
  raza: string | null;
  id_cliente: number;
}

const API_URL = '/api';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarClientes = useCallback(async () => {
    setLoading(true);
    try {
      const data: any[] = await apiFetch(`${API_URL}/clientes`);
      const mapped = (data || []).map((c: any) => ({
        ...c,
        id_cliente: c.idCliente || c.IdCliente || c.id_cliente,
        tipo_documento: c.tipoDocumento || c.TipoDocumento || c.tipo_documento || 'Cédula de Ciudadanía',
        nombre: c.nombre || c.Nombre || c.nombreCompleto || c.NombreCompleto || c.name || c.Name || c.fullName || (c.correo || c.Correo || '').split('@')[0] || '',
        cedula: c.cedula || c.Cedula,
        correo: c.correo || c.Correo,
        telefono: c.telefono || c.Telefono,
        direccion: c.direccion || c.Direccion,
        mascotas: (c.mascota || c.Mascota || c.mascotas || [])
          .filter((m: any) => m !== null)
          .map((m: any) => ({
            ...m,
            id_mascota: m.idMascota || m.IdMascota || m.id_mascota,
            id_cliente: m.idCliente || m.IdCliente || m.id_cliente,
            nombre: m.nombre || m.Nombre
          }))
      }));
      setClientes(mapped);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarClientes(); }, [cargarClientes]);

  const crearCliente = useCallback(async (clienteData: Partial<Cliente>) => {
    setLoading(true);
    try {
      const payload: any = {
        Nombre: clienteData.nombre,
        TipoDocumento: clienteData.tipo_documento,
        Cedula: clienteData.cedula,
        Telefono: clienteData.telefono,
        Correo: clienteData.correo,
        Direccion: clienteData.direccion,
      };
      const response = await apiFetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Mapear el cliente completo con los mismos fallbacks que cargarClientes
      const nuevo: Cliente = {
        ...response,
        id_cliente: response.idCliente || response.IdCliente || response.id_cliente,
        nombre: response.nombre || response.Nombre || response.nombreCompleto || response.NombreCompleto ||
                clienteData.nombre ||
                (response.correo || response.Correo || clienteData.correo || '').split('@')[0] || '',
        tipo_documento: response.tipoDocumento || response.TipoDocumento || response.tipo_documento || clienteData.tipo_documento || 'Cédula de Ciudadanía',
        cedula: response.cedula || response.Cedula || clienteData.cedula || null,
        correo: response.correo || response.Correo || clienteData.correo || null,
        telefono: response.telefono || response.Telefono || clienteData.telefono || null,
        direccion: response.direccion || response.Direccion || clienteData.direccion || null,
        mascotas: []
      };

      setClientes(prev => [nuevo, ...prev]);
      return { success: true, data: nuevo };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarCliente = useCallback(async (id: number, clienteData: Partial<Cliente>) => {
    setLoading(true);
    try {
      const payload: any = {
        IdCliente: id,
        Nombre: clienteData.nombre,
        TipoDocumento: clienteData.tipo_documento,
        Cedula: clienteData.cedula,
        Telefono: clienteData.telefono,
        Correo: clienteData.correo,
        Direccion: clienteData.direccion,
      };
      await apiFetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setClientes(prev => prev.map(c => c.id_cliente === id ? { ...c, ...clienteData } : c));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarCliente = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
      setClientes(prev => prev.filter(c => c.id_cliente !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { clientes, loading, crearCliente, actualizarCliente, eliminarCliente, recargarClientes: cargarClientes };
}
