import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useRoles } from '../hooks/useRoles';
import { User, Shield, Key, FileText, Lock, Users, Activity } from 'lucide-react';

interface UsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (usuario: any) => Promise<any>;
    usuario?: any | null;
    loading?: boolean;
    readOnly?: boolean;
}

export function UsuarioModal({ isOpen, onClose, onSubmit, usuario, loading, readOnly = false }: UsuarioModalProps) {
    const { roles } = useRoles();
    const [formData, setFormData] = useState({
        nombre_completo: '',
        nombre_usuario: '',
        correo: '',
        cedula: '',
        contrasena: '',
        pregunta_seguridad: '',
        respuesta_seguridad: '',
        nombre_rol: 'Administrador',
        grupo_usuario: '',
        permisos_especificos: '',
        estado: 'activo'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (usuario) {
            setFormData({
                nombre_completo: usuario.nombre_completo || '',
                nombre_usuario: usuario.nombre_usuario || '',
                correo: usuario.correo || '',
                cedula: usuario.cedula || '',
                contrasena: '', // Do not populate password on edit
                pregunta_seguridad: usuario.pregunta_seguridad || '',
                respuesta_seguridad: usuario.respuesta_seguridad || '',
                nombre_rol: usuario.rol?.nombre_rol || 'Administrador',
                grupo_usuario: usuario.grupo_usuario || '',
                permisos_especificos: usuario.permisos_especificos || '',
                estado: usuario.estado || 'activo'
            });
        } else {
            setFormData({
                nombre_completo: '',
                nombre_usuario: '',
                correo: '',
                cedula: '',
                contrasena: '',
                pregunta_seguridad: '',
                respuesta_seguridad: '',
                nombre_rol: 'Administrador',
                grupo_usuario: '',
                permisos_especificos: '',
                estado: 'activo'
            });
        }
        setErrors({});
    }, [usuario, isOpen, roles]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre_usuario.trim()) newErrors.nombre_usuario = 'El username es obligatorio';
        if (!formData.nombre_rol) newErrors.nombre_rol = 'El rol es obligatorio';
        if (!usuario && !formData.contrasena.trim()) {
            newErrors.contrasena = 'La contraseña es obligatoria para nuevos usuarios';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const data = {
            ...formData,
            activo: formData.estado === 'activo' || formData.estado === 'bloqueado' ? true : false,
            estado: formData.estado
        };

        const result = await onSubmit(data);
        if (result.success) {
            onClose();
        } else {
            setErrors({ submit: result.error || 'Error al guardar el usuario' });
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        {readOnly ? 'Detalles del Usuario' : usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </DialogTitle>
                    <DialogDescription className="text-dark-secondary">
                        {readOnly ? 'Visualización de datos y permisos del usuario' : 'Gestión integral de la cuenta de usuario.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-8 mt-4">
                    {errors.submit && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm">
                            {errors.submit}
                        </div>
                    )}

                    {/* Identificación Básica */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-dark-primary flex items-center gap-2 border-b border-dark-color pb-2">
                            <User className="w-5 h-5 text-indigo-400" />
                            Identificación Básica
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Username (Nombre de Usuario) *</Label>
                                <Input
                                    value={formData.nombre_usuario}
                                    onChange={(e) => handleChange('nombre_usuario', e.target.value)}
                                    className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.nombre_usuario ? 'border-red-500' : ''}`}
                                    placeholder="ej: admin.sistema"
                                    readOnly={readOnly}
                                />
                                {errors.nombre_usuario && <p className="text-red-400 text-xs">{errors.nombre_usuario}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Nombre Completo</Label>
                                <Input
                                    value={formData.nombre_completo}
                                    onChange={(e) => handleChange('nombre_completo', e.target.value)}
                                    className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                                    placeholder="Nombre de la persona"
                                    readOnly={readOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Correo Electrónico</Label>
                                <Input
                                    type="email"
                                    value={formData.correo}
                                    onChange={(e) => handleChange('correo', e.target.value)}
                                    className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                                    placeholder="correo@ejemplo.com"
                                    readOnly={readOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Rol Base *</Label>
                                <select
                                    value={formData.nombre_rol}
                                    onChange={(e) => handleChange('nombre_rol', e.target.value)}
                                    disabled={readOnly}
                                    className={`w-full h-10 px-3 py-2 bg-dark-hover border ${errors.nombre_rol ? 'border-red-500' : 'border-dark-color'} rounded-md text-sm text-dark-primary focus:border-dark-cta outline-none cursor-pointer`}
                                >
                                    <option value="Administrador" className="bg-dark-card text-white">Administrador</option>
                                    <option value="Cliente" className="bg-dark-card text-white">Cliente</option>
                                    <option value="Recepcionista" className="bg-dark-card text-white">Recepcionista</option>
                                </select>
                                {errors.nombre_rol && <p className="text-red-400 text-xs">{errors.nombre_rol}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Seguridad */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-dark-primary flex items-center gap-2 border-b border-dark-color pb-2">
                            <Lock className="w-5 h-5 text-emerald-400" />
                            Seguridad
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Contraseña {usuario && '(Dejar en blanco para no cambiar)'} *</Label>
                                <Input
                                    type="password"
                                    value={formData.contrasena}
                                    onChange={(e) => handleChange('contrasena', e.target.value)}
                                    className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.contrasena ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                    readOnly={readOnly}
                                />
                                {errors.contrasena && <p className="text-red-400 text-xs">{errors.contrasena}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Documento de Identidad (Cédula)</Label>
                                <Input
                                    value={formData.cedula}
                                    onChange={(e) => handleChange('cedula', e.target.value)}
                                    className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                                    placeholder="Identificación / Cédula"
                                    readOnly={readOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs flex items-center gap-2"><Key className="w-3 h-3" /> Pregunta de Seguridad</Label>
                                <Input
                                    value={formData.pregunta_seguridad}
                                    onChange={(e) => handleChange('pregunta_seguridad', e.target.value)}
                                    className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                                    placeholder="Ej. Nombre de mi primera mascota"
                                    readOnly={readOnly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Respuesta de Seguridad</Label>
                                <Input
                                    type="password"
                                    value={formData.respuesta_seguridad}
                                    onChange={(e) => handleChange('respuesta_seguridad', e.target.value)}
                                    className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                                    placeholder="Respuesta"
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Autorización y Perfiles */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-dark-primary flex items-center gap-2 border-b border-dark-color pb-2">
                            <Shield className="w-5 h-5 text-amber-400" />
                            Autorización Avanzada y Perfiles
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Grupo de Usuario</Label>
                                <select
                                    value={formData.grupo_usuario}
                                    onChange={(e) => handleChange('grupo_usuario', e.target.value)}
                                    disabled={readOnly}
                                    className={`w-full h-10 px-3 py-2 bg-dark-hover border border-dark-color rounded-md text-sm text-dark-primary focus:border-dark-cta outline-none appearance-none`}
                                >
                                    <option value="">Seleccione un Grupo...</option>
                                    <option value="Administracion">Administración</option>
                                    <option value="Clinica">Cuerpo Clínico</option>
                                    <option value="Recepcion">Recepción & Ventas</option>
                                    <option value="Soporte">Soporte Técnico</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Permisos Específicos Adicionales</Label>
                                <Input
                                    value={formData.permisos_especificos}
                                    onChange={(e) => handleChange('permisos_especificos', e.target.value)}
                                    className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                                    placeholder="Ej: reportes_avanzados, borrar_facturas"
                                    readOnly={readOnly}
                                />
                                <p className="text-[10px] text-dark-secondary italic mt-1">Permisos extra al margen del rol separados por comas.</p>
                            </div>
                        </div>
                    </div>

                    {/* Auditoría y Estado */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-dark-primary flex items-center gap-2 border-b border-dark-color pb-2">
                            <Activity className="w-5 h-5 text-purple-400" />
                            Auditoría y Estado
                        </h3>
                        <div className="space-y-2">
                            <Label className="text-dark-secondary text-xs">Estado de la cuenta</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-dark-primary text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="estado"
                                        value="activo"
                                        checked={formData.estado === 'activo'}
                                        onChange={() => handleChange('estado', 'activo')}
                                        disabled={readOnly}
                                        className="accent-emerald-500"
                                    />
                                    <span className={formData.estado === 'activo' ? 'text-emerald-400 font-bold' : ''}>Activo</span>
                                </label>
                                <label className="flex items-center gap-2 text-dark-primary text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="estado"
                                        value="inactivo"
                                        checked={formData.estado === 'inactivo'}
                                        onChange={() => handleChange('estado', 'inactivo')}
                                        disabled={readOnly}
                                        className="accent-amber-500"
                                    />
                                    <span className={formData.estado === 'inactivo' ? 'text-amber-400 font-bold' : ''}>Inactivo</span>
                                </label>
                                <label className="flex items-center gap-2 text-dark-primary text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="estado"
                                        value="bloqueado"
                                        checked={formData.estado === 'bloqueado'}
                                        onChange={() => handleChange('estado', 'bloqueado')}
                                        disabled={readOnly}
                                        className="accent-red-500"
                                    />
                                    <span className={formData.estado === 'bloqueado' ? 'text-red-400 font-bold' : ''}>Bloqueado</span>
                                </label>
                            </div>
                        </div>

                        {usuario && (
                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-dark-hover/50 rounded-xl border border-dark-color">
                                    <p className="text-xs text-dark-secondary">Fecha Creado</p>
                                    <p className="text-sm font-bold text-dark-primary">
                                        {usuario.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleDateString() : 'Desconocida'}
                                    </p>
                                </div>
                                <div className="p-3 bg-dark-hover/50 rounded-xl border border-dark-color">
                                    <p className="text-xs text-dark-secondary">Última Actualización</p>
                                    <p className="text-sm font-bold text-dark-primary">
                                        {usuario.fecha_actualizacion ? new Date(usuario.fecha_actualizacion).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>


                    <DialogFooter className="border-t border-dark-color pt-6 gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-dark-secondary border border-dark-color hover:bg-dark-hover"
                        >
                            {readOnly ? 'Cerrar' : 'Cancelar'}
                        </Button>
                        {!readOnly && (
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-dark-cta text-white hover:bg-blue-600 px-6"
                            >
                                {loading ? 'Procesando...' : usuario ? 'Actualizar Usuario' : 'Crear Usuario'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
