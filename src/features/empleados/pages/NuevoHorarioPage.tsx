import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Input } from "../../../shared/components/input";
import { Label } from "../../../shared/components/label";
import { Textarea } from "../../../shared/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/components/select";
import { Switch } from "../../../shared/components/switch";
import { Badge } from "../../../shared/components/badge";
import { Card, CardContent } from "../../../shared/components/card";
import { useHorario } from "../hooks/useHorario";
import { useEmpleados } from "../hooks/useEmpleados";
import { User, Search, Calendar, CheckCircle, ChevronLeft, Clock, AlertCircle, Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

interface NuevoHorarioPageProps {
    onBack: () => void;
    onSuccess: () => void;
    horarioAEditar?: any;
}

export function NuevoHorarioPage({ onBack, onSuccess, horarioAEditar }: NuevoHorarioPageProps) {
    const { empleados } = useEmpleados();
    const { crearHorario, actualizarHorario, loading: loadingHorario } = useHorario();

    // Helper para formatear lo que viene del servidor a HH:mm para el input
    const formatTimeForInput = (timeStr: string) => {
        if (!timeStr) return "";
        try {
            // Si viene con 'T' (ISO legacy), extraer la hora
            if (timeStr.includes('T')) {
                return timeStr.split('T')[1].slice(0, 5);
            }
            // Si ya es HH:mm o similar, solo asegurar 5 caracteres
            return timeStr.slice(0, 5);
        } catch (e) {
            return timeStr;
        }
    };

    const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
    const [mostrarListaEmpleados, setMostrarListaEmpleados] = useState(false);
    const [mostrarListaHorarios, setMostrarListaHorarios] = useState(false);
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);

    // Horarios por día
    const [horariosPorDia, setHorariosPorDia] = useState<{
        [key: string]: { id_horario?: number; horaInicio: string; horaFin: string; }
    }>({});

    const [formData, setFormData] = useState({
        cc: '',
        nombre: '',
        apellido: '',
        horario: '',
        dia: '',
        horaInicio: '',
        horaFin: '',
        disponible: true,
        sala: '',
        observaciones: ''
    });

    // Filtrar empleados (por cédula)
    const empleadosDisponibles = empleados.filter((emp: any) =>
        emp.cedula?.includes(busquedaEmpleado)
    );

    const { horarios } = useHorario();

    useEffect(() => {
        if (horarioAEditar && empleados.length > 0 && horarios.length > 0) {
            const empleadoId = horarioAEditar.id_empleado;
            const empleado = empleados.find((u: any) => u.id_empleado === empleadoId);

            if (empleado) {
                setEmpleadoSeleccionado(empleado);
                setBusquedaEmpleado(`${empleado.nombre}`);

                // Cargar TODOS los horarios de este empleado
                const horariosEmpleado = horarios.filter((h: any) => h.id_empleado === empleadoId);
                const diasConHorario = horariosEmpleado.map((h: any) => h.dia_semana);
                const mapaHorarios: any = {};

                horariosEmpleado.forEach((h: any) => {
                    let hInicio = formatTimeForInput(h.hora_inicio);
                    let hFin = formatTimeForInput(h.hora_fin);

                    // "Sanación" automática: Si la hora está invertida o es la de error (20:00 - 05:00)
                    // la reseteamos al estándar solicitado (08:00 - 17:00)
                    if (hInicio >= hFin || (hInicio === '20:00' && hFin === '05:00')) {
                        hInicio = '08:00';
                        hFin = '17:00';
                    }

                    mapaHorarios[h.dia_semana] = {
                        id_horario: h.id_horario,
                        horaInicio: hInicio,
                        horaFin: hFin
                    };
                });

                setDiasSeleccionados(diasConHorario);
                setHorariosPorDia(mapaHorarios);

                setFormData(prev => ({
                    ...prev,
                    cc: empleado.cedula || '',
                    nombre: empleado.nombre,
                    disponible: horarioAEditar.disponible ?? true,
                    observaciones: horarioAEditar.observaciones || ''
                }));
            }
        }
    }, [horarioAEditar, empleados, horarios]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!empleadoSeleccionado) {
            toast.error("Debe seleccionar un empleado");
            return;
        }

        if (horarioAEditar) {
            let todosExitosos = true;
            // Procesar los días seleccionados para actualizar o crear
            for (const dia of diasSeleccionados) {
                const horarioDia = horariosPorDia[dia];
                if (!horarioDia || !horarioDia.horaInicio || !horarioDia.horaFin) continue;

                const dataToSubmit = {
                    id_empleado: empleadoSeleccionado.id_empleado,
                    dia_semana: dia,
                    hora_inicio: horarioDia.horaInicio,
                    hora_fin: horarioDia.horaFin,
                    disponible: formData.disponible,
                    observaciones: formData.observaciones
                };

                // Si ya tenía ID, actualizamos. Si no, creamos.
                if (horarioDia.id_horario) {
                    const resultado = await actualizarHorario(horarioDia.id_horario, dataToSubmit as any);
                    if (!resultado.success) {
                        toast.error(`Error al actualizar lunes: ${resultado.error}`);
                        todosExitosos = false;
                        break;
                    }
                } else {
                    const resultado = await crearHorario(dataToSubmit as any);
                    if (!resultado.success) {
                        toast.error(`Error al crear horario para ${dia}: ${resultado.error}`);
                        todosExitosos = false;
                        break;
                    }
                }
            }

            if (todosExitosos) {
                toast.success("Horarios actualizados exitosamente");
                onSuccess();
            }
        } else {
            let todosExitosos = true;
            for (const dia of diasSeleccionados) {
                const horarioDia = horariosPorDia[dia];
                if (!horarioDia || !horarioDia.horaInicio || !horarioDia.horaFin) continue;

                const dataToSubmit = {
                    id_empleado: empleadoSeleccionado.id_empleado,
                    dia_semana: dia,
                    hora_inicio: horarioDia.horaInicio,
                    hora_fin: horarioDia.horaFin,
                    disponible: formData.disponible,
                    observaciones: formData.observaciones
                };
                const resultado = await crearHorario(dataToSubmit as any);
                if (!resultado.success) {
                    todosExitosos = false;
                    toast.error(resultado.error || `Error al crear horario para ${dia}`);
                    break;
                }
            }
            if (todosExitosos && diasSeleccionados.length > 0) {
                toast.success("Horario(s) registrado(s) exitosamente");
                onSuccess();
            }
        }
    };

    const seleccionarEmpleado = (empleado: any) => {
        setEmpleadoSeleccionado(empleado);
        setBusquedaEmpleado(`${empleado.nombre}`);
        setMostrarListaEmpleados(false);

        setFormData(prev => ({
            ...prev,
            cc: empleado.cedula || '',
            nombre: empleado.nombre,
            apellido: '' // Empleado doesn't have apellido
        }));
    };

    const toggleDia = (dia: string) => {
        setDiasSeleccionados(prev => {
            if (prev.includes(dia)) {
                const nuevosDias = prev.filter(d => d !== dia);
                const nuevosHorarios = { ...horariosPorDia };
                delete nuevosHorarios[dia];
                setHorariosPorDia(nuevosHorarios);
                return nuevosDias;
            } else {
                const nuevosDias = [...prev, dia];
                setHorariosPorDia(prevHorarios => ({
                    ...prevHorarios,
                    [dia]: prevHorarios[dia] || { horaInicio: '08:00', horaFin: '17:00' }
                }));
                return nuevosDias;
            }
        });
    };

    const actualizarHorarioDia = (dia: string, campo: 'horaInicio' | 'horaFin', valor: string) => {
        setHorariosPorDia(prev => ({
            ...prev,
            [dia]: { ...prev[dia], [campo]: valor }
        }));
    };

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const salas = ['Consultorio 1', 'Consultorio 2', 'Consultorio 3', 'Quirófano A', 'Quirófano B', 'Urgencias', 'Sala de Procedimientos'];
    const horariosDisponibles = [
        'Lunes a Viernes 8:00 AM - 5:00 PM',
        'Lunes a Viernes 7:00 AM - 3:00 PM',
        'Lunes a Viernes 9:00 AM - 6:00 PM',
        'Lunes a Viernes 8:00 AM - 12:00 PM',
        'Lunes a Viernes 2:00 PM - 8:00 PM',
        'Lunes a Sábado 8:00 AM - 5:00 PM',
        'Lunes a Sábado 9:00 AM - 6:00 PM',
        'Turno Mañana: 6:00 AM - 2:00 PM',
        'Turno Tarde: 2:00 PM - 10:00 PM',
        'Turno Noche: 10:00 PM - 6:00 AM',
        'Horario de Consulta General',
        'Horario de Cirugía',
        'Horario de Urgencias 24/7',
        'Horario de Domicilio',
        'Horario Especialista',
        'Horario de Guardia'
    ];

    const horariosFiltrados = horariosDisponibles.filter(horario =>
        horario.toLowerCase().includes(formData.horario.toLowerCase())
    );

    const formInvalid = loadingHorario ||
        !empleadoSeleccionado ||
        diasSeleccionados.length === 0 ||
        diasSeleccionados.some(dia => {
            const horarioDia = horariosPorDia[dia];
            return !horarioDia || !horarioDia.horaInicio || !horarioDia.horaFin || horarioDia.horaInicio >= horarioDia.horaFin;
        });

    return (
        <div className="flex flex-col h-full bg-dark-bg pb-10" onClick={() => { setMostrarListaEmpleados(false); setMostrarListaHorarios(false); }}>
            <header className="bg-dark-card/50 backdrop-blur-sm border-b border-dark-color/50 px-5 py-3 sticky top-0 z-20">
                <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-dark-secondary hover:text-dark-primary h-8 w-8">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-semibold text-dark-primary">{horarioAEditar ? 'Editar Horario' : 'Nuevo Horario'}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onBack} className="border-dark-color text-dark-secondary hover:bg-dark-hover h-8 rounded-lg px-4">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={formInvalid} size="sm" className="bg-blue-600 text-white hover:bg-blue-700 h-8 rounded-lg px-4 shadow-md shadow-blue-900/20">
                            {loadingHorario ? 'Guardando...' : (horarioAEditar ? 'Guardar Cambios' : 'Registrar')}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Tarjeta de Personal */}
                    <Card className="bg-dark-card border-dark-color shadow-xl rounded-2xl overflow-hidden overflow-visible relative">
                        <div className="bg-blue-600/10 border-b border-dark-color p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-900/40 border-2 border-dark-card">
                                    {empleadoSeleccionado ? empleadoSeleccionado.nombre.charAt(0).toUpperCase() : <User />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {!empleadoSeleccionado ? (
                                        <div className="relative">
                                            <Label className="text-dark-secondary text-[10px] uppercase font-bold tracking-wider mb-1 block">Seleccionar Personal</Label>
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-secondary" />
                                                <Input
                                                    value={busquedaEmpleado}
                                                    onChange={(e) => {
                                                        setBusquedaEmpleado(e.target.value);
                                                        setMostrarListaEmpleados(true);
                                                    }}
                                                    onFocus={() => setMostrarListaEmpleados(true)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="pl-10 h-10 bg-dark-hover border-dark-color rounded-xl text-dark-primary text-sm focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Buscar por ID..."
                                                />
                                                {mostrarListaEmpleados && empleadosDisponibles.length > 0 && (
                                                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-dark-card border-dark-color shadow-2xl rounded-xl max-h-48 overflow-y-auto border-2">
                                                        <CardContent className="p-0" onClick={(e) => e.stopPropagation()}>
                                                            {empleadosDisponibles.map((empleado: any) => (
                                                                <button
                                                                    key={empleado.id_empleado}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        seleccionarEmpleado(empleado);
                                                                    }}
                                                                    className="w-full p-3 text-left hover:bg-dark-hover transition-colors border-b border-dark-color last:border-b-0 flex items-center gap-3"
                                                                >
                                                                    <div className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center text-xs font-bold">
                                                                        {empleado.nombre.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-semibold text-dark-primary text-sm truncate">{empleado.nombre}</div>
                                                                        <div className="text-[10px] text-dark-secondary truncate">CC: {empleado.cedula || 'N/A'}</div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-xl font-bold text-dark-primary truncate">{empleadoSeleccionado.nombre}</h2>
                                                {!horarioAEditar && (
                                                    <Button variant="ghost" size="sm" onClick={() => setEmpleadoSeleccionado(null)} className="h-6 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                                                        Cambiar
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-dark-secondary font-mono">CC: {empleadoSeleccionado.cedula || 'N/A'}</span>
                                                <Badge className="bg-blue-600/20 text-blue-400 border-0 text-[10px] h-5 rounded-full px-2">
                                                    {diasSeleccionados.length} días asignados
                                                </Badge>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Titulo y Seleccción de Días */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    Horarios Semanales
                                </h3>

                                <div className="grid grid-cols-7 gap-2">
                                    {diasSemana.map((dia) => {
                                        const isSelected = diasSeleccionados.includes(dia);
                                        return (
                                            <button
                                                key={dia}
                                                type="button"
                                                onClick={() => toggleDia(dia)}
                                                className={`h-12 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all flex flex-col items-center justify-center border-2 ${isSelected
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30'
                                                    : 'bg-dark-hover border-dark-color text-dark-secondary hover:border-blue-400/50 hover:text-blue-400'
                                                    }`}
                                            >
                                                {dia.slice(0, 3)}
                                                {isSelected && <div className="w-1 h-1 bg-white rounded-full mt-1" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Listado de Horarios por Día */}
                            <div className="space-y-3">
                                {diasSeleccionados.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-dark-color rounded-2xl opacity-50">
                                        <p className="text-xs text-dark-secondary italic">Por favor selecciona uno o más días en el calendario superior para asignar turnos.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {diasSeleccionados.map((dia) => {
                                            const horarioDia = horariosPorDia[dia] || { horaInicio: '', horaFin: '' };
                                            const esInvalido = horarioDia.horaInicio && horarioDia.horaFin && horarioDia.horaInicio >= horarioDia.horaFin;

                                            return (
                                                <div key={dia} className="bg-dark-hover/30 border border-dark-color/80 rounded-2xl p-4 transition-all hover:bg-dark-hover/50 hover:border-blue-500/30 group">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold border border-blue-500/20">{dia}</div>
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={formData.disponible}
                                                                    onCheckedChange={() => setFormData(p => ({ ...p, disponible: !p.disponible }))}
                                                                />
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider w-20 ${formData.disponible ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                                                                    {formData.disponible ? 'Disponible' : 'Descanso'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[#6d28d9] text-[10px] uppercase font-bold tracking-widest pl-1">HORA DE INICIO</Label>
                                                            <div className={`relative overflow-hidden rounded-xl border-2 transition-all bg-white ${esInvalido ? 'border-red-500/50' : 'border-blue-100'}`}>
                                                                <Input
                                                                    type="time"
                                                                    value={horarioDia.horaInicio}
                                                                    onChange={(e) => actualizarHorarioDia(dia, 'horaInicio', e.target.value)}
                                                                    className="h-12 pl-3 border-0 bg-transparent text-dark-bg font-bold text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label className="text-[#6d28d9] text-[10px] uppercase font-bold tracking-widest pl-1">HORA FINAL</Label>
                                                            <div className={`relative overflow-hidden rounded-xl border-2 transition-all bg-white ${esInvalido ? 'border-red-500/50' : 'border-blue-100'}`}>
                                                                <Input
                                                                    type="time"
                                                                    value={horarioDia.horaFin}
                                                                    onChange={(e) => actualizarHorarioDia(dia, 'horaFin', e.target.value)}
                                                                    className="h-12 pl-3 border-0 bg-transparent text-dark-bg font-bold text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {esInvalido && (
                                                        <div className="mt-2 text-[10px] text-red-500 font-bold flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Error: La hora de inicio debe ser menor a la hora final.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Observaciones y Configuración Global */}
                            <div className="space-y-4 pt-4 border-t border-dark-color/50">
                                <div className="space-y-2">
                                    <Label htmlFor="observaciones" className="text-dark-primary font-bold text-xs uppercase tracking-wider pl-1">Observaciones</Label>
                                    <Textarea
                                        id="observaciones"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                        className="bg-dark-hover border-dark-color text-dark-primary min-h-[80px] rounded-xl text-sm focus:ring-1 focus:ring-blue-500 border-2"
                                        placeholder="Nota opcional..."
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-center pt-2">
                        <p className="text-[10px] text-dark-secondary text-center max-w-xs leading-relaxed">
                            Al guardar los cambios, el sistema actualizará o creará los turnos para los días seleccionados para este profesional.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
