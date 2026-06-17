import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "../../../shared/components/button";
import { Input } from "../../../shared/components/input";
import { Label } from "../../../shared/components/label";
import { Switch } from "../../../shared/components/switch";
import { Separator } from "../../../shared/components/separator";
import {
    Dog,
    Syringe,
    Calendar,
    Trash2,
    Plus,
    ClipboardList,
    HeartPulse,
    User,
    ShieldCheck,
    ChevronLeft,
    ArrowLeft,
    Save,
    Fingerprint,
    Info,
    Mail,
    Phone,
    MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useMascotas, Mascota } from "../hooks/useMascotas";
import { esEmailValido, soloLetras } from '../../../shared/utils/validators';
import { useClientes } from '../../clientes/hooks/useClientes';
import { useEmailAuth } from '../../auth/hooks/useEmailAuth';

interface MascotaFormPageProps {
    onBack: () => void;
    onSuccess: () => void;
    onSubmit: (data: Partial<Mascota>, resetAfter?: boolean) => Promise<any>;
    mascota?: Mascota | null;
    readOnly?: boolean;
    loading?: boolean;
    initialClientId?: number;
}

export const MascotaFormPage: React.FC<MascotaFormPageProps> = ({
    onBack,
    onSuccess,
    onSubmit,
    mascota,
    readOnly = false,
    loading: externalLoading,
    initialClientId
}) => {
    const { clientes } = useClientes();
    const { user } = useEmailAuth();
    const roleName = typeof user?.rol === 'string' ? user.rol : (user?.rol as any)?.nombre_rol || '';
    const isClienteRole = roleName.toLowerCase().includes('cliente');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Mascota & { sexo?: string; color?: string; rasgos_particulares?: string }>>({
        nombre: '',
        especie: '',
        raza: '',
        sexo: '',
        id_cliente: isClienteRole && user?.id_cliente ? user.id_cliente : 0,
        edad: null,
        fecha_nacimiento: '',
        peso: null,
        vacunas: '',
        fecha_ultima_vacuna: '',
        fecha_desparasitacion: '',
        observaciones: '',
        foto: '',
        color: '',
        rasgos_particulares: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const initialName = isClienteRole && user?.id_cliente ? (clientes.find(c => c.id_cliente === user.id_cliente)?.nombre || '') : '';
    const [searchTerm, setSearchTerm] = useState(initialName);
    const [showResults, setShowResults] = useState(false);
    const [tieneVacunas, setTieneVacunas] = useState(false);
    const [listaVacunas, setListaVacunas] = useState<Array<{ nombre: string, fecha: string }>>([]);
    const [currentVacuna, setCurrentVacuna] = useState({ nombre: '', fecha: new Date().toISOString().split('T')[0] });
    const [vacunaError, setVacunaError] = useState('');

    const mascotaId = mascota?.id_mascota;
    useEffect(() => {
        const formatDateForInput = (date: any) => {
            if (!date) return '';
            if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
            try {
                const d = new Date(date);
                if (isNaN(d.getTime())) return '';
                return d.toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };

        if (mascota) {
            setFormData({
                ...mascota,
                sexo: mascota.sexo || '',
                color: mascota.color || '',
                rasgos_particulares: mascota.rasgos_particulares || '',
                fecha_nacimiento: formatDateForInput(mascota.fecha_nacimiento),
                fecha_desparasitacion: formatDateForInput(mascota.fecha_desparasitacion),
                fecha_ultima_vacuna: formatDateForInput(mascota.fecha_ultima_vacuna)
            });
            setSearchTerm(mascota.cliente?.nombre || '');

            if (mascota.vacunas) {
                try {
                    const parsed = JSON.parse(mascota.vacunas);
                    if (Array.isArray(parsed)) {
                        setListaVacunas(parsed);
                        setTieneVacunas(parsed.length > 0);
                    } else {
                        setListaVacunas([]);
                        setTieneVacunas(false);
                    }
                } catch (e) {
                    if (mascota.vacunas.trim()) {
                        setListaVacunas([{ nombre: mascota.vacunas, fecha: mascota.fecha_ultima_vacuna || '' }]);
                        setTieneVacunas(true);
                    } else {
                        setListaVacunas([]);
                        setTieneVacunas(false);
                    }
                }
            } else {
                setListaVacunas([]);
                setTieneVacunas(false);
            }
        } else {
            let defaultSearchTerm = '';
            let defaultClientId = initialClientId || 0;

            if (isClienteRole && user?.id_cliente) {
                defaultClientId = user.id_cliente;
                const c = clientes.find((cli) => cli.id_cliente === user.id_cliente);
                if (c) defaultSearchTerm = c.nombre;
            } else if (initialClientId && clientes && clientes.length > 0) {
                const c = clientes.find((cli) => cli.id_cliente === initialClientId);
                if (c) defaultSearchTerm = c.nombre;
            }

            setFormData(prev => {
                // Si ya tenemos datos y no hay mascota, no resetear si solo cambiaron los clientes
                if (prev.nombre && !mascotaId) return prev;

                return {
                    nombre: '', especie: '', raza: '', sexo: '', id_cliente: defaultClientId,
                    edad: null, fecha_nacimiento: '', peso: null, vacunas: '',
                    fecha_ultima_vacuna: '', fecha_desparasitacion: '', observaciones: '', foto: '',
                    color: '', rasgos_particulares: ''
                };
            });

            if (!mascotaId) {
                // Solo actualizar término de búsqueda si está vacío
                setSearchTerm(prev => prev || defaultSearchTerm);
            }
        }
    }, [mascotaId, initialClientId, clientes.length, isClienteRole, user?.id_cliente]);

    const isLoading = externalLoading || loading;

    const filteredClientes = useMemo(() => {
        if (isClienteRole) {
            return clientes.filter(c => c.id_cliente === user?.id_cliente);
        }
        return clientes.filter(c =>
            (c.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
            (c.cedula || '').includes(searchTerm || '')
        );
    }, [clientes, searchTerm, isClienteRole, user?.id_cliente]);

    const selectedCliente = clientes.find(c => c.id_cliente === formData.id_cliente);

    const handleSubmit = async (e: React.FormEvent, keepEditing = false) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.nombre || !formData.nombre.trim()) {
            newErrors.nombre = 'El nombre del paciente es obligatorio.';
        } else if (!soloLetras(formData.nombre || '')) {
            newErrors.nombre = 'El nombre solo debe contener letras.';
        }

        if (!formData.id_cliente) newErrors.id_cliente = 'Debes seleccionar un dueño/cliente.';

        if (!formData.especie || !formData.especie.trim()) {
            newErrors.especie = 'La especie es obligatoria (ej: Canino, Felino).';
        } else if (/\d/.test(formData.especie)) {
            newErrors.especie = 'La especie no debe contener números.';
        }

        if (formData.raza && /\d/.test(formData.raza)) {
            newErrors.raza = 'La raza no debe contener números.';
        }

        if (formData.edad === null || formData.edad === undefined || formData.edad === ('' as any)) {
            newErrors.edad = 'La edad es obligatoria (en meses).';
        } else if (Number(formData.edad) < 0) {
            newErrors.edad = 'La edad no puede ser un valor negativo.';
        }

        if (formData.peso === null || formData.peso === undefined || formData.peso === ('' as any)) {
            newErrors.peso = 'El peso es obligatorio (en kg).';
        } else if (Number(formData.peso) < 0) {
            newErrors.peso = 'El peso no puede ser un valor negativo.';
        }

        if (!formData.fecha_nacimiento) {
            newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
        } else {
            const birthDate = new Date(formData.fecha_nacimiento);
            const today = new Date();
            birthDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            if (birthDate > today) {
                newErrors.fecha_nacimiento = 'La fecha de nacimiento no puede ser una fecha futura.';
            }

            if (listaVacunas.length > 0) {
                const tieneVacunaInvalida = listaVacunas.some(v => {
                    const vDate = new Date(v.fecha);
                    vDate.setHours(0, 0, 0, 0);
                    return vDate < birthDate;
                });
                if (tieneVacunaInvalida) {
                    toast.error('⚠️ Inconsistencia: Hay vacunas registradas con fecha anterior al nacimiento del paciente.');
                    return;
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Por favor corrige los campos con errores');
            return;
        }

        setLoading(true);
        try {
            const dataToSend = {
                ...formData,
                vacunas: JSON.stringify(listaVacunas),
                fecha_ultima_vacuna: listaVacunas.length > 0 ? listaVacunas[listaVacunas.length - 1].fecha : null
            };
            await onSubmit(dataToSend, keepEditing);
            if (!keepEditing) {
                onSuccess();
            } else {
                toast.success("Progreso guardado");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnother = async (e: React.MouseEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!formData.nombre || !formData.nombre.trim()) {
            newErrors.nombre = 'El nombre del paciente es obligatorio.';
        } else if (!soloLetras(formData.nombre || '')) {
            newErrors.nombre = 'El nombre solo debe contener letras.';
        }
        if (!formData.id_cliente) newErrors.id_cliente = 'Debes seleccionar un dueño/cliente.';
        if (!formData.especie || !formData.especie.trim()) {
            newErrors.especie = 'La especie es obligatoria (ej: Canino, Felino).';
        } else if (/\d/.test(formData.especie)) {
            newErrors.especie = 'La especie no debe contener números.';
        }
        if (formData.raza && /\d/.test(formData.raza)) {
            newErrors.raza = 'La raza no debe contener números.';
        }
        if (formData.edad === null || formData.edad === undefined || formData.edad === ('' as any)) {
            newErrors.edad = 'La edad es obligatoria (en meses).';
        } else if (Number(formData.edad) < 0) {
            newErrors.edad = 'La edad no puede ser un valor negativo.';
        }
        if (formData.peso === null || formData.peso === undefined || formData.peso === ('' as any)) {
            newErrors.peso = 'El peso es obligatorio (en kg).';
        } else if (Number(formData.peso) < 0) {
            newErrors.peso = 'El peso no puede ser un valor negativo.';
        }
        if (!formData.fecha_nacimiento) {
            newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
        } else {
            const birthDate = new Date(formData.fecha_nacimiento);
            const today = new Date();
            birthDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if (birthDate > today) newErrors.fecha_nacimiento = 'La fecha de nacimiento no puede ser una fecha futura.';

            if (listaVacunas.length > 0) {
                const tieneVacunaInvalida = listaVacunas.some(v => new Date(v.fecha) < birthDate);
                if (tieneVacunaInvalida) {
                    toast.error('⚠️ Inconsistencia: Hay vacunas registradas con fecha anterior al nacimiento del paciente.');
                    return;
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Por favor corrige los campos con errores');
            return;
        }
        setLoading(true);
        try {
            const dataToSend = {
                ...formData,
                vacunas: JSON.stringify(listaVacunas),
                fecha_ultima_vacuna: listaVacunas.length > 0 ? listaVacunas[listaVacunas.length - 1].fecha : null
            };
            await onSubmit(dataToSend);
            // Guardar el cliente actual y limpiar el resto
            const savedClientId = formData.id_cliente;
            const savedClienteName = searchTerm;
            setFormData({
                nombre: '', especie: '', raza: '', sexo: '', id_cliente: savedClientId,
                edad: null, fecha_nacimiento: '', peso: null, vacunas: '',
                fecha_ultima_vacuna: '', fecha_desparasitacion: '', observaciones: '', foto: '',
                color: '', rasgos_particulares: ''
            });
            setSearchTerm(savedClienteName);
            setListaVacunas([]);
            setTieneVacunas(false);
            setCurrentVacuna({ nombre: '', fecha: new Date().toISOString().split('T')[0] });
            setErrors({});
            toast.success("✅ Mascota registrada. Ahora puedes agregar otra para el mismo cliente.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleEdadChange = (value: number | null) => {
        handleChange('edad', value);
        if (value !== null && value >= 0) {
            const date = new Date();
            date.setMonth(date.getMonth() - value);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const dateString = `${yyyy}-${mm}-${dd}`;
            
            setFormData(prev => ({ ...prev, fecha_nacimiento: dateString }));
            if (errors['fecha_nacimiento']) setErrors(prev => ({ ...prev, fecha_nacimiento: '' }));
        }
    };

    const handleFechaNacimientoChange = (value: string) => {
        handleChange('fecha_nacimiento', value);
        if (value) {
            const birthDate = new Date(value + 'T12:00:00'); // Use noon to avoid timezone shift
            const today = new Date();
            let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
            if (today.getDate() < birthDate.getDate()) {
                months--;
            }
            if (months < 0) months = 0;
            
            setFormData(prev => ({ ...prev, edad: months }));
            if (errors['edad']) setErrors(prev => ({ ...prev, edad: '' }));
        }
    };

    // Presets de Especies y Razas para evitar errores de digitación
    const especiesComunes = [
        { id: 'Canino', label: '🐶 Canino (Perro)' },
        { id: 'Felino', label: '🐱 Felino (Gato)' }
    ];

    const razasPorEspecie: Record<string, string[]> = {
        Canino: ['Labrador Retriever', 'Pastor Alemán', 'Golden Retriever', 'Poodle', 'Bulldog', 'Beagle', 'Chihuahua', 'Dachshund', 'Yorkshire Terrier', 'Boxer', 'Siberian Husky', 'Pinscher', 'Pitbull', 'Mestizo'],
        Felino: ['Persa', 'Siamés', 'Maine Coon', 'Bengalí', 'Sphynx', 'Ragdoll', 'British Shorthair', 'Abisinio', 'Angora', 'Común Europeo', 'Mestizo']
    };

    const getRazasForEspecie = (especie: string | null | undefined): string[] => {
        if (!especie) return [];
        const normalized = especie.toLowerCase();
        if (normalized.includes('canino') || normalized.includes('perro')) {
            return razasPorEspecie.Canino;
        }
        if (normalized.includes('felino') || normalized.includes('gato')) {
            return razasPorEspecie.Felino;
        }
        return [];
    };

    return (
        <div className="flex flex-col min-h-screen bg-dark-bg animate-in fade-in duration-500">
            {/* Header Fijo */}
            <header className="sticky top-0 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-color p-4 md:p-6" style={{ zIndex: 30 }}>
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2.5 hover:bg-dark-hover rounded-xl text-dark-secondary hover:text-dark-primary transition-all border border-transparent hover:border-dark-color group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-primary tracking-tighter">
                                {readOnly ? 'Detalles del Paciente' : (mascota ? 'Editar Paciente' : 'Nuevo Registro Animal')}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="hidden md:flex text-dark-secondary hover:text-dark-primary hover:bg-dark-hover"
                        >
                            {readOnly ? 'Volver' : 'Cancelar'}
                        </Button>

                        {!readOnly && (
                            <>
                                {!mascota && !isClienteRole && (
                                    <Button
                                        onClick={handleAddAnother}
                                        disabled={isLoading}
                                        className="bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 border border-emerald-500/20 font-bold"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Guardar y Otro
                                    </Button>
                                )}

                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-900/20"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isLoading ? 'Procesando...' : (mascota ? 'Actualizar Ficha' : 'Guardar Paciente')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8">
                <form className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={handleSubmit}>
                    {/* Columna Izquierda: Identidad y Dueño */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-all duration-700"></div>

                            <h2 className="text-lg font-black text-dark-primary mb-8 flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Fingerprint className="w-5 h-5 text-blue-400" />
                                </div>
                                Identificación del Paciente
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className={`text-[10px] font-black tracking-widest ml-1 transition-all ${errors.nombre ? 'text-red-500 opacity-100' : 'text-dark-secondary opacity-50'}`}>Nombre de la Mascota</Label>
                                    <div className="relative">
                                        <Dog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-secondary" />
                                        <Input
                                            disabled={readOnly}
                                            value={formData.nombre}
                                            onChange={(e) => handleChange('nombre', e.target.value)}
                                            className={`h-14 pl-12 bg-dark-hover border-2 rounded-2xl text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/50 border-dark-color hover:border-blue-500/30 ${readOnly ? 'opacity-100 cursor-default' : ''}`}
                                            placeholder="Ej: Max, Luna..."
                                        />
                                    </div>
                                    {errors.nombre && <p className="text-red-500 text-xs mt-1 ml-1">{errors.nombre}</p>}
                                </div>

                                <div className="space-y-3">
                                    <Label className={`text-[10px] font-black tracking-widest ml-1 transition-all ${errors.especie ? 'text-red-500 opacity-100' : 'text-dark-secondary opacity-50'}`}>Especie</Label>
                                    <div className="relative">
                                        <select
                                            disabled={readOnly}
                                            value={formData.especie || ''}
                                            onChange={(e) => {
                                                handleChange('especie', e.target.value);
                                                handleChange('raza', '');
                                            }}
                                            className={`w-full h-14 px-4 bg-dark-hover border-2 rounded-2xl text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/50 border-dark-color hover:border-blue-500/30 ${readOnly ? 'opacity-100 cursor-default appearance-none' : ''}`}
                                        >
                                            <option value="">Seleccionar especie...</option>
                                            {especiesComunes.map(esp => (
                                                <option key={esp.id} value={esp.id}>{esp.label}</option>
                                            ))}
                                            {formData.especie && !especiesComunes.some(e => e.id === formData.especie) && (
                                                <option value={formData.especie}>{formData.especie}</option>
                                            )}
                                        </select>
                                    </div>
                                    {errors.especie && <p className="text-red-500 text-xs mt-1 ml-1">{errors.especie}</p>}
                                </div>

                                <div className="space-y-3">
                                    <Label className={`text-[10px] font-black tracking-widest ml-1 transition-all ${errors.raza ? 'text-red-500 opacity-100' : 'text-dark-secondary opacity-50'}`}>Raza</Label>
                                    <div className="relative">
                                        <select
                                            disabled={readOnly || !formData.especie}
                                            value={formData.raza || ''}
                                            onChange={(e) => handleChange('raza', e.target.value)}
                                            className={`w-full h-14 px-4 bg-dark-hover border-2 rounded-2xl text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/50 border-dark-color hover:border-blue-500/30 ${readOnly ? 'opacity-100 cursor-default appearance-none' : ''}`}
                                        >
                                            <option value="">Seleccionar raza...</option>
                                            {getRazasForEspecie(formData.especie).map((raza: string) => (
                                                <option key={raza} value={raza}>{raza}</option>
                                            ))}
                                            {formData.raza && !getRazasForEspecie(formData.especie).includes(formData.raza) && (
                                                <option value={formData.raza}>{formData.raza}</option>
                                            )}
                                            <option value="Otro">Otra raza...</option>
                                        </select>
                                    </div>
                                    {errors.raza && <p className="text-red-500 text-xs mt-1 ml-1">{errors.raza}</p>}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-dark-secondary tracking-widest ml-1 opacity-50">Sexo</Label>
                                    <div className="relative">
                                        {readOnly ? (
                                            <div className={`w-full h-14 px-4 bg-dark-hover border-2 border-dark-color rounded-2xl flex items-center text-base font-bold transition-all ${formData.sexo === 'Macho' ? 'text-blue-400' :
                                                formData.sexo === 'Hembra' ? 'text-pink-400' :
                                                    'text-dark-primary'
                                                }`}>
                                                {formData.sexo === 'Macho' ? '♂️ Macho' : formData.sexo === 'Hembra' ? '♀️ Hembra' : formData.sexo || 'Desconocido'}
                                            </div>
                                        ) : (
                                            <select
                                                value={formData.sexo || ''}
                                                onChange={(e) => handleChange('sexo', e.target.value)}
                                                className={`w-full h-14 px-4 bg-dark-hover border-2 rounded-2xl text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/50 border-dark-color hover:border-blue-500/30`}
                                            >
                                                <option value="">Seleccionar...</option>
                                                <option value="Macho">♂️ Macho</option>
                                                <option value="Hembra">♀️ Hembra</option>
                                                <option value="Desconocido">❓ Desconocido</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-dark-secondary tracking-widest ml-1 opacity-50">Color</Label>
                                    <Input
                                        disabled={readOnly}
                                        value={formData.color || ''}
                                        onChange={(e) => handleChange('color', e.target.value)}
                                        className={`h-14 bg-dark-hover border-2 rounded-2xl text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/50 border-dark-color hover:border-blue-500/30 ${readOnly ? 'opacity-100 cursor-default' : ''}`}
                                        placeholder="Ej: Blanco con manchas negras..."
                                    />
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-[10px] font-black text-dark-secondary tracking-widest ml-1 opacity-50">Rasgos Particulares</Label>
                                    <Input
                                        disabled={readOnly}
                                        value={formData.rasgos_particulares || ''}
                                        onChange={(e) => handleChange('rasgos_particulares', e.target.value)}
                                        className={`h-14 bg-dark-hover border-2 rounded-2xl text-base font-bold transition-all focus:ring-2 focus:ring-blue-500/50 border-dark-color hover:border-blue-500/30 ${readOnly ? 'opacity-100 cursor-default' : ''}`}
                                        placeholder="Ej: Cicatriz en la oreja derecha, ojos de diferente color..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card: Información Clínica */}
                        <div className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-500/10 transition-all duration-700"></div>

                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <HeartPulse className="w-4 h-4 text-red-400" />
                                </div>
                                <h3 className="text-sm font-bold text-dark-primary tracking-wider">Información Clínica</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className={`font-medium transition-all ${errors.edad ? 'text-red-500' : 'text-dark-primary'}`}>Edad (meses) *</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.edad ?? ''}
                                        onChange={(e) => handleEdadChange(e.target.value ? parseInt(e.target.value) : null)}
                                        className="bg-dark-hover text-dark-primary h-11 border-2 transition-all border-dark-color focus:border-blue-500/50"
                                        placeholder="Ej: 6, 18, 36..."
                                        disabled={readOnly}
                                    />
                                    {errors.edad && <p className="text-red-500 text-xs mt-1 ml-1">{errors.edad}</p>}
                                </div>
                                <div className="space-y-2 text-center md:text-left">
                                    <Label className={`font-medium transition-all ${errors.peso ? 'text-red-500' : 'text-dark-primary'}`}>Peso (kg) *</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        value={formData.peso ?? ''}
                                        onChange={(e) => handleChange('peso', e.target.value ? parseFloat(e.target.value) : null)}
                                        className="bg-dark-hover text-dark-primary h-11 border-2 transition-all border-dark-color focus:border-blue-500/50"
                                        disabled={readOnly}
                                    />
                                    {errors.peso && <p className="text-red-500 text-xs mt-1 ml-1">{errors.peso}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className={`font-medium transition-all ${errors.fecha_nacimiento ? 'text-red-500' : 'text-dark-primary'}`}>Fecha de Nacimiento *</Label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            max={new Date().toISOString().split('T')[0]}
                                            value={formData.fecha_nacimiento ?? ''}
                                            onChange={(e) => handleFechaNacimientoChange(e.target.value)}
                                            className="bg-dark-hover text-dark-primary h-11 pr-10 border-2 transition-all border-dark-color focus:border-blue-500/50"
                                            disabled={readOnly}
                                        />
                                        <Calendar className="w-4 h-4 text-dark-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                    {errors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1 ml-1">{errors.fecha_nacimiento}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-dark-primary font-medium">Última Desparasitación</Label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            max={new Date().toISOString().split('T')[0]}
                                            value={formData.fecha_desparasitacion ?? ''}
                                            onChange={(e) => handleChange('fecha_desparasitacion', e.target.value)}
                                            className="bg-dark-hover border-dark-color text-dark-primary h-11 pr-10"
                                            disabled={readOnly}
                                        />
                                        <Calendar className="w-4 h-4 text-dark-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-dark-primary font-medium">Observaciones / Alergias</Label>
                                    <textarea
                                        value={formData.observaciones ?? ''}
                                        onChange={(e) => handleChange('observaciones', e.target.value)}
                                        className="w-full min-h-[120px] p-4 bg-dark-hover border border-dark-color rounded-2xl text-sm text-dark-primary focus:border-blue-500/50 outline-none resize-none transition-all placeholder:text-dark-secondary/50 shadow-inner disabled:opacity-70 disabled:cursor-default"
                                        disabled={readOnly}
                                        placeholder="Escribe aquí cualquier dato médico importante, alergias o comportamientos notables..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Clientes y Vacunas */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Buscador de Clientes (Solo visible en modo edición y si no es cliente) */}
                        {!readOnly && !isClienteRole && (
                            <div className="dark-card p-6 space-y-4 relative transition-all duration-300" style={{ zIndex: 20 }}>
                                <Label className="text-[10px] font-black text-blue-500 tracking-widest ml-1">Cambiar / Buscar Dueño</Label>
                                <div className="relative z-50">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-secondary" />
                                    <Input
                                        placeholder="Nombre o Cédula..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowResults(true);
                                        }}
                                        onFocus={() => setShowResults(true)}
                                        className="pl-10 h-11 bg-dark-hover border-dark-color focus:border-blue-500/50"
                                    />

                                    {showResults && searchTerm.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-color rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="max-h-60 overflow-y-auto p-2">
                                                {filteredClientes.length > 0 ? (
                                                    filteredClientes.map(c => (
                                                        <button
                                                            key={c.id_cliente}
                                                            type="button"
                                                            onClick={() => {
                                                                handleChange('id_cliente', c.id_cliente);
                                                                setSearchTerm(c.nombre);
                                                                setShowResults(false);
                                                            }}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-blue-500/10 rounded-xl transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                                {c.nombre.substring(0, 1).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-dark-primary">{c.nombre}</div>
                                                                <div className="text-[10px] text-dark-secondary">{c.cedula}</div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-dark-secondary italic font-medium">
                                                        No se encontraron resultados
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Card Cliente Seleccionado */}
                        <div className="dark-card overflow-hidden relative z-10 transition-all duration-300">
                            <div className="p-4 bg-blue-500/10 border-b border-dark-color/30 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-dark-primary tracking-wider">Cliente Responsable</span>
                            </div>
                            {selectedCliente ? (
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
                                            {selectedCliente.nombre.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-dark-primary">{selectedCliente.nombre}</div>
                                            <div className="text-xs text-dark-secondary">{selectedCliente.cedula}</div>
                                        </div>
                                    </div>
                                    <Separator className="bg-dark-color/30" />
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                        <div className="flex items-center gap-3 text-[11px]">
                                            <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Fingerprint className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-dark-secondary font-medium tracking-tighter opacity-70">Documento</span>
                                                <span className="text-dark-primary font-bold truncate">{selectedCliente.cedula}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px]">
                                            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <Phone className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-dark-secondary font-medium tracking-tighter opacity-70">Teléfono</span>
                                                <span className="text-dark-primary font-bold truncate">{selectedCliente.telefono || 'Sin registrar'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px]">
                                            <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                <Mail className="w-4 h-4 text-amber-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-dark-secondary font-medium tracking-tighter opacity-70">Correo</span>
                                                <span className="text-dark-primary font-bold truncate" title={selectedCliente.correo || undefined}>
                                                    {selectedCliente.correo || 'Sin registrar'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px]">
                                            <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                <MapPin className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-dark-secondary font-medium tracking-tighter opacity-70">Dirección</span>
                                                <span className="text-dark-primary font-bold truncate" title={selectedCliente.direccion || undefined}>
                                                    {selectedCliente.direccion || 'Sin registrar'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-dark-hover flex items-center justify-center opacity-50">
                                        <User className="w-6 h-6 text-dark-secondary" />
                                    </div>
                                    <p className="text-xs text-dark-secondary italic">No se ha seleccionado un cliente responsable aún.</p>
                                </div>
                            )}
                        </div>
                        {errors.id_cliente && (
                            <p className="text-red-500 text-xs font-bold ml-2 uppercase -mt-3 animate-in fade-in duration-300">
                                {errors.id_cliente}
                            </p>
                        )}

                        {/* Card de Vacunas */}
                        <div className="dark-card p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Syringe className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-dark-primary tracking-wider">Vacunación</h3>
                                        <p className="text-[10px] text-dark-secondary italic leading-none">Opcional en registro inicial</p>
                                    </div>
                                </div>
                                {!readOnly && (
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={tieneVacunas}
                                            onCheckedChange={setTieneVacunas}
                                        />
                                    </div>
                                )}
                            </div>

                            {tieneVacunas ? (
                                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    {!readOnly && (
                                        <div className="p-4 bg-dark-hover/40 rounded-2xl border border-dark-color/50 space-y-4 shadow-inner">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-dark-secondary ml-1">Nombre Vacuna</Label>
                                                    <Input
                                                        placeholder="Triple Felina..."
                                                        value={currentVacuna.nombre}
                                                        onChange={(e) => {
                                                            setCurrentVacuna(prev => ({ ...prev, nombre: e.target.value }));
                                                            if (vacunaError) setVacunaError('');
                                                        }}
                                                        className="bg-dark-hover text-dark-primary h-10 text-xs border-2 transition-all border-dark-color focus:border-blue-500/50"
                                                    />
                                                    {vacunaError && <p className="text-red-500 text-xs mt-1 ml-1">{vacunaError}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-dark-secondary ml-1">Fecha</Label>
                                                    <Input
                                                        type="date"
                                                        value={currentVacuna.fecha}
                                                        onChange={(e) => setCurrentVacuna(prev => ({ ...prev, fecha: e.target.value }))}
                                                        className="bg-dark-hover border-dark-color text-dark-primary h-10 text-xs text-center"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    if (!currentVacuna.nombre.trim()) return;
                                                    if (/\d/.test(currentVacuna.nombre)) {
                                                        setVacunaError('El nombre no puede contener números');
                                                        return;
                                                    }
                                                    setListaVacunas(prev => [...prev, currentVacuna]);
                                                    setCurrentVacuna({ nombre: '', fecha: new Date().toISOString().split('T')[0] });
                                                    setVacunaError('');
                                                }}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-bold text-xs"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Registrar Dosis
                                            </Button>
                                        </div>
                                    )}

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {listaVacunas.length > 0 ? (
                                            listaVacunas.map((v, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-dark-hover/30 border border-dark-color/20 rounded-xl group transition-all">
                                                    <div className="flex flex-col text-[11px]">
                                                        <span className="font-bold text-dark-primary leading-tight">{v.nombre}</span>
                                                        <span className="text-[9px] text-dark-secondary mt-1 flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3 text-blue-400/50" /> {v.fecha}
                                                        </span>
                                                    </div>
                                                    {!readOnly && (
                                                        <button
                                                            onClick={() => setListaVacunas(prev => prev.filter((_, idx) => idx !== i))}
                                                            className="p-1.5 text-dark-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center border-2 border-dashed border-dark-color/30 rounded-2xl flex flex-col items-center justify-center opacity-50">
                                                <Info className="w-6 h-6 text-dark-secondary mb-2" />
                                                <p className="text-[10px] text-dark-secondary italic px-4">No hay vacunas registradas aún.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-dark-color/20 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-dark-hover/10">
                                    <div className="w-12 h-12 rounded-full bg-dark-hover flex items-center justify-center opacity-30">
                                        <Syringe className="w-6 h-6 text-dark-secondary" />
                                    </div>
                                    <p className="text-[11px] text-dark-secondary font-medium px-6">
                                        El historial de vacunación está actualmente desactivado para este registro. Puedes activarlo arriba o completarlo más tarde.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};
