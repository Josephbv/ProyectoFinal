import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';
import { cleanCedula, cleanEmail } from '../../../shared/components/utils';

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
                cedula: cleanCedula(e.cedula || e.Cedula),
                telefono: e.telefono || e.Telefono,
                correo: cleanEmail(e.correo || e.Correo),
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
            const payload: any = {
                Nombre: empleadoData.nombre,
                Cargo: empleadoData.cargo,
                Cedula: empleadoData.cedula,
                TipoDocumento: empleadoData.tipo_documento,
                Correo: empleadoData.correo,
                Telefono: empleadoData.telefono,
                Direccion: empleadoData.direccion,
                Experiencia: (empleadoData as any).experiencia?.toString()
            };
            const response = await apiFetch(`${API_URL}/empleados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Mapear TODOS los campos para que el estado local quede completo
            // sin depender de que el backend devuelva todo en camelCase
            const nuevo: Empleado = {
                ...response,
                id_empleado: response.idEmpleado || response.IdEmpleado || response.id_empleado,
                nombre: response.nombre || response.Nombre || empleadoData.nombre || '',
                cargo: response.cargo || response.Cargo || empleadoData.cargo || null,
                cedula: response.cedula || response.Cedula || empleadoData.cedula,
                correo: response.correo || response.Correo || empleadoData.correo,
                telefono: response.telefono || response.Telefono || empleadoData.telefono,
                direccion: response.direccion || response.Direccion || empleadoData.direccion,
                tipo_documento: response.tipoDocumento || response.TipoDocumento || response.tipo_documento || empleadoData.tipo_documento,
            };

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
            const payload: any = {
                IdEmpleado: id,
                Nombre: empleadoData.nombre,
                Cargo: empleadoData.cargo,
                Cedula: empleadoData.cedula,
                TipoDocumento: empleadoData.tipo_documento,
                Correo: empleadoData.correo,
                Telefono: empleadoData.telefono,
                Direccion: empleadoData.direccion,
                Experiencia: (empleadoData as any).experiencia?.toString()
            };
            await apiFetch(`${API_URL}/empleados/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setEmpleados(prev => prev.map(e => e.id_empleado === id ? { ...e, ...empleadoData } : e));
            return { success: true };
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
