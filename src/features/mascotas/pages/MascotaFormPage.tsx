import React, { useState, useEffect } from 'react';
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
import { Mascota } from '../hooks/useMascotas';
import { useClientes } from '../../clientes/hooks/useClientes';

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
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Mascota>>({
        nombre: '',
        especie: '',
        raza: '',
        id_cliente: 0,
        edad: null,
        fecha_nacimiento: '',
        peso: null,
        vacunas: '',
        fecha_ultima_vacuna: '',
        fecha_desparasitacion: '',
        observaciones: '',
        foto: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [tieneVacunas, setTieneVacunas] = useState(false);
    const [listaVacunas, setListaVacunas] = useState<Array<{ nombre: string, fecha: string }>>([]);
    const [currentVacuna, setCurrentVacuna] = useState({ nombre: '', fecha: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        if (mascota) {
            setFormData(mascota);
            setSearchTerm(mascota.cliente?.nombre || '');

            // Parsear vacunas JSON
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
            if (initialClientId && clientes && clientes.length > 0) {
                const c = clientes.find((cli) => cli.id_cliente === initialClientId);
                if (c) defaultSearchTerm = c.nombre;
            }

            setFormData({
                nombre: '', especie: '', raza: '', id_cliente: initialClientId || 0,
                edad: null, fecha_nacimiento: '', peso: null, vacunas: '',
                fecha_ultima_vacuna: '', fecha_desparasitacion: '', observaciones: '', foto: ''
            });
            setSearchTerm(defaultSearchTerm);
            setListaVacunas([]);
            setTieneVacunas(false);
        }
    }, [mascota, initialClientId, clientes]);

    const isLoading = externalLoading || loading;

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cedula?.includes(searchTerm)
    );

    const selectedCliente = clientes.find(c => c.id_cliente === formData.id_cliente);

    const handleSubmit = async (e: React.FormEvent, keepEditing = false) => {
        e.preventDefault();
        if (!formData.nombre || !formData.id_cliente) {
            setErrors({
                nombre: !formData.nombre ? 'El nombre es requerido' : '',
                id_cliente: !formData.id_cliente ? 'El cliente es requerido' : ''
            });
            toast.error("Por favor completa los campos obligatorios");
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
        if (!formData.nombre || !formData.id_cliente) {
            setErrors({
                nombre: !formData.nombre ? 'El nombre es requerido' : '',
                id_cliente: !formData.id_cliente ? 'El cliente es requerido' : ''
            });
            toast.error("Por favor completa los campos obligatorios");
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
                nombre: '', especie: '', raza: '', id_cliente: savedClientId,
                edad: null, fecha_nacimiento: '', peso: null, vacunas: '',
                fecha_ultima_vacuna: '', fecha_desparasitacion: '', observaciones: '', foto: ''
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

    const handleChange = (field: keyof Mascota, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    return (
        <div className="flex flex-col min-h-screen bg-dark-bg animate-in fade-in duration-500">
            {/* Header Fijo */}
            <header className="sticky top-0 z-30 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-color p-4 md:p-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2.5 hover:bg-dark-hover rounded-xl text-dark-secondary hover:text-dark-primary transition-all border border-transparent hover:border-dark-color group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Dog className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-dark-primary tracking-tight">
                                    {readOnly ? 'Detalles de Mascota' : mascota ? 'Editar Mascota' : 'Nueva Mascota'}
                                </h1>
                                <p className="text-xs text-dark-secondary">Registro y control clínico del paciente</p>
                            </div>
                        </div>
                    </div>

                    {!readOnly && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={onBack}
                                className="border-dark-color text-dark-secondary hover:bg-dark-hover h-10 px-4"
                            >
                                Cancelar
                            </Button>
                            {!mascota && (
                                <Button
                                    variant="outline"
                                    onClick={handleAddAnother}
                                    disabled={isLoading}
                                    className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 h-10 px-4 font-bold"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Añadir otra
                                </Button>
                            )}
                            <Button
                                onClick={(e) => handleSubmit(e)}
                                disabled={isLoading}
                                className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 font-bold shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? 'Guardando...' : (
                                    <div className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        <span>{mascota ? 'Actualizar' : 'Registrar'}</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Columna Izquierda: Formulario */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Card: Información Básica */}
                            <div className="dark-card p-6 space-y-6 relative z-[200] overflow-visible">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <ClipboardList className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-dark-primary uppercase tracking-wider">Identificación Básica</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-dark-primary font-medium">Nombre de la Mascota *</Label>
                                        <Input
                                            placeholder="Ej: Max, Luna, Toby..."
                                            value={formData.nombre ?? ''}
                                            onChange={(e) => handleChange('nombre', e.target.value)}
                                            className="bg-dark-hover border-dark-color text-dark-primary h-11"
                                            readOnly={readOnly}
                                        />
                                        {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                                    </div>

                                    <div className="space-y-2 relative z-[210]">
                                        <Label className="text-dark-primary font-medium">Dueño / Cliente *</Label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Buscar por cédula o nombre..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setShowResults(true);
                                                }}
                                                onFocus={() => setShowResults(true)}
                                                className="bg-dark-hover border-dark-color text-dark-primary h-11"
                                                readOnly={readOnly}
                                            />
                                            {showResults && searchTerm.length > 0 && !readOnly && (
                                                <div className="absolute z-50 w-full mt-2 bg-dark-card border border-dark-color rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                                                    {filteredClientes.length > 0 ? (
                                                        filteredClientes.map(c => (
                                                            <div
                                                                key={c.id_cliente}
                                                                className="px-5 py-3 hover:bg-dark-hover cursor-pointer text-sm text-dark-primary border-b border-dark-color/30 last:border-0 transition-colors"
                                                                onClick={() => {
                                                                    handleChange('id_cliente', c.id_cliente);
                                                                    setSearchTerm(c.nombre);
                                                                    setShowResults(false);
                                                                }}
                                                            >
                                                                <div className="font-bold">{c.nombre}</div>
                                                                <div className="text-[10px] text-dark-secondary flex items-center gap-1.5 mt-1">
                                                                    <Fingerprint className="w-3 h-3" /> {c.cedula}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-5 py-4 text-xs text-dark-secondary italic text-center">No se encontraron clientes</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {errors.id_cliente && <p className="text-red-400 text-xs mt-1">{errors.id_cliente}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-dark-primary font-medium">Especie *</Label>
                                        <Input
                                            value={formData.especie ?? ''}
                                            onChange={(e) => handleChange('especie', e.target.value)}
                                            className="bg-dark-hover border-dark-color text-dark-primary h-11"
                                            placeholder="Ej: Perro, Gato, Ave..."
                                            readOnly={readOnly}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-dark-primary font-medium">Raza</Label>
                                        <Input
                                            placeholder="Ej: Criollo, Labrador..."
                                            value={formData.raza ?? ''}
                                            onChange={(e) => handleChange('raza', e.target.value)}
                                            className="bg-dark-hover border-dark-color text-dark-primary h-11"
                                            readOnly={readOnly}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card: Información Clínica */}
                            <div className="dark-card p-6 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                        <HeartPulse className="w-4 h-4 text-red-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-dark-primary uppercase tracking-wider">Información Clínica</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-dark-primary font-medium">Edad (años)</Label>
                                        <Input
                                            type="number"
                                            value={formData.edad ?? ''}
                                            onChange={(e) => handleChange('edad', e.target.value ? parseInt(e.target.value) : null)}
                                            className="bg-dark-hover border-dark-color text-dark-primary h-11"
                                            readOnly={readOnly}
                                        />
                                    </div>
                                    <div className="space-y-2 text-center md:text-left">
                                        <Label className="text-dark-primary font-medium">Peso (kg)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={formData.peso ?? ''}
                                            onChange={(e) => handleChange('peso', e.target.value ? parseFloat(e.target.value) : null)}
                                            className="bg-dark-hover border-dark-color text-dark-primary h-11"
                                            readOnly={readOnly}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-dark-primary font-medium">Fecha de Nacimiento</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={formData.fecha_nacimiento ?? ''}
                                                onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                                                className="bg-dark-hover border-dark-color text-dark-primary h-11 pr-10"
                                                readOnly={readOnly}
                                            />
                                            <Calendar className="w-4 h-4 text-dark-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-dark-primary font-medium">Última Desparasitación</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={formData.fecha_desparasitacion ?? ''}
                                                onChange={(e) => handleChange('fecha_desparasitacion', e.target.value)}
                                                className="bg-dark-hover border-dark-color text-dark-primary h-11 pr-10"
                                                readOnly={readOnly}
                                            />
                                            <Calendar className="w-4 h-4 text-dark-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-dark-primary font-medium">Observaciones / Alergias</Label>
                                        <textarea
                                            value={formData.observaciones ?? ''}
                                            onChange={(e) => handleChange('observaciones', e.target.value)}
                                            className="w-full min-h-[120px] p-4 bg-dark-hover border border-dark-color rounded-2xl text-sm text-dark-primary focus:border-blue-500/50 outline-none resize-none transition-all placeholder:text-dark-secondary/50 shadow-inner"
                                            readOnly={readOnly}
                                            placeholder="Escribe aquí cualquier dato médico importante, alergias o comportamientos notables..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Clientes y Vacunas */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Card Cliente Seleccionado */}
                            <div className="dark-card overflow-hidden">
                                <div className="p-4 bg-blue-500/10 border-b border-dark-color/30 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs font-bold text-dark-primary uppercase tracking-wider">Cliente Responsable</span>
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
                                                    <span className="text-dark-secondary font-medium uppercase tracking-tighter opacity-70">Documento</span>
                                                    <span className="text-dark-primary font-bold truncate">{selectedCliente.cedula}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-[11px]">
                                                <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                    <Phone className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-dark-secondary font-medium uppercase tracking-tighter opacity-70">Teléfono</span>
                                                    <span className="text-dark-primary font-bold truncate">{selectedCliente.telefono || 'Sin registrar'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-[11px]">
                                                <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                    <Mail className="w-4 h-4 text-amber-400" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-dark-secondary font-medium uppercase tracking-tighter opacity-70">Correo</span>
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
                                                    <span className="text-dark-secondary font-medium uppercase tracking-tighter opacity-70">Dirección</span>
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

                            {/* Card de Vacunas */}
                            <div className="dark-card p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Syringe className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-dark-primary uppercase tracking-wider">Historial de Vacunación</h3>
                                </div>

                                <div className="space-y-6">
                                    {!readOnly && (
                                        <div className="p-4 bg-dark-hover/40 rounded-2xl border border-dark-color/50 space-y-4 shadow-inner">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-dark-secondary ml-1">Nombre Vacuna</Label>
                                                    <Input
                                                        placeholder="Triple Felina..."
                                                        value={currentVacuna.nombre}
                                                        onChange={(e) => setCurrentVacuna(prev => ({ ...prev, nombre: e.target.value }))}
                                                        className="bg-dark-hover border-dark-color text-dark-primary h-10 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-dark-secondary ml-1">Fecha</Label>
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
                                                    if (currentVacuna.nombre.trim()) {
                                                        setListaVacunas(prev => [...prev, currentVacuna]);
                                                        setCurrentVacuna({ nombre: '', fecha: new Date().toISOString().split('T')[0] });
                                                    }
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
                                                <p className="text-[10px] text-dark-secondary italic px-4">Completa para registrar vacunas (opcional).</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
