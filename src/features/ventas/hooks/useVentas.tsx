import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';
import { cleanCedula } from '../../../shared/components/utils';

export interface VentaServicio {
  id_venta: number;
  id_servicio: number;
  cantidad: number | null;
  servicio?: any;
}

export interface Venta {
  id_venta: number;
  fecha: string | null;
  total: number | null;
  estado: 'aprobada' | 'anulada';
  id_cliente: number;
  id_mascota?: number;
  cliente?: any;
  mascota?: any;
  venta_servicios?: VentaServicio[];
  motivo_anulacion?: string;
}

const API_URL = '/api';

export function useVentas(enabled: boolean = true) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(enabled);

  const cargarVentas = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data: any[] = await apiFetch(`${API_URL}/ventas`);
      const mapped = (data || []).map((v: any) => ({
        ...v,
        id_venta: v.idVenta || v.IdVenta || v.id_venta,
        fecha: v.fecha || v.Fecha,
        total: v.total || v.Total,
        estado: v.estado || v.Estado,
        id_cliente: v.idCliente || v.IdCliente || v.id_cliente,
        id_mascota: v.idMascota || v.IdMascota || v.id_mascota || (() => {
          const storedStr = localStorage.getItem(`mascota_venta_${v.idVenta || v.IdVenta || v.id_venta}`);
          return storedStr ? parseInt(storedStr) : undefined;
        })(),
        cliente: v.cliente || (v.idClienteNavigation || v.IdClienteNavigation ? {
          id_cliente: (v.idClienteNavigation || v.IdClienteNavigation).idCliente || (v.idClienteNavigation || v.IdClienteNavigation).IdCliente,
          nombre: (v.idClienteNavigation || v.IdClienteNavigation).nombre || (v.idClienteNavigation || v.IdClienteNavigation).Nombre || (v.idClienteNavigation || v.IdClienteNavigation).nombreCompleto,
          cedula: cleanCedula((v.idClienteNavigation || v.IdClienteNavigation).cedula || (v.idClienteNavigation || v.IdClienteNavigation).Cedula || (v.idClienteNavigation || v.IdClienteNavigation).documento || v.cedula || v.Cedula)
        } : (v.nombreCliente || v.NombreCliente ? { nombre: v.nombreCliente || v.NombreCliente, cedula: cleanCedula(v.cedulaCliente || v.CedulaCliente) } : undefined)),
        venta_servicios: v.venta_servicios || (v.ventaServicios || v.VentaServicios ? (v.ventaServicios || v.VentaServicios)
          .filter((vs: any) => vs !== null)
          .map((vs: any) => ({
            id_venta: vs.idVenta || vs.IdVenta,
            id_servicio: vs.idServicio || vs.IdServicio,
            cantidad: vs.cantidad || vs.Cantidad
          })) : []),
        motivo_anulacion: v.estado === 'anulada' ? (v.motivoAnulacion || v.MotivoAnulacion || localStorage.getItem(`motivo_anulacion_${v.idVenta || v.id_venta}`)) : undefined
      }));
      setVentas(mapped);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) cargarVentas();
  }, [cargarVentas, enabled]);

  // Recarga automática cada 30 segundos para mantener el Dashboard actualizado
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(cargarVentas, 30000);
    return () => clearInterval(interval);
  }, [cargarVentas, enabled]);

  // Recarga al volver a la pestaña (ej: después de crear una venta)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') cargarVentas();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [cargarVentas]);

  const agregarVenta = useCallback(async (ventaData: any) => {
    setLoading(true);
    try {
      const payload: any = {
        Fecha: ventaData.fecha ? (typeof ventaData.fecha === 'string' ? ventaData.fecha.split('T')[0] : new Date(ventaData.fecha).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        Total: Number(ventaData.total),
        IdCliente: Number(ventaData.id_cliente),
        IdMascota: ventaData.id_mascota ? Number(ventaData.id_mascota) : null,
        Estado: ventaData.estado || 'aprobada',
        VentaServicios: (ventaData.venta_servicios || []).map((vs: any) => ({
          IdServicio: Number(vs.id_servicio),
          Cantidad: Number(vs.cantidad || 1),
          IdServicioNavigation: null,
          IdVentaNavigation: null,
        })),
        IdClienteNavigation: null,
        IdMascotaNavigation: null,
      };
      const nuevaVenta = await apiFetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const mapped = {
        ...nuevaVenta,
        id_venta: nuevaVenta.idVenta || nuevaVenta.IdVenta || nuevaVenta.id_venta,
        fecha: nuevaVenta.fecha || nuevaVenta.Fecha || payload.Fecha,
        total: nuevaVenta.total || nuevaVenta.Total || payload.Total,
        id_cliente: nuevaVenta.idCliente || nuevaVenta.IdCliente || payload.IdCliente,
        id_mascota: nuevaVenta.idMascota || nuevaVenta.IdMascota || payload.IdMascota || ventaData.id_mascota || null,
        cliente: nuevaVenta.idClienteNavigation || nuevaVenta.IdClienteNavigation
          ? {
            id_cliente: (nuevaVenta.idClienteNavigation || nuevaVenta.IdClienteNavigation).idCliente,
            nombre: (nuevaVenta.idClienteNavigation || nuevaVenta.IdClienteNavigation).nombre || (nuevaVenta.idClienteNavigation || nuevaVenta.IdClienteNavigation).Nombre,
            cedula: cleanCedula((nuevaVenta.idClienteNavigation || nuevaVenta.IdClienteNavigation).cedula || (nuevaVenta.idClienteNavigation || nuevaVenta.IdClienteNavigation).Cedula),
          }
          : (ventaData.cliente ? { ...ventaData.cliente, cedula: cleanCedula(ventaData.cliente.cedula) } : undefined),
        venta_servicios: (nuevaVenta.ventaServicios || nuevaVenta.VentaServicios || [])
          .filter((vs: any) => vs !== null)
          .map((vs: any) => ({
            id_venta: vs.idVenta || vs.IdVenta,
            id_servicio: vs.idServicio || vs.IdServicio || vs.id_servicio,
            cantidad: vs.cantidad || vs.Cantidad || 1,
            servicio: vs.idServicioNavigation || vs.IdServicioNavigation || vs.servicio
          })) || ventaData.venta_servicios || [],
        estado: nuevaVenta.estado || nuevaVenta.Estado || 'aprobada',
      };

      if (mapped.id_mascota) {
        localStorage.setItem(`mascota_venta_${mapped.id_venta}`, mapped.id_mascota.toString());
      }

      setVentas(prev => [mapped, ...prev].sort((a, b) => {
        const dateA = new Date(a.fecha || '').getTime();
        const dateB = new Date(b.fecha || '').getTime();
        return dateB - dateA; // Descendente por defecto
      }));
      return { success: true, data: mapped };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al crear venta' };
    } finally {
      setLoading(false);
    }
  }, []);

  const anularVenta = useCallback(async (id: number, motivo: string) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/ventas/anular/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Motivo: motivo }) // Enviamos el motivo al servidor en Mayúscula
      });

      setVentas(prev => prev.map(v => v.id_venta === id ? { ...v, estado: 'anulada', motivo_anulacion: motivo } : v));
      return { success: true };
    } catch (error: any) {
      alert("Error detallado al anular: " + error.message);
      return { success: false, error: error.message || 'Error al anular venta' };
    } finally {
      setLoading(false);
    }
  }, []);
  const eliminarVenta = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await apiFetch(`${API_URL}/ventas/${id}`, { method: 'DELETE' });
      setVentas(prev => prev.filter(v => v.id_venta !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al eliminar venta' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { ventas, loading, crearVenta: agregarVenta, anularVenta, eliminarVenta, recargarVentas: cargarVentas };
}
