import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { useRoles } from '../hooks/useRoles';
import { useUsuarios } from '../hooks/useUsuarios';
import { User, Lock, Users, Eye, Phone, MapPin, Copy, CheckCircle2 } from 'lucide-react';
import { esEmailValido, esCedulaValida, esTelefonoValido } from '../../../shared/utils/validators';

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
    const { usuarios } = useUsuarios();
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        tipo_documento: 'CC',
        cedula: '',
        telefono: '',
        direccion: '',
        nombre_rol: 'Administrador',
        estado: 'activo'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [createdUserActivation, setCreatedUserActivation] = useState<{ correo: string, activationLink: string | null } | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setCreatedUserActivation(null);
        setCopied(false);
        if (usuario) {
            setFormData({
                nombre_completo: usuario.nombre_completo || '',
                correo: usuario.correo || '',
                tipo_documento: usuario.tipo_documento || 'CC',
                cedula: usuario.cedula || '',
                telefono: usuario.telefono || '',
                direccion: usuario.direccion || '',
                nombre_rol: usuario.rol?.nombre_rol || 'Administrador',
                estado: usuario.estado || 'activo'
            });
        } else {
            setFormData({
                nombre_completo: '',
                correo: '',
                tipo_documento: 'CC',
                cedula: '',
                telefono: '',
                direccion: '',
                nombre_rol: 'Administrador',
                estado: 'activo'
            });
        }
        setErrors({});
    }, [usuario, isOpen, roles]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nombre_completo.trim()) {
            newErrors.nombre_completo = 'El nombre completo es obligatorio para la identificación.';
        }

        if (!formData.correo.trim()) {
            newErrors.correo = 'El correo electrónico es obligatorio para el acceso.';
        } else if (!esEmailValido(formData.correo)) {
            newErrors.correo = 'El formato del correo no es válido (ej: usuario@correo.com).';
        } else {
            // Bloquear edición si el usuario está inactivo
            if (usuario?.estado && usuario.estado !== 'activo') {
                setErrors({ submit: 'El usuario está inactivo y no puede ser editado.' });
                return false;
            }
            const correoDuplicado = usuarios.some(
                u => u.correo?.toLowerCase().trim() === formData.correo.toLowerCase().trim() && u.id_usuario !== usuario?.id_usuario
            );
            if (correoDuplicado) newErrors.correo = 'Este correo ya está en uso por otro usuario.';
        }

        if (!formData.nombre_rol) {
            newErrors.nombre_rol = 'Debes asignar un rol de acceso al usuario.';
        }

        if (!formData.cedula.trim()) {
            newErrors.cedula = 'El número de identificación es obligatorio.';
        } else if (!esCedulaValida(formData.cedula)) {
            newErrors.cedula = 'La identificación no es válida (6-15 dígitos numéricos sin más de 3 números repetidos continuamente).';
        } else {
            const cedulaDuplicada = usuarios.some(
                u => u.cedula === formData.cedula.trim() && u.id_usuario !== usuario?.id_usuario
            );
            if (cedulaDuplicada) newErrors.cedula = 'Este documento ya está registrado en otro usuario.';
        }

        if (!formData.telefono.trim()) {
            newErrors.telefono = 'El teléfono es obligatorio.';
        } else if (!esTelefonoValido(formData.telefono)) {
            newErrors.telefono = 'El teléfono debe empezar con 3 y tener exactamente 10 dígitos.';
        }

        if (!formData.direccion.trim()) {
            newErrors.direccion = 'La dirección es obligatoria.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCopy = async () => {
        if (!createdUserActivation || !createdUserActivation.activationLink) return;
        await navigator.clipboard.writeText(createdUserActivation.activationLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const isMaestro = usuario?.correo === 'josephballestas10@gmail.com' || usuario?.cedula === '1001780874';

        // Buscar el ID del rol seleccionado para enviarlo al backend
        const rolSeleccionado = roles.find(r => r.nombre === formData.nombre_rol);

        // Auto-generar nombre_usuario a partir del correo para compatibilidad con el backend
        const nombreUsuarioAuto = usuario?.nombre_usuario || formData.correo.split('@')[0] || formData.nombre_completo;

        let data: any = {
            ...formData,
            nombre_usuario: nombreUsuarioAuto,
            id_rol: rolSeleccionado?.id_rol || (rolSeleccionado?.id ? Number(rolSeleccionado.id) : undefined),
            activo: formData.estado === 'activo' || formData.estado === 'bloqueado' ? true : false,
            estado: formData.estado,
            nombre_rol: formData.nombre_rol // Asegurar que enviamos el nombre también
        };

        // Si es el Maestro, omitimos nombre_rol e id_rol para evitar validaciones de cambio de rol en el server
        if (usuario && isMaestro) {
            const { nombre_rol, id_rol, ...rest } = data;
            data = rest;
        }

        const result = await onSubmit(data);
        if (result.success) {
            if (!usuario) {
                // Si es creación, mostrar vista de activación
                setCreatedUserActivation({
                    correo: formData.correo,
                    activationLink: result.activationLink || null
                });
            } else {
                onClose();
            }
        } else {
            if (result.error === 'duplicate_email') {
                setErrors({ correo: 'Este correo ya pertenece a otro usuario registrado.' });
            } else if (result.error === 'duplicate_cedula') {
                setErrors({ cedula: 'Este número de documento ya está registrado en el sistema.' });
            } else {
                setErrors({ submit: result.error || 'Error al guardar el usuario' });
            }
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
                {createdUserActivation ? (
                    <div className="space-y-6 py-4 text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                            <CheckCircle2 className="w-10 h-10 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-dark-primary tracking-tight">¡Usuario Creado Exitosamente!</h2>
                            <p className="text-sm text-dark-secondary max-w-md mx-auto">
                                La cuenta para <span className="font-bold text-indigo-400">{createdUserActivation.correo}</span> ha sido registrada en el sistema. Se le ha enviado un correo electrónico automático para que establezca su contraseña.
                            </p>
                        </div>

                        {createdUserActivation.activationLink && (
                            <div className="p-5 bg-dark-hover rounded-2xl border border-dark-color text-left space-y-3 max-w-md mx-auto relative overflow-hidden">
                                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase block">Enlace de Activación (Plan B)</span>
                                <p className="text-xs text-dark-secondary leading-relaxed">
                                    Si por algún motivo el usuario no recibe el correo automático, puedes copiar este enlace y enviárselo directamente por WhatsApp o chat:
                                </p>
                                <p className="text-xs font-mono bg-dark-bg p-2.5 rounded-xl border border-dark-color text-indigo-300 break-all select-all mt-1">
                                    {createdUserActivation.activationLink}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                            {createdUserActivation.activationLink && (
                                <Button
                                    type="button"
                                    onClick={handleCopy}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2"
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copiado' : 'Copiar Enlace'}
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="text-dark-secondary border border-dark-color hover:bg-dark-hover rounded-xl px-6"
                            >
                                Entendido
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
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
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-dark-secondary text-xs">Nombre Completo <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.nombre_completo}
                                            onChange={(e) => handleChange('nombre_completo', e.target.value)}
                                            className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.nombre_completo ? 'border-red-500' : ''}`}
                                            placeholder="Nombre completo de la persona"
                                            readOnly={readOnly}
                                        />
                                        {errors.nombre_completo && <p className="text-red-400 text-xs">{errors.nombre_completo}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-dark-secondary text-xs">Correo Electrónico <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="email"
                                            value={formData.correo}
                                            onChange={(e) => handleChange('correo', e.target.value)}
                                            className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.correo ? 'border-red-500' : ''}`}
                                            placeholder="correo@ejemplo.com"
                                            readOnly={readOnly}
                                        />
                                        {errors.correo && <p className="text-red-400 text-[10px] italic mt-0.5">{errors.correo}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-dark-secondary text-xs">Rol Base <span className="text-red-500">*</span></Label>
                                        <select
                                            value={formData.nombre_rol}
                                            onChange={(e) => handleChange('nombre_rol', e.target.value)}
                                            disabled={readOnly || (usuario && (usuario.correo === 'josephballestas10@gmail.com' || usuario.cedula === '1001780874'))}
                                            className={`w-full h-10 px-3 py-2 bg-dark-hover border ${errors.nombre_rol ? 'border-red-500' : 'border-dark-color'} rounded-md text-sm text-dark-primary focus:border-dark-cta outline-none cursor-pointer ${usuario && (usuario.correo === 'josephballestas10@gmail.com' || usuario.cedula === '1001780874') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="" disabled>Seleccionar rol</option>
                                            {roles.filter(r => r.activo).map((rol) => (
                                                <option key={rol.id} value={rol.nombre} className="text-dark-primary bg-dark-bg">
                                                    {rol.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.nombre_rol && <p className="text-red-400 text-xs">{errors.nombre_rol}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-dark-secondary text-xs">Tipo de Documento</Label>
                                        <select
                                            value={formData.tipo_documento}
                                            onChange={(e) => handleChange('tipo_documento', e.target.value)}
                                            disabled={readOnly || !!usuario}
                                            className={`w-full h-10 px-3 py-2 bg-dark-hover border border-dark-color rounded-md text-sm text-dark-primary focus:border-dark-cta outline-none cursor-pointer ${usuario ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="Cédula de Ciudadanía">C.C.</option>
                                            <option value="Cédula de Extranjería">C.E.</option>
                                            <option value="Tarjeta de Identidad">T.I.</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-dark-secondary text-xs">Número de Documento (Cédula) <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.cedula}
                                            onChange={(e) => handleChange('cedula', e.target.value)}
                                            className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.cedula ? 'border-red-500' : ''}`}
                                            placeholder="1001780XXX"
                                            readOnly={readOnly}
                                            maxLength={15}
                                        />
                                        {errors.cedula && <p className="text-red-400 text-[10px] italic mt-0.5">{errors.cedula}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-dark-secondary text-xs">Teléfono <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.telefono}
                                            onChange={(e) => handleChange('telefono', e.target.value)}
                                            className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.telefono ? 'border-red-500' : ''}`}
                                            placeholder="300 000 0000"
                                            readOnly={readOnly}
                                            maxLength={10}
                                        />
                                        {errors.telefono && <p className="text-red-400 text-[10px] italic mt-0.5">{errors.telefono}</p>}
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-dark-secondary text-xs">Dirección <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.direccion}
                                            onChange={(e) => handleChange('direccion', e.target.value)}
                                            className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.direccion ? 'border-red-500' : ''}`}
                                            placeholder="Calle 10 # 20-30"
                                            readOnly={readOnly}
                                        />
                                        {errors.direccion && <p className="text-red-400 text-[10px] italic mt-0.5">{errors.direccion}</p>}
                                    </div>

                                </div>
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
