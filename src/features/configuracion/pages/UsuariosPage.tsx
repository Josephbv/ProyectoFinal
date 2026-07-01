import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { Users, Plus, Search, Edit, Shield, ShieldOff, Lock, Unlock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, User, Activity, Fingerprint, FileDigit } from "lucide-react";
import { useUsuarios, Usuario } from "../hooks/useUsuarios";
import { UsuarioModal } from "../components/UsuarioModal";
import { Switch } from "../../../shared/components/switch";
import { useEmpleados } from "../../empleados/hooks/useEmpleados";
import { useClientes } from "../../clientes/hooks/useClientes";

const suffixEmail = (email: string | null | undefined, suffix: string) => {
    if (!email) return '';
    if (email.includes(`-${suffix}@`)) return email;
    const parts = email.split('@');
    if (parts.length === 2) {
        return `${parts[0]}-${suffix}@${parts[1]}`;
    }
    return `${email}-${suffix}`;
};

const cleanEmail = (email: string | null | undefined) => {
    if (!email) return '';
    return email.replace(/-[CEce]@/, '@');
};

export function UsuariosPage() {
    const { usuarios, loading, crearUsuario, actualizarUsuario, buscarUsuarios } = useUsuarios();
    const { empleados, crearEmpleado, actualizarEmpleado } = useEmpleados();
    const { clientes, crearCliente, actualizarCliente } = useClientes();
    const [busqueda, setBusqueda] = useState("");
    const [usuarioModal, setUsuarioModal] = useState({ isOpen: false, usuario: null as Usuario | null, readOnly: false });
    const [statusDialog, setStatusDialog] = useState({ isOpen: false, usuario: null as Usuario | null, newState: '' });

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [elementosPorPagina] = useState(10);

    const usuariosFiltrados = buscarUsuarios(busqueda).sort((a, b) => (b.id_usuario || 0) - (a.id_usuario || 0));

    // Calcular paginación
    const totalPaginas = Math.ceil(usuariosFiltrados.length / elementosPorPagina);
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const indiceFin = indiceInicio + elementosPorPagina;
    const usuariosPaginados = usuariosFiltrados.slice(indiceInicio, indiceFin);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const handleCrearUsuario = async (data: Partial<Usuario>) => {
        let idCliente = data.id_cliente;
        let idEmpleado = data.id_empleado;
        const targetRol = (data.nombre_rol || '').toLowerCase().trim();
        const mailLower = (data.correo || '').toLowerCase().trim();
        const cedulaStr = (data.cedula || '').trim();

        if (targetRol === 'cliente') {
            idEmpleado = undefined;

            // Libera la cédula y el correo si está registrada en algún empleado
            if (cedulaStr) {
                const empConCedula = empleados.find(e => e.cedula === cedulaStr);
                if (empConCedula && empConCedula.cedula && !empConCedula.cedula.endsWith('-E')) {
                    await actualizarEmpleado(empConCedula.id_empleado, {
                        ...empConCedula,
                        cedula: `${empConCedula.cedula}-E`,
                        correo: empConCedula.correo ? suffixEmail(empConCedula.correo, 'E') : empConCedula.correo
                    });
                }
            }

            if (!idCliente) {
                const clienteExistente = clientes.find(c =>
                    (c.correo && c.correo.toLowerCase().trim() === mailLower) ||
                    (c.cedula && c.cedula.trim() === cedulaStr)
                );

                if (clienteExistente) {
                    idCliente = clienteExistente.id_cliente;
                    // Restauramos la cédula y el correo limpios si tenían un sufijo
                    if ((clienteExistente.cedula && clienteExistente.cedula.endsWith('-C')) ||
                        (clienteExistente.correo && clienteExistente.correo.includes('-C@'))) {
                        await actualizarCliente(clienteExistente.id_cliente, {
                            ...clienteExistente,
                            cedula: cedulaStr,
                            correo: cleanEmail(clienteExistente.correo)
                        });
                    }
                } else {
                    const cliResult = await crearCliente({
                        nombre: data.nombre_completo || data.nombre_usuario || '',
                        correo: data.correo || '',
                        cedula: data.cedula || '',
                        tipo_documento: data.tipo_documento || 'CC',
                        telefono: (data as any).telefono || '',
                        direccion: (data as any).direccion || '',
                    });
                    if (cliResult.success && cliResult.data) {
                        idCliente = cliResult.data.id_cliente;
                    }
                }
            }
        } else {
            idCliente = undefined;

            // Libera la cédula y el correo si está registrada en algún cliente
            if (cedulaStr) {
                const cliConCedula = clientes.find(c => c.cedula === cedulaStr);
                if (cliConCedula && cliConCedula.cedula && !cliConCedula.cedula.endsWith('-C')) {
                    await actualizarCliente(cliConCedula.id_cliente, {
                        ...cliConCedula,
                        cedula: `${cliConCedula.cedula}-C`,
                        correo: cliConCedula.correo ? suffixEmail(cliConCedula.correo, 'C') : cliConCedula.correo
                    });
                }
            }

            if (!idEmpleado) {
                const empleadoExistente = empleados.find(e =>
                    (e.correo && e.correo.toLowerCase().trim() === mailLower) ||
                    (e.cedula && e.cedula.trim() === cedulaStr)
                );

                if (empleadoExistente) {
                    idEmpleado = empleadoExistente.id_empleado;
                    // Restauramos la cédula y el correo limpios si tenían un sufijo
                    if ((empleadoExistente.cedula && empleadoExistente.cedula.endsWith('-E')) ||
                        (empleadoExistente.correo && empleadoExistente.correo.includes('-E@'))) {
                        await actualizarEmpleado(empleadoExistente.id_empleado, {
                            ...empleadoExistente,
                            cedula: cedulaStr,
                            correo: cleanEmail(empleadoExistente.correo)
                        });
                    }
                } else {
                    const empResult = await crearEmpleado({
                        nombre: data.nombre_completo || data.nombre_usuario || '',
                        correo: data.correo || '',
                        cedula: data.cedula || '',
                        tipo_documento: data.tipo_documento || 'CC',
                        telefono: (data as any).telefono || '',
                        direccion: (data as any).direccion || '',
                        cargo: data.nombre_rol || 'Administrador'
                    });
                    if (empResult.success && empResult.data) {
                        idEmpleado = empResult.data.id_empleado;
                    }
                }
            }
        }

        const result = await crearUsuario({
            ...data,
            id_cliente: idCliente,
            id_empleado: idEmpleado
        });

        if (result.success) {
            toast.success("Usuario registrado exitosamente");
            return { success: true, activationLink: result.activationLink };
        } else {
            return { success: false, error: result.error || "Error al registrar usuario" };
        }
    };

    const handleActualizarUsuario = async (data: Partial<Usuario>) => {
        if (!usuarioModal.usuario) return { success: false };
        if (usuarioModal.usuario.estado && usuarioModal.usuario.estado !== 'activo') {
            toast.error('No se puede editar: el usuario está inactivo.');
            return { success: false };
        }

        let updatedIdCliente = data.id_cliente || usuarioModal.usuario.id_cliente;
        let updatedIdEmpleado = data.id_empleado || usuarioModal.usuario.id_empleado;
        const targetRol = (data.nombre_rol || usuarioModal.usuario.rol?.nombre_rol || '').toLowerCase().trim();
        const mailLower = (data.correo || usuarioModal.usuario.correo || '').toLowerCase().trim();
        const cedulaStr = (data.cedula || usuarioModal.usuario.cedula || '').trim();

        if (targetRol === 'cliente') {
            updatedIdEmpleado = undefined;

            // Libera la cédula y el correo si está registrada en algún empleado
            if (cedulaStr) {
                const empConCedula = empleados.find(e => e.cedula === cedulaStr);
                if (empConCedula && empConCedula.cedula && !empConCedula.cedula.endsWith('-E')) {
                    await actualizarEmpleado(empConCedula.id_empleado, {
                        ...empConCedula,
                        cedula: `${empConCedula.cedula}-E`,
                        correo: empConCedula.correo ? suffixEmail(empConCedula.correo, 'E') : empConCedula.correo
                    });
                }
            }

            if (!updatedIdCliente) {
                const clienteExistente = clientes.find(c =>
                    (c.correo && c.correo.toLowerCase().trim() === mailLower) ||
                    (c.cedula && c.cedula.trim() === cedulaStr)
                );

                if (clienteExistente) {
                    updatedIdCliente = clienteExistente.id_cliente;
                    // Restauramos la cédula y el correo limpios si tenían un sufijo
                    if ((clienteExistente.cedula && clienteExistente.cedula.endsWith('-C')) ||
                        (clienteExistente.correo && clienteExistente.correo.includes('-C@'))) {
                        await actualizarCliente(clienteExistente.id_cliente, {
                            ...clienteExistente,
                            cedula: cedulaStr,
                            correo: cleanEmail(clienteExistente.correo)
                        });
                    }
                } else {
                    const cliResult = await crearCliente({
                        nombre: data.nombre_completo || usuarioModal.usuario.nombre_completo || data.nombre_usuario || usuarioModal.usuario.nombre_usuario || '',
                        correo: data.correo || usuarioModal.usuario.correo || '',
                        cedula: data.cedula || usuarioModal.usuario.cedula || '',
                        tipo_documento: data.tipo_documento || usuarioModal.usuario.tipo_documento || 'CC',
                        telefono: (data as any).telefono || (usuarioModal.usuario as any).telefono || '',
                        direccion: (data as any).direccion || (usuarioModal.usuario as any).direccion || '',
                    });
                    if (cliResult.success && cliResult.data) {
                        updatedIdCliente = cliResult.data.id_cliente;
                    }
                }
            }
        } else {
            updatedIdCliente = undefined;

            // Libera la cédula y el correo si está registrada en algún cliente
            if (cedulaStr) {
                const cliConCedula = clientes.find(c => c.cedula === cedulaStr);
                if (cliConCedula && cliConCedula.cedula && !cliConCedula.cedula.endsWith('-C')) {
                    await actualizarCliente(cliConCedula.id_cliente, {
                        ...cliConCedula,
                        cedula: `${cliConCedula.cedula}-C`,
                        correo: cliConCedula.correo ? suffixEmail(cliConCedula.correo, 'C') : cliConCedula.correo
                    });
                }
            }

            if (!updatedIdEmpleado) {
                const empleadoExistente = empleados.find(e =>
                    (e.correo && e.correo.toLowerCase().trim() === mailLower) ||
                    (e.cedula && e.cedula.trim() === cedulaStr)
                );

                if (empleadoExistente) {
                    updatedIdEmpleado = empleadoExistente.id_empleado;
                    // Restauramos la cédula y el correo limpios si tenían un sufijo
                    if ((empleadoExistente.cedula && empleadoExistente.cedula.endsWith('-E')) ||
                        (empleadoExistente.correo && empleadoExistente.correo.includes('-E@'))) {
                        await actualizarEmpleado(empleadoExistente.id_empleado, {
                            ...empleadoExistente,
                            cedula: cedulaStr,
                            correo: cleanEmail(empleadoExistente.correo)
                        });
                    }
                } else {
                    const empResult = await crearEmpleado({
                        nombre: data.nombre_completo || usuarioModal.usuario.nombre_completo || data.nombre_usuario || usuarioModal.usuario.nombre_usuario || '',
                        correo: data.correo || usuarioModal.usuario.correo || '',
                        cedula: data.cedula || usuarioModal.usuario.cedula || '',
                        tipo_documento: data.tipo_documento || usuarioModal.usuario.tipo_documento || 'CC',
                        telefono: (data as any).telefono || (usuarioModal.usuario as any).telefono || '',
                        direccion: (data as any).direccion || (usuarioModal.usuario as any).direccion || '',
                        cargo: data.nombre_rol || usuarioModal.usuario.rol?.nombre_rol || 'Administrador'
                    });
                    if (empResult.success && empResult.data) {
                        updatedIdEmpleado = empResult.data.id_empleado;
                    }
                }
            }
        }

        const result = await actualizarUsuario(usuarioModal.usuario.id_usuario, {
            ...usuarioModal.usuario,
            ...data,
            id_cliente: updatedIdCliente,
            id_empleado: updatedIdEmpleado
        });

        if (result.success) {
            toast.success("Información del usuario actualizada");
            return { success: true };
        } else {
            return { success: false, error: result.error || "Error al actualizar información" };
        }
    };

    // Bloquear / Desbloquear con confirmación
    const handleCambiarEstado = async () => {
        if (!statusDialog.usuario) return;
        const result = await actualizarUsuario(statusDialog.usuario.id_usuario, {
            ...statusDialog.usuario,
            estado: statusDialog.newState,
            activo: statusDialog.newState !== 'bloqueado'
        });
        if (result.success) {
            toast.success(`Usuario ${statusDialog.newState === 'bloqueado' ? 'bloqueado' : 'desbloqueado'} correctamente`);
            setStatusDialog({ isOpen: false, usuario: null, newState: '' });
        } else {
            toast.error(result.error || "Error al cambiar el estado del usuario");
        }
    };

    const abrirUsuarioModal = (usuario?: Usuario, readOnly: boolean = false) => {
        if (usuario && !readOnly) {
            if (usuario.estado && usuario.estado !== 'activo') {
                toast.error('El usuario está inactivo y no puede ser editado.');
                return;
            }
        }
        setUsuarioModal({ isOpen: true, usuario: usuario || null, readOnly });
    };

    const cerrarUsuarioModal = () => {
        setUsuarioModal({ isOpen: false, usuario: null, readOnly: false });
    };

    const isMaestro = (u: Usuario) =>
        u.correo === 'josephballestas10@gmail.com' || u.cedula === '1001780874';

    const normalizarTipoDoc = (tipo?: string): string => {
        if (!tipo) return 'Cédula de Ciudadanía';
        const mapa: Record<string, string> = {
            'CC':  'Cédula de Ciudadanía',
            'TI':  'Tarjeta de Identidad',
            'CE':  'Cédula de Extranjería',
            'PP':  'Pasaporte',
            'NIT': 'NIT',
        };
        return mapa[tipo.trim().toUpperCase()] || tipo;
    };

    return (
        <>
            <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-dark-primary flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-400" />
                            Cuentas de Usuario
                        </h1>
                        <p className="text-dark-secondary text-sm">Control de acceso y seguridad del sistema</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
                            <input
                                type="text"
                                placeholder="Buscar por alias, correo o documento..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none w-64 md:w-80"
                            />
                        </div>

                        <button
                            onClick={() => abrirUsuarioModal()}
                            className="dark-button-primary font-bold gap-2 flex items-center"
                            disabled={loading}
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-8">
                <div className="dark-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">
                                    <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />Nombre / Correo</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                                        <div className="flex items-center gap-2"><FileDigit className="w-4 h-4 text-blue-400" />Tipo Doc.</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                                        <div className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-blue-400" />Documento</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                                        <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" />Rol Base</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold text-center min-w-[160px]">
                                        <div className="flex items-center justify-center gap-2"><Activity className="w-4 h-4 text-blue-400" />Estado</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold text-center w-36">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usuariosPaginados.map((usuario, index) => (
                                    <TableRow key={`${usuario.id_usuario || index}`} className="border-dark-color hover:bg-dark-table-hover transition-colors">

                                        {/* Nombre / Correo */}
                                        <TableCell className="font-medium text-dark-primary">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow ${usuario.estado === 'bloqueado' ? 'bg-red-900/50' : !(usuario.estado === 'activo' || usuario.estado === 'aprobado') ? 'bg-slate-700' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
                                                    {(usuario.nombre_completo || usuario.nombre_usuario || usuario.correo || 'U').substring(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={`font-semibold ${usuario.estado === 'bloqueado' ? 'text-red-400 line-through' : !(usuario.estado === 'activo' || usuario.estado === 'aprobado') ? 'text-dark-secondary line-through' : ''}`}>
                                                        {usuario.nombre_completo || usuario.nombre_usuario || 'Sin nombre'}
                                                    </div>
                                                    <div className="text-xs text-dark-secondary truncate w-32">{usuario.correo || 'Sin correo'}</div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Tipo Documento */}
                                        <TableCell className="text-dark-primary font-medium">
                                            <span className="bg-dark-hover border border-dark-color px-2 py-1 rounded text-xs">
                                                {normalizarTipoDoc(usuario.tipo_documento)}
                                            </span>
                                        </TableCell>

                                        {/* Cédula */}
                                        <TableCell className="text-dark-primary font-mono text-sm">
                                            {usuario.cedula || '---'}
                                        </TableCell>

                                        {/* Rol */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 align-middle justify-center">
                                                <span className="flex w-fit items-center gap-1.5 text-sm text-dark-secondary capitalize px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                                    <span className="text-blue-400 font-medium">{usuario.rol?.nombre_rol || 'Indefinido'}</span>
                                                </span>
                                                {usuario.id_cliente && usuario.rol?.nombre_rol?.toLowerCase() !== 'cliente' && (
                                                    <span className="flex w-fit items-center gap-1.5 text-xs px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-md">
                                                        <span className="text-green-400">Cliente (Vinculado)</span>
                                                    </span>
                                                )}
                                                {usuario.id_empleado && usuario.rol?.nombre_rol?.toLowerCase() === 'cliente' && (
                                                    <span className="flex w-fit items-center gap-1.5 text-xs px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
                                                        <span className="text-purple-400">Empleado (Vinculado)</span>
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Estado — Switch activo/inactivo (siempre visible) */}
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Switch
                                                        checked={usuario.estado === 'activo' || usuario.estado === 'aprobado'}
                                                        onCheckedChange={async (checked) => {
                                                            const newState = checked ? 'activo' : 'inactivo';
                                                            const result = await actualizarUsuario(usuario.id_usuario, {
                                                                ...usuario,
                                                                estado: newState,
                                                                activo: checked
                                                            });
                                                            if (result.success) {
                                                                toast.success(`Usuario ${checked ? 'activado' : 'desactivado'} exitosamente`);
                                                            } else {
                                                                toast.error(result.error || "Error al cambiar el estado");
                                                            }
                                                        }}
                                                        disabled={isMaestro(usuario) || usuario.estado === 'bloqueado' || loading}
                                                        title={
                                                            isMaestro(usuario)
                                                                ? 'El Administrador Maestro no puede ser modificado'
                                                                : usuario.estado === 'bloqueado'
                                                                ? 'Desbloquea al usuario primero para cambiar este estado'
                                                                : ''
                                                        }
                                                    />
                                                    <span className={`text-xs font-semibold ${
                                                        usuario.estado === 'bloqueado'
                                                            ? 'text-slate-500'
                                                            : usuario.estado === 'activo' || usuario.estado === 'aprobado'
                                                            ? 'text-emerald-400'
                                                            : 'text-slate-400'
                                                    }`}>
                                                        {usuario.estado === 'activo' || usuario.estado === 'aprobado' ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                                {usuario.estado === 'bloqueado' && (
                                                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide">
                                                        Bloqueado
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Ver detalle */}
                                                <Button
                                                    onClick={() => abrirUsuarioModal(usuario, true)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                                                    title="Ver detalle de auditoría"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                {/* Editar */}
                                                <Button
                                                    onClick={() => abrirUsuarioModal(usuario)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                                                    title="Editar cuenta"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>

                                                {/* Bloquear / Desbloquear */}
                                                {usuario.estado !== 'bloqueado' ? (
                                                    <Button
                                                        onClick={() => setStatusDialog({ isOpen: true, usuario, newState: 'bloqueado' })}
                                                        variant="outline"
                                                        size="sm"
                                                        className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                                                        disabled={isMaestro(usuario)}
                                                        title={isMaestro(usuario) ? 'El Administrador Maestro no puede ser bloqueado' : 'Bloquear Acceso'}
                                                    >
                                                        <Lock className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => setStatusDialog({ isOpen: true, usuario, newState: 'activo' })}
                                                        variant="outline"
                                                        size="sm"
                                                        className="p-2 h-9 w-9 bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30"
                                                        title="Desbloquear Acceso"
                                                    >
                                                        <Unlock className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {usuariosPaginados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-dark-secondary">
                                            <ShieldOff className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            {busqueda ? 'No se encontraron usuarios.' : 'No hay cuentas de usuario activas.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Paginación */}
                        {usuariosFiltrados.length > 0 && (
                            <div className="flex items-center justify-between pt-4 mt-4 px-4 pb-4 border-t border-dark-color/40">
                                <div className="text-sm text-dark-secondary">
                                    Mostrando {indiceInicio + 1}-{Math.min(indiceFin, usuariosFiltrados.length)} de {usuariosFiltrados.length} cuentas
                                </div>

                                {totalPaginas > 1 && (
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1 || loading} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                                        <Button variant="outline" size="sm" onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1 || loading} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                                        <Button variant="outline" size="sm" onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                                        <Button variant="outline" size="sm" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {usuarioModal.isOpen && (
                <UsuarioModal
                    isOpen={usuarioModal.isOpen}
                    onClose={cerrarUsuarioModal}
                    onSubmit={usuarioModal.usuario ? handleActualizarUsuario : handleCrearUsuario}
                    usuario={usuarioModal.usuario}
                    loading={loading}
                    readOnly={usuarioModal.readOnly}
                />
            )}

            {/* AlertDialog — Confirmar Bloquear / Desbloquear */}
            <AlertDialog open={statusDialog.isOpen} onOpenChange={() => setStatusDialog({ isOpen: false, usuario: null, newState: '' })}>
                <AlertDialogContent className="bg-dark-card border-dark-color">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-dark-primary text-xl font-bold flex items-center gap-2">
                            {statusDialog.newState === 'bloqueado'
                                ? <Lock className="text-red-500 w-5 h-5" />
                                : <Unlock className="text-emerald-500 w-5 h-5" />}
                            {statusDialog.newState === 'bloqueado' ? '¿Bloquear Usuario?' : '¿Desbloquear Usuario?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-dark-secondary">
                            {statusDialog.newState === 'bloqueado'
                                ? `El usuario "${statusDialog.usuario?.nombre_completo || statusDialog.usuario?.nombre_usuario || statusDialog.usuario?.correo}" no podrá iniciar sesión en el sistema hasta que sea desbloqueado.`
                                : `El usuario "${statusDialog.usuario?.nombre_completo || statusDialog.usuario?.nombre_usuario || statusDialog.usuario?.correo}" recuperará el acceso al sistema.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-dark-color text-dark-secondary hover:bg-dark-hover">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCambiarEstado}
                            className="font-bold text-white border-0 transition-opacity hover:opacity-90"
                            style={{ backgroundColor: statusDialog.newState === 'bloqueado' ? '#dc2626' : '#059669' }}
                            disabled={loading}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
