import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Empleado {
    id_empleado: number;
    tipo_documento?: string;
    cedula?: string;
    nombre: string;
    cargo: string | null;
    correo?: string;
    telefono?: string;
    direccion?: string;
}

const API_URL = '/api';

export function useEmpleados() {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarEmpleados = useCallback(async () => {
        setLoading(true);
        try {
            const data: any[] = await apiFetch(`${API_URL}/empleados`);
            const mapped = (data || []).map((e: any) => ({
                ...e,
                id_empleado: e.idEmpleado || e.IdEmpleado || e.id_empleado,
                nombre: e.nombre || e.Nombre,
                cargo: e.cargo || e.Cargo,
                cedula: e.cedula || e.Cedula,
                telefono: e.telefono || e.Telefono,
                correo: e.correo || e.Correo,
                direccion: e.direccion || e.Direccion,
                tipo_documento: e.tipoDocumento || e.TipoDocumento || e.tipo_documento
            }));
            setEmpleados(mapped);
        } catch (error) {
            console.error('Error al cargar empleados:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { cargarEmpleados(); }, [cargarEmpleados]);

    const crearEmpleado = useCallback(async (empleadoData: Partial<Empleado>) => {
        setLoading(true);
        try {
            const nuevo = await apiFetch(`${API_URL}/empleados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empleadoData),
            });
            setEmpleados(prev => [nuevo, ...prev]);
            return { success: true, data: nuevo };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const actualizarEmpleado = useCallback(async (id: number, empleadoData: Partial<Empleado>) => {
        setLoading(true);
        try {
            const actualizado = await apiFetch(`${API_URL}/empleados/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empleadoData),
            });
            setEmpleados(prev => prev.map(e => e.id_empleado === id ? actualizado : e));
            return { success: true, data: actualizado };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const eliminarEmpleado = useCallback(async (id: number) => {
        setLoading(true);
        try {
            await apiFetch(`${API_URL}/empleados/${id}`, { method: 'DELETE' });
            setEmpleados(prev => prev.filter(e => e.id_empleado !== id));
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const buscarEmpleados = useCallback((query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return empleados;
        return empleados.filter(e =>
            e.nombre.toLowerCase().includes(q) ||
            (e.cargo || '').toLowerCase().includes(q) ||
            (e.cedula || '').includes(q)
        );
    }, [empleados]);

    return { empleados, loading, crearEmpleado, actualizarEmpleado, eliminarEmpleado, buscarEmpleados, recargarEmpleados: cargarEmpleados };
}
