import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from './apiFetch';

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
      const data = await apiFetch(`${API_URL}/clientes`);
      setClientes(data || []);
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
      const nuevo = await apiFetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
      });
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
      const actualizado = await apiFetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
      });
      setClientes(prev => prev.map(c => c.id_cliente === id ? actualizado : c));
      return { success: true, data: actualizado };
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
