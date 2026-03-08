import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useRoles } from '../hooks/useRoles';
import { User, Lock, Users, Eye } from 'lucide-react';



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
        tipo_documento: 'CC',
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
    const [isSubmitted, setIsSubmitted] = useState(false);


    useEffect(() => {
        if (usuario) {
            setFormData({
                nombre_completo: usuario.nombre_completo || '',
                nombre_usuario: usuario.nombre_usuario || '',
                correo: usuario.correo || '',
                tipo_documento: usuario.tipo_documento || 'CC',
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
                tipo_documento: 'CC',
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
        setIsSubmitted(false);
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
        setIsSubmitted(true);
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
                                <Label className="text-dark-secondary text-xs">Username (Nombre de Usuario) <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.nombre_usuario}
                                    onChange={(e) => handleChange('nombre_usuario', e.target.value)}
                                    className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.nombre_usuario ? 'border-red-500' : ''}`}
                                    placeholder="ej: admin.sistema"
                                    readOnly={readOnly}
                                />
                                {isSubmitted && !formData.nombre_usuario.trim() && <p className="text-[10px] text-red-400 italic mt-0.5">Este campo es obligatorio</p>}
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
                                {isSubmitted && !formData.nombre_rol && <p className="text-[10px] text-red-400 italic mt-0.5">Este campo es obligatorio</p>}
                                {errors.nombre_rol && <p className="text-red-400 text-xs">{errors.nombre_rol}</p>}


                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Tipo de Documento</Label>
                                <select
                                    value={formData.tipo_documento}
                                    onChange={(e) => handleChange('tipo_documento', e.target.value)}
                                    disabled={readOnly}
                                    className="w-full h-10 px-3 py-2 bg-dark-hover border border-dark-color rounded-md text-sm text-dark-primary focus:border-dark-cta outline-none cursor-pointer"
                                >
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="TI">Tarjeta de Identidad</option>
                                    <option value="NIT">NIT</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-dark-secondary text-xs">Número de Documento (Cédula)</Label>
                                <Input
                                    value={formData.cedula}
                                    onChange={(e) => handleChange('cedula', e.target.value)}
                                    className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                                    placeholder="1001780XXX"
                                    readOnly={readOnly}
                                />
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
                                <Label className="text-dark-secondary text-xs">Contraseña {usuario && '(Dejar en blanco para no cambiar)'} <span className="text-red-500">*</span></Label>
                                <Input
                                    type="password"
                                    value={formData.contrasena}
                                    onChange={(e) => handleChange('contrasena', e.target.value)}
                                    className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.contrasena ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                    readOnly={readOnly}
                                />
                                {isSubmitted && !usuario && !formData.contrasena.trim() && <p className="text-[10px] text-red-400 italic mt-0.5">Este campo es obligatorio</p>}
                                {errors.contrasena && <p className="text-red-400 text-xs">{errors.contrasena}</p>}


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
            </DialogContent>
        </Dialog>
    );
}
