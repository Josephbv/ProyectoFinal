import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';

export interface Usuario {
    id_usuario: number;
    nombre_usuario: string;
    contrasena: string;
    correo?: string;
    cedula?: string;
    tipo_documento?: string;
    activo: boolean;
    estado: string; // "activo", "inactivo", "bloqueado"
    fecha_creacion: string;
    fecha_actualizacion: string;
    usuario_creador?: number;

    // Perfiles
    nombre_completo?: string;
    grupo_usuario?: string;
    permisos_especificos?: string;

    // Seguridad
    pregunta_seguridad?: string;
    respuesta_seguridad?: string;
    token_recuperacion?: string;
    nombre_rol?: string; // Nombre del rol para el payload

    // Relaciones
    id_rol: number;
    rol?: { id_rol: number, nombre_rol: string, activo: boolean };
    id_cliente?: number;
    id_empleado?: number;
}

const API_URL = '/api';

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarUsuarios = useCallback(async () => {
        setLoading(true);
        try {
            const data: any[] = await apiFetch(`${API_URL}/auth/users`);
            const mapped = (data || []).map((u: any) => ({
                ...u,
                id_usuario: u.idUsuario || u.IdUsuario || u.id_usuario,
                nombre_usuario: u.nombreUsuario || u.NombreUsuario || u.nombre_usuario,
                nombre_completo: u.nombreCompleto || u.NombreCompleto || u.nombre_completo,
                correo: u.correo || u.Correo,
                cedula: u.cedula || u.Cedula,
                id_rol: u.idRol || u.IdRol || u.id_rol,
                activo: u.activo !== undefined ? u.activo : u.Activo,
                rol: u.rol || (u.idRolNavigation || u.IdRolNavigation ? {
                    id_rol: (u.idRolNavigation || u.IdRolNavigation).idRol || (u.idRolNavigation || u.IdRolNavigation).IdRol,
                    nombre_rol: (u.idRolNavigation || u.IdRolNavigation).nombreRol || (u.idRolNavigation || u.IdRolNavigation).NombreRol,
                    activo: (u.idRolNavigation || u.IdRolNavigation).activo !== undefined ? (u.idRolNavigation || u.IdRolNavigation).activo : (u.idRolNavigation || u.IdRolNavigation).Activo
                } : undefined)
            }));
            setUsuarios(mapped);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

    const crearUsuario = useCallback(async (usuarioData: Partial<Usuario> & { nombre_rol?: string }) => {
        setLoading(true);
        try {
            const payload: any = {
                NombreUsuario: usuarioData.nombre_usuario,
                NombreCompleto: usuarioData.nombre_completo || usuarioData.nombre_usuario,
                Correo: usuarioData.correo,
                Cedula: usuarioData.cedula,
                TipoDocumento: usuarioData.tipo_documento,
                NombreRol: (usuarioData as any).nombre_rol || 'Administrador',
            };
            const nuevo = await apiFetch(`${API_URL}/auth/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            await cargarUsuarios();
            return { success: true, data: nuevo };
        } catch (error: any) {
            const raw = (error.message || '').toLowerCase();
            if ((raw.includes('correo') || raw.includes('email')) && (raw.includes('exist') || raw.includes('duplicado')))
                return { success: false, error: 'duplicate_email' };
            if ((raw.includes('cedula') || raw.includes('documento')) && (raw.includes('exist') || raw.includes('duplicado')))
                return { success: false, error: 'duplicate_cedula' };
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [cargarUsuarios]);

    const actualizarUsuario = useCallback(async (id: number, usuarioData: Partial<Usuario>) => {
        setLoading(true);
        try {
            const payload: any = {
                IdUsuario: id,
                NombreUsuario: usuarioData.nombre_usuario,
                NombreCompleto: usuarioData.nombre_completo || usuarioData.nombre_usuario,
                Contrasena: usuarioData.contrasena,
                Correo: usuarioData.correo,
                Cedula: usuarioData.cedula,
                TipoDocumento: usuarioData.tipo_documento,
                IdRol: usuarioData.id_rol,
                NombreRol: usuarioData.nombre_rol,
                IdCliente: usuarioData.id_cliente,
                IdEmpleado: usuarioData.id_empleado,
                Estado: usuarioData.estado || 'activo',
                Activo: usuarioData.activo ?? true,
            };
            await apiFetch(`${API_URL}/auth/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            await cargarUsuarios();
            return { success: true };
        } catch (error: any) {
            const raw = (error.message || '').toLowerCase();
            if ((raw.includes('correo') || raw.includes('email')) && (raw.includes('exist') || raw.includes('duplicado')))
                return { success: false, error: 'duplicate_email' };
            if ((raw.includes('cedula') || raw.includes('documento')) && (raw.includes('exist') || raw.includes('duplicado')))
                return { success: false, error: 'duplicate_cedula' };
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [cargarUsuarios]);

    const eliminarUsuario = useCallback(async (id: number) => {
        setLoading(true);
        try {
            await apiFetch(`${API_URL}/auth/users/${id}`, { method: 'DELETE' });
            setUsuarios(prev => prev.filter(u => u.id_usuario !== id));
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const buscarUsuarios = useCallback((query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return usuarios;
        return usuarios.filter(u =>
            (u.cedula || '').includes(q) ||
            u.nombre_usuario.toLowerCase().includes(q) ||
            (u.correo || '').toLowerCase().includes(q) ||
            (u.nombre_completo || '').toLowerCase().includes(q)
        );
    }, [usuarios]);

    return { usuarios, loading, crearUsuario, actualizarUsuario, eliminarUsuario, buscarUsuarios, recargarUsuarios: cargarUsuarios };
}
