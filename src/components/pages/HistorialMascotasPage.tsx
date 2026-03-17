import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { FileText, Plus, Search, Calendar, Eye, Edit, Trash2, Heart, User, Users, Stethoscope, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardPlus, TrendingUp, Activity, Syringe, CheckCircle, XCircle, Save, Undo2, UserX, Hash, Phone } from "lucide-react";
import { useHistorialMascotas, HistorialMascota } from "../hooks/useHistorialMascotas";
import { useClientes } from "../hooks/useClientes";
import { useMascotas } from "../hooks/useMascotas";
import { useUsuario } from "../hooks/useUsuario";
import { useEmpleados } from "../hooks/useEmpleados";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ConsultaMedicaModal } from "../modals/ConsultaMedicaModal";

export function HistorialMascotasPage() {
  const { historiales, loading, cargarHistoriales, crearEntradaHistorial, actualizarEntradaHistorial, eliminarEntradaHistorial } = useHistorialMascotas();

  const toSentenceCase = (str: string = '') => {
    if (!str) return '';
    const s = str.trim().toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const [busqueda, setBusqueda] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, entrada: null as HistorialMascota | null });

  // Nuevo flujo de navegación
  const [pasoActual, setPasoActual] = useState<'cliente' | 'mascota' | 'timeline' | 'formulario' | 'detalles' | 'reporteCompleto'>('cliente');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<any | null>(null);
  const [entradaSeleccionada, setEntradaSeleccionada] = useState<HistorialMascota | null>(null);

  // Paginación para Historial
  const [paginaActualMascota, setPaginaActualMascota] = useState(1);

  // Hooks para el formulario
  const { clientes } = useClientes();
  const { mascotas } = useMascotas();
  const { usuarios } = useUsuario();
  const { empleados } = useEmpleados();

  // Estado del formulario
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    tipoVisita: [] as string[],
    veterinario: '',
    motivoConsulta: '',
    sintomas: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: '',
    examenes: '',
    peso: '',
    temperatura: '',
    frecuenciaCardiaca: '',
    frecuenciaRespiratoria: '',
    proximaCita: '',
    observaciones: '',
    costo: '',
    vacunasAplicadas: '',
    receta: '',
    estado: 'activo' as any
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados para búsqueda de veterinario
  const [busquedaVetCedula, setBusquedaVetCedula] = useState("");
  const [doctoresFiltrados, setDoctoresFiltrados] = useState<any[]>([]);
  const [mostrarSugerenciasVet, setMostrarSugerenciasVet] = useState(false);
  const [vetSeleccionado, setVetSeleccionado] = useState<any>(null);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const historialFiltrado = historiales.filter(entrada => {
    const searchLow = busqueda.toLowerCase().trim();
    if (!searchLow) return true;

    return (
      entrada.id_historial.toString().includes(searchLow) ||
      (entrada.descripcion || '').toLowerCase().includes(searchLow) ||
      (entrada.diagnostico || '').toLowerCase().includes(searchLow) ||
      (entrada.tratamiento || '').toLowerCase().includes(searchLow) ||
      (entrada.nombreMascota || '').toLowerCase().includes(searchLow) ||
      (entrada.nombreCliente || '').toLowerCase().includes(searchLow) ||
      (entrada.veterinario || '').toLowerCase().includes(searchLow)
    );
  });

  const estadisticas = {
    total: historiales.length,
    hoy: historiales.filter(h => h.fecha === new Date().toISOString().split('T')[0]).length
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(historialFiltrado.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const historialPaginado = historialFiltrado.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  // Helpers para estilos
  const getTipoVisitaColor = (tipo: string) => {
    const tipos = {
      emergencia: "bg-red-600 text-white",
      cirugia: "bg-purple-600 text-white",
      consulta: "bg-blue-600 text-white",
      vacunacion: "bg-green-600 text-white",
      control: "bg-yellow-600 text-white",
      desparasitacion: "bg-orange-600 text-white",
      estetica: "bg-pink-600 text-white"
    };
    return tipos[tipo as keyof typeof tipos] || "bg-gray-600 text-white";
  };

  const handleBusquedaVetChange = (valor: string, listaDoctores: any[]) => {
    setBusquedaVetCedula(valor);
    if (valor.trim().length > 0) {
      const matches = listaDoctores.filter(d =>
        (d.cedula || '').toLowerCase().startsWith(valor.toLowerCase()) ||
        (d.nombre || '').toLowerCase().includes(valor.toLowerCase())
      );
      setDoctoresFiltrados(matches);
      setMostrarSugerenciasVet(true);

      // Si hay un match exacto por cédula, seleccionarlo automáticamente
      const matchExacto = listaDoctores.find(d => d.cedula === valor);
      if (matchExacto) {
        seleccionarVeterinario(matchExacto);
        setMostrarSugerenciasVet(false);
      }
    } else {
      setDoctoresFiltrados([]);
      setMostrarSugerenciasVet(false);
    }
  };

  const seleccionarVeterinario = (doctor: any) => {
    setFormData(prev => ({ ...prev, veterinario: doctor.nombre }));
    setVetSeleccionado(doctor);
    setBusquedaVetCedula(doctor.cedula || doctor.nombre);
    setMostrarSugerenciasVet(false);
    toast.success(`Veterinario ${doctor.nombre} seleccionado`);
  };

  const handleGuardarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const petId = (mascotaSeleccionada?.id_mascota) || (entradaSeleccionada?.id_mascota) || (selectedPetId ? parseInt(selectedPetId) : null);

    if (!petId) {
      toast.error("Debes seleccionar una mascota");
      return;
    }
    if (!formData.veterinario) {
      toast.error("El veterinario es requerido o no se ha encontrado");
      return;
    }
    if (formData.tipoVisita.length === 0) {
      toast.error("Selecciona al menos un tipo de visita");
      return;
    }

    const payload = {
      ...formData,
      id_mascota: petId,
      peso: formData.peso ? parseFloat(formData.peso) : null,
      temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
      frecuenciaCardiaca: formData.frecuenciaCardiaca ? parseInt(formData.frecuenciaCardiaca) : null,
      frecuenciaRespiratoria: formData.frecuenciaRespiratoria ? parseInt(formData.frecuenciaRespiratoria) : null,
      costo: formData.costo ? parseFloat(formData.costo) : null,
      nombreMascota: mascotaSeleccionada?.nombre || entradaSeleccionada?.nombreMascota || 'Mascota',
      nombreCliente: clienteSeleccionado?.nombre || entradaSeleccionada?.nombreCliente || 'Cliente'
    };

    let result;
    if (entradaSeleccionada) {
      result = await actualizarEntradaHistorial(entradaSeleccionada.id_historial, payload as any);
    } else {
      result = await crearEntradaHistorial(payload as any);
    }

    if (result.success) {
      toast.success(entradaSeleccionada ? "Historial actualizado" : "Historial creado");
      setPasoActual('cliente');
      setEntradaSeleccionada(null);
      resetForm();
      cargarHistoriales();
    } else {
      toast.error(result.error || "Error al guardar");
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      tipoVisita: [],
      veterinario: '',
      motivoConsulta: '',
      sintomas: '',
      diagnostico: '',
      tratamiento: '',
      medicamentos: '',
      examenes: '',
      peso: '',
      temperatura: '',
      frecuenciaCardiaca: '',
      frecuenciaRespiratoria: '',
      proximaCita: '',
      observaciones: '',
      costo: '',
      vacunasAplicadas: '',
      receta: '',
      estado: 'activo'
    });
    setSelectedClientId('');
    setSelectedPetId('');
    setErrors({});
    setBusquedaVetCedula('');
    setDoctoresFiltrados([]);
    setMostrarSugerenciasVet(false);
    setVetSeleccionado(null);
  };

  const handleEliminarEntrada = async () => {
    if (!deleteDialog.entrada) return;

    const result = await eliminarEntradaHistorial(deleteDialog.entrada.id_historial);
    if (result.success) {
      toast.success("Entrada de historial eliminada exitosamente");
      setDeleteDialog({ isOpen: false, entrada: null });
    } else {
      toast.error(result.error || "Error al eliminar entrada");
    }
  };

  const handleCambiarEstado = async (entrada: HistorialMascota, nuevoEstado: 'activo' | 'inactivo') => {
    const result = await actualizarEntradaHistorial(entrada.id_historial, { estado: nuevoEstado as any });
    if (result.success) {
      toast.success(`Estado cambiado to ${nuevoEstado}`);
    } else {
      toast.error("Error al cambiar estado");
    }
  };

  const abrirFormulario = (entrada?: HistorialMascota) => {
    if (entrada) {
      setEntradaSeleccionada(entrada);
      setFormData({
        fecha: entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] : entrada.fecha,
        hora: (entrada as any).hora || new Date().toTimeString().slice(0, 5),
        tipoVisita: Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita : [],
        veterinario: entrada.veterinario || '',
        motivoConsulta: (entrada as any).motivoConsulta || '',
        sintomas: (entrada as any).sintomas ? (typeof (entrada as any).sintomas === 'string' ? (entrada as any).sintomas : JSON.stringify((entrada as any).sintomas)) : '',
        diagnostico: entrada.diagnostico || '',
        tratamiento: entrada.tratamiento || '',
        medicamentos: entrada.medicamentos ? (typeof entrada.medicamentos === 'string' ? entrada.medicamentos : JSON.stringify(entrada.medicamentos)) : '',
        examenes: entrada.examenes ? (typeof entrada.examenes === 'string' ? entrada.examenes : JSON.stringify(entrada.examenes)) : '',
        peso: entrada.peso?.toString() || '',
        temperatura: entrada.temperatura?.toString() || '',
        frecuenciaCardiaca: entrada.frecuenciaCardiaca?.toString() || '',
        frecuenciaRespiratoria: entrada.frecuenciaRespiratoria?.toString() || '',
        proximaCita: entrada.proximaCita ? (entrada.proximaCita.includes('T') ? entrada.proximaCita.split('T')[0] : entrada.proximaCita) : '',
        observaciones: entrada.observaciones || '',
        costo: entrada.costo?.toString() || '',
        vacunasAplicadas: entrada.vacunasAplicadas ? (typeof entrada.vacunasAplicadas === 'string' ? entrada.vacunasAplicadas : JSON.stringify(entrada.vacunasAplicadas)) : '',
        receta: (entrada as any).receta || '',
        estado: entrada.estado as any
      });
      if (entrada.mascota) {
        setMascotaSeleccionada(entrada.mascota);
        if (entrada.mascota.cliente) {
          setClienteSeleccionado(entrada.mascota.cliente);
        }
      }
      setSelectedClientId(entrada.mascota?.id_cliente?.toString() || clienteSeleccionado?.id_cliente?.toString() || '');
      setSelectedPetId(entrada.id_mascota?.toString() || mascotaSeleccionada?.id_mascota?.toString() || '');
    } else {
      setEntradaSeleccionada(null);
      resetForm();
      setSelectedClientId(clienteSeleccionado?.id_cliente?.toString() || '');
      setSelectedPetId(mascotaSeleccionada?.id_mascota?.toString() || '');
    }
    setPasoActual('formulario');
  };

  const cerrarVistaActual = () => {
    setPasoActual('cliente');
    setEntradaSeleccionada(null);
  };

  const abrirDetalles = (entrada: HistorialMascota) => {
    setEntradaSeleccionada(entrada);
    setPasoActual('detalles');
  };

  const handleConsultaMedica = async (data: { motivoConsulta: string; diagnostico: string; tratamiento: string }) => {
    if (!entradaSeleccionada) return { success: false };

    const historialData = {
      ...entradaSeleccionada,
      motivoConsulta: data.motivoConsulta,
      diagnostico: data.diagnostico,
      tratamiento: data.tratamiento,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
    };

    const result = await actualizarEntradaHistorial(entradaSeleccionada.id_historial, historialData);
    if (result.success) {
      toast.success("Consulta médica registrada exitosamente");
      return { success: true };
    } else {
      toast.error(result.error || "Error al registrar consulta médica");
      return { success: false };
    }
  };

  const abrirConsultaMedica = (entrada: HistorialMascota) => {
    setEntradaSeleccionada(entrada);
    setPasoActual('formulario');
  };

  function renderReporteDetallado(entrada: HistorialMascota) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 animate-in fade-in duration-500 pb-20">
        {/* Header Estilo Captura */}
        <nav className="sticky top-0 z-[100] px-10 py-6 bg-white/80 backdrop-blur-md border-b border-slate-200 mb-8 relative flex items-center">
          {/* Back button — left */}
          <button
            onClick={cerrarVistaActual}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 relative z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Title — absolute center */}
          <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Informe clínico detallado</h2>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Expediente médico #{entrada.id_historial}</p>
          </div>

          {/* Action button — right */}
          <div className="ml-auto relative z-10">
            <Button
              onClick={() => setPasoActual('reporteCompleto')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <FileText className="w-4 h-4" /> Generar reporte histórico
            </Button>
          </div>
        </nav>

        <main className="px-10 max-w-[1400px] mx-auto w-full space-y-8">

          {/* Fila Superior de 3 Columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Card 1: Mascota */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <h3 className="text-2xl font-black text-slate-800 mb-0.5">{toSentenceCase(entrada.mascota?.nombre)}</h3>
              <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-5">Paciente</span>

              <div className="w-full space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Edad</p>
                    <p className="text-sm font-bold text-emerald-600">{entrada.mascota?.edad || '--'} años</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Peso</p>
                    <p className="text-sm font-bold text-blue-600">{entrada.peso || '--'} kg</p>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ESPECIE / RAZA</p>
                  <p className="text-sm font-bold text-slate-600">{entrada.mascota?.especie} - {entrada.mascota?.raza || 'N/A'}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">TIPO DE VISITA</p>
                  <p className="text-sm font-bold text-slate-600">{Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita.join(', ') : (entrada.tipoVisita || 'N/A')}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">MOTIVO DE CONSULTA</p>
                  <p className="text-sm font-bold text-slate-600 line-clamp-2">{entrada.motivoConsulta || entrada.descripcion || 'No especificado'}</p>
                </div>
              </div>
            </section>

            {/* Card 2: Propietario */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-2xl font-black text-slate-800 mb-0.5">{toSentenceCase(entrada.mascota?.cliente?.nombre)}</h3>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-5">Propietario</span>

              <div className="w-full space-y-2">
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CÉDULA</p>
                  <p className="text-sm font-bold text-slate-600">{entrada.mascota?.cliente?.cedula || 'N/A'}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">TELÉFONO</p>
                  <p className="text-sm font-bold text-slate-600">{entrada.mascota?.cliente?.telefono || 'Sin teléfono'}</p>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">DIRECCIÓN</p>
                  <p className="text-sm font-bold text-slate-600 line-clamp-2">{entrada.mascota?.cliente?.direccion || 'Sin dirección'}</p>
                </div>
              </div>
            </section>

            {/* Card 3: Información de Visita */}
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">INFORMACIÓN DE VISITA</h5>

              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-center text-blue-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">FECHA</p>
                    <p className="text-sm font-bold text-slate-700">{entrada.fecha ? new Date(entrada.fecha).toLocaleDateString('es-ES') : '--/--/----'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">HORA</p>
                    <p className="text-sm font-bold text-slate-700">{(entrada as any).hora || '00:00'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">VETERINARIO</p>
                    <p className="text-sm font-bold text-slate-700">{toSentenceCase(entrada.veterinario || 'Dr. Asignado')}</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Secciones de Ancho Completo */}
          <div className="space-y-6">

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">DIAGNÓSTICO Y EVOLUCIÓN</h3>
              </div>
              <div className="p-10 min-h-[180px]">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {entrada.diagnostico || 'Sin información de diagnóstico registrada.'}
                </p>
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">TRATAMIENTO REALIZADO</h3>
              </div>
              <div className="p-10 min-h-[180px]">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {entrada.tratamiento || 'Sin información de tratamiento registrada.'}
                </p>
              </div>
            </section>

          </div>

        </main>
      </div>
    );
  }

  function renderFormularioHistorial() {
    const isEdit = !!entradaSeleccionada;

    // Deduplicar doctores (Usuario + Empleado)
    const doctores = [
      ...usuarios
        .filter(u => {
          const roleName = u.roles?.nombre_rol?.toLowerCase();
          return roleName === 'veterinario' || roleName === 'administrador' || roleName === 'admin';
        })
        .map(u => ({ id: `user-${u.id_usuario}`, nombre: `Dr. ${u.nombre_usuario}`, cedula: (u as any).cedula })),
      ...empleados
        .filter(e => e.cargo?.toLowerCase() === 'veterinario')
        .map(e => ({ id: `emp-${e.id_empleado}`, nombre: `Dr. ${e.nombre}`, cedula: e.cedula }))
    ].filter((v, i, a) => a.findIndex(t => t.nombre === v.nombre) === i);

    const visitTypes = [
      { id: 'consulta', label: 'Consulta', color: 'blue', icon: Activity },
      { id: 'vacunacion', label: 'Vacunación', color: 'emerald', icon: Syringe },
      { id: 'cirugia', label: 'Cirugía', color: 'purple', icon: Stethoscope },
      { id: 'emergencia', label: 'Emergencia', color: 'rose', icon: Activity },
      { id: 'control', label: 'Control', color: 'sky', icon: Calendar },
      { id: 'desparasitacion', label: 'Desparasitación', color: 'orange', icon: Syringe },
      { id: 'estetica', label: 'Estética', color: 'pink', icon: Heart }
    ];

    const toggleTipoVisita = (tipo: string) => {
      setFormData(prev => {
        const current = prev.tipoVisita;
        const updated = current.includes(tipo)
          ? current.filter(t => t !== tipo)
          : [...current, tipo];
        return { ...prev, tipoVisita: updated };
      });
    };

    return (
      <div className="flex flex-col bg-dark-bg min-h-screen animate-in fade-in slide-in-from-right-10 duration-700">
        {/* Header Superior - Profesional & Minimalista */}
        <header className="bg-dark-card/80 backdrop-blur-xl border-b border-white/5 px-10 py-6 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={cerrarVistaActual}
              className="text-dark-secondary hover:text-dark-primary hover:bg-white/5 rounded-2xl w-12 h-12 p-0 transition-all border border-transparent hover:border-white/10"
            >
              <Undo2 className="w-6 h-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-blue-500 w-1.5 h-6 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h2 className="text-2xl font-black text-dark-primary tracking-tighter">
                  {isEdit ? 'Actualización de Expediente' : 'Nueva Entrada Clínica'}
                </h2>
              </div>
              <p className="text-[10px] text-dark-secondary font-black tracking-[0.2em] pl-4.5 opacity-40 uppercase">
                {isEdit ? `Referencia de Registro: #${entradaSeleccionada.id_historial}` : 'Protocolo de Emergencia & Consulta General'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conexión Segura
              </span>
            </div>
          </div>
        </header>

        <form onSubmit={handleGuardarFormulario} className="flex flex-1 overflow-hidden">
          {/* Sidebar de Contexto del Paciente */}
          <aside className="w-96 bg-dark-card/30 border-r border-white/5 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-8 space-y-8">
              {/* Card de Información del Paciente */}
              <div className="bg-dark-card border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Paciente */}
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20 shadow-inner">
                      <Heart className="w-7 h-7 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-1">Paciente</p>
                      <h4 className="text-xl font-black text-dark-primary tracking-tight leading-none uppercase">
                        {mascotaSeleccionada?.nombre || '---'}
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-dark-secondary uppercase tracking-widest mb-1 opacity-40">Edad</p>
                      <p className="text-xs font-bold text-emerald-400 truncate">{mascotaSeleccionada?.edad ? `${mascotaSeleccionada.edad} años` : '---'}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-dark-secondary uppercase tracking-widest mb-1 opacity-40">Peso</p>
                      <p className="text-xs font-bold text-blue-400 truncate">{mascotaSeleccionada?.peso ? `${mascotaSeleccionada.peso} kg` : '---'}</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full" />

                {/* Propietario */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5 opacity-80">Propietario</p>
                      <h4 className="text-sm font-black text-dark-primary tracking-tight truncate max-w-[150px]">
                        {clienteSeleccionado?.nombre || '---'}
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-2 pl-2">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-dark-secondary bg-white/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{clienteSeleccionado?.telefono || 'Sin contacto'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-dark-secondary bg-white/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                      <Hash className="w-3 h-3 text-slate-500" />
                      <span>{clienteSeleccionado?.cedula || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selección del Profesional Responsable */}
              <div className="space-y-4 px-2">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-4 h-4 text-blue-400" />
                  <Label className="text-[10px] font-black text-dark-secondary uppercase tracking-[0.2em]">Médico Veterinario <span className="text-red-500">*</span></Label>
                </div>

                <div className="relative">
                  <Input
                    value={busquedaVetCedula}
                    onChange={(e) => handleBusquedaVetChange(e.target.value, doctores)}
                    placeholder="Buscar por nombre o cédula..."
                    className="h-14 bg-dark-card border-white/5 rounded-2xl text-[11px] font-bold text-dark-primary focus:ring-blue-500/30 transition-all shadow-xl px-12"
                    onBlur={() => setTimeout(() => setMostrarSugerenciasVet(false), 200)}
                    onFocus={() => busquedaVetCedula && setMostrarSugerenciasVet(true)}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-secondary opacity-30" />

                  {mostrarSugerenciasVet && doctoresFiltrados.length > 0 && (
                    <div className="absolute z-[100] w-full mt-2 bg-dark-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {doctoresFiltrados.map(doc => (
                        <button
                          key={doc.id}
                          type="button"
                          className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors group"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            seleccionarVeterinario(doc);
                          }}
                        >
                          <p className="text-[11px] font-bold text-dark-primary tracking-tighter group-hover:text-blue-400 transition-colors">{doc.nombre}</p>
                          <p className="text-[9px] text-dark-secondary tracking-widest opacity-60">Matrícula: {doc.cedula || '---'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {vetSeleccionado && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Activity className="w-3 h-3 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Médico Activo</p>
                        <h5 className="text-[11px] font-bold text-dark-primary tracking-tighter">{vetSeleccionado.nombre}</h5>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calendario de Entrada */}
              <div className="space-y-4 px-2">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <Label className="text-[10px] font-black text-dark-secondary uppercase tracking-[0.2em]">Fecha de Atención</Label>
                </div>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="h-14 bg-dark-card border-white/5 rounded-2xl text-dark-primary font-black focus:ring-blue-500/30 shadow-xl"
                />
              </div>
            </div>
          </aside>

          {/* Área de Trabajo Clínica */}
          <main className="flex-1 bg-dark-bg p-12 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-12">
              {/* Selector de Categoría */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                    <h3 className="text-lg font-black text-dark-primary tracking-tight uppercase">Categoría del Registro <span className="text-red-500 ml-1">*</span></h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {visitTypes.map(type => {
                    const Icon = type.icon;
                    const isSelected = formData.tipoVisita.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleTipoVisita(type.id)}
                        className={`px-6 py-4 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-4 group relative overflow-hidden ${isSelected
                          ? `bg-dark-card border-${type.color}-500/50 text-${type.color}-400 shadow-lg scale-105 z-10`
                          : 'bg-dark-card/50 border-white/5 text-dark-secondary opacity-50 hover:opacity-100 hover:border-white/20'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${isSelected ? `bg-${type.color}-400 animate-pulse` : 'bg-white/10'}`} />
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isSelected ? `text-${type.color}-400` : 'text-slate-500'}`} />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Área de Diagnóstico Especializada */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.3)]" />
                    <h3 className="text-lg font-black text-dark-primary tracking-tight uppercase">Diagnóstico y Evolución <span className="text-red-500 ml-1">*</span></h3>
                  </div>
                </div>
                <div className="relative bg-dark-card/40 border border-white/5 rounded-[3rem] p-2 focus-within:border-pink-500/40 focus-within:bg-dark-card transition-all duration-500 shadow-2xl overflow-hidden">
                  <Textarea
                    placeholder="Describa a detalle: Síntomas observados, hallazgos en la exploración física, constantes vitales y evolución clínica esperada..."
                    value={formData.diagnostico}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
                    className="bg-transparent border-none text-lg text-dark-primary placeholder:text-dark-secondary/20 min-h-[350px] p-10 focus-visible:ring-0 leading-relaxed resize-none relative z-10 font-medium"
                  />
                </div>
              </div>

              {/* Protocolo de Tratamiento */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  <h3 className="text-lg font-black text-dark-primary tracking-tight uppercase">Tratamiento & Recomendaciones</h3>
                </div>
                <div className="bg-dark-card/30 border border-white/5 rounded-[2.5rem] p-2 focus-within:border-emerald-500/40 focus-within:bg-dark-card transition-all duration-500 shadow-xl overflow-hidden">
                  <Textarea
                    placeholder="Prescripción médica, dosis, frecuencia, recomendaciones nutricionales..."
                    value={formData.tratamiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, tratamiento: e.target.value }))}
                    className="bg-transparent border-none text-sm text-dark-primary placeholder:text-dark-secondary/10 min-h-[180px] p-8 focus-visible:ring-0 leading-relaxed resize-none font-medium"
                  />
                </div>
              </div>

              {/* Footer de Acciones */}
              <footer className="footer-actions flex items-center justify-end gap-5 pt-12 border-t border-white/5 pb-12">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cerrarVistaActual}
                  className="h-16 px-12 border border-white/5 text-dark-secondary hover:text-dark-primary hover:bg-white/5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-16 px-14 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[10px] transition-all shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] flex items-center gap-3 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Certificar Actualización' : 'Guardar en Historial'}
                </Button>
              </footer>
            </div>
          </main>
        </form>
      </div>
    );
  };

  const renderSeleccionCliente = () => {
    const clientesFiltrados = clientes.filter(c =>
      (c.cedula || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
      <div className="flex flex-col min-h-screen bg-[#050607] animate-in fade-in duration-1000 relative">
        {/* Ambient background particles/glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/5 rounded-full blur-[120px]" />
        </div>

        <main className="max-w-7xl mx-auto w-full px-10 py-20 space-y-24 relative z-10">
          {/* Immersive Header */}
          <section className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 backdrop-blur-md mb-4 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">KaiVet Clinical Hub</span>
            </div>
            <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.9] mb-8">
              Gestión Integral de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-400 italic">Historias Clínicas</span>
            </h1>
            <p className="text-dark-secondary text-xl font-medium opacity-60 max-w-2xl mx-auto leading-relaxed">
              Sistema avanzado de centralización médica. Localice a un propietario para iniciar una consulta o revisar la cronología vital de sus pacientes.
            </p>
          </section>

          {/* Immersive Search Box */}
          <section className="relative max-w-4xl mx-auto group">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
            <div className="absolute inset-0 bg-blue-600/5 blur-[80px] rounded-full group-focus-within:bg-blue-600/10 transition-all duration-700" />

            <div className="relative flex items-center gap-6 bg-[#0a0b0d]/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] focus-within:border-blue-500/30 transition-all duration-500">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Search className="w-10 h-10 text-blue-400" />
              </div>
              <Input
                placeholder="Identificación o nombre completo del propietario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-20 border-none bg-transparent text-2xl font-black text-white focus-visible:ring-0 placeholder:text-dark-secondary/20 shadow-none tracking-tight"
              />
            </div>
          </section>

          {/* Dynamic Selection Results */}
          {busqueda && (
            <section className="space-y-10 max-w-5xl mx-auto animate-in slide-in-from-top-12 duration-700">
              <div className="flex items-center gap-8">
                <div className="h-[2px] flex-1 bg-gradient-to-l from-white/5 to-transparent" />
                <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.5em] opacity-80">Propietarios Identificados</h3>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {clientesFiltrados.map(cliente => (
                  <button
                    key={cliente.id_cliente}
                    onClick={() => {
                      setClienteSeleccionado(cliente);
                      setPasoActual('mascota');
                      setBusqueda('');
                    }}
                    className="group relative flex items-center gap-8 p-8 bg-[#0a0b0d]/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] hover:bg-[#121418] hover:border-blue-500/40 transition-all duration-500 text-left shadow-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-blue-500/10 to-indigo-600/10 p-px transition-all duration-700 group-hover:rotate-6 shadow-xl">
                      <div className="w-full h-full rounded-[1.7rem] bg-[#050607] flex items-center justify-center">
                        <User className="w-9 h-9 text-blue-400 group-hover:text-blue-300" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 relative z-10 space-y-2">
                      <h3 className="text-2xl font-black text-white truncate group-hover:text-blue-400 transition-colors tracking-tighter">
                        {toSentenceCase(cliente.nombre)}
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-dark-secondary uppercase tracking-widest border border-white/5">
                          ID: {cliente.cedula || '---'}
                        </span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-60">
                          {cliente.telefono || 'SIN CONTACTO'}
                        </span>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-8 transition-all duration-700">
                      <ChevronRight className="w-6 h-6 text-blue-400" />
                    </div>
                  </button>
                ))}

                {clientesFiltrados.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-[#0a0b0d]/30 rounded-[4rem] border border-dashed border-white/5 shadow-inner">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5">
                      <UserX className="w-12 h-12 text-dark-secondary opacity-40" />
                    </div>
                    <h3 className="text-2xl font-black text-white opacity-40">Sin coincidencias exactas</h3>
                    <p className="text-sm text-dark-secondary opacity-20 font-bold uppercase tracking-widest mt-2">Verifique los datos o registre un nuevo cliente</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Global Records Visual List - Professional Table Overhaul */}
          <section className="space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-[0_4px_20px_rgba(59,130,246,0.25)]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter">Registros Médicos Globales</h3>
                </div>
                <p className="text-[10px] font-black text-dark-secondary uppercase tracking-[0.4em] opacity-40 ml-1">Monitoreo histórico de actividad clínica institucional</p>
              </div>
              <div className="px-6 py-3 bg-[#0a0b0d] border border-white/10 rounded-[1.5rem] shadow-xl">
                <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none">
                  <span className="text-blue-500">{historialFiltrado.length}</span> Entradas Totales
                </span>
              </div>
            </header>

            <div className="bg-[#0a0b0d]/30 border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

              <div className="overflow-x-auto relative z-10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent bg-white/5 border-b-2">
                      <TableHead className="text-white font-black text-[10px] tracking-[0.3em] py-10 px-10 uppercase opacity-30">Folio Clínico</TableHead>
                      <TableHead className="text-white font-black text-[10px] tracking-[0.3em] py-10 px-10 uppercase opacity-30">Identidad Paciente</TableHead>
                      <TableHead className="text-white font-black text-[10px] tracking-[0.3em] py-10 px-10 uppercase opacity-30 text-center">Cronometría</TableHead>
                      <TableHead className="text-white font-black text-[10px] tracking-[0.3em] py-10 px-10 uppercase opacity-30">Categorización</TableHead>
                      <TableHead className="text-white font-black text-[10px] tracking-[0.3em] py-10 px-10 uppercase opacity-30">Facultativo</TableHead>
                      <TableHead className="text-white font-black text-[10px] tracking-[0.3em] py-10 px-10 uppercase opacity-30 text-center">Gestión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialPaginado.map((entrada) => (
                      <TableRow key={entrada.id_historial} className="border-white/5 hover:bg-white/[0.03] transition-all group/row">
                        <TableCell className="py-8 px-10">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-blue-500 opacity-20 group-hover/row:opacity-100 transition-all shadow-[0_0_10px_rgba(59,130,246,1)]" />
                            <span className="text-base font-black text-white/90 tracking-tighter">00{entrada.id_historial}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-8 px-10">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0 group-hover/row:scale-110 transition-transform duration-500">
                              <Heart className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-lg font-black text-white group-hover/row:text-pink-400 transition-colors tracking-tight leading-none mb-2">
                                {entrada.nombreMascota}
                              </p>
                              <p className="text-[10px] font-bold text-dark-secondary italic opacity-40 uppercase tracking-widest">
                                Propietario: {toSentenceCase(entrada.nombreCliente)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-8 px-10 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="text-sm font-black text-white/80">
                              {new Date(entrada.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
                            </span>
                            <div className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-dark-secondary tracking-[0.2em]">{(entrada as any).hora || '--:--'} HS</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-8 px-10">
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita.slice(0, 1).map((tipo, idx) => (
                              <span key={idx} className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border ${tipo.includes('emergencia') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                tipo.includes('vacunacion') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                {tipo}
                              </span>
                            )) : (
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border bg-blue-500/10 text-blue-400 border-blue-500/20`}>
                                {entrada.tipoVisita}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-8 px-10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                              <Stethoscope className="w-4 h-4 text-blue-400/60" />
                            </div>
                            <span className="text-xs font-bold text-white/50 italic">{entrada.veterinario || 'F. General'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-8 px-10 text-center">
                          <div className="flex items-center justify-center gap-3 opacity-0 group-hover/row:opacity-100 transition-all duration-500 -translate-x-4 group-hover/row:translate-x-0">
                            <Button
                              onClick={() => abrirDetalles(entrada)}
                              variant="ghost"
                              size="icon"
                              className="w-12 h-12 rounded-[1.2rem] bg-white/5 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                            >
                              <Eye className="w-5 h-5" />
                            </Button>
                            <Button
                              onClick={() => abrirFormulario(entrada)}
                              variant="ghost"
                              size="icon"
                              className="w-12 h-12 rounded-[1.2rem] bg-white/5 hover:bg-yellow-600 hover:text-white transition-all shadow-lg"
                            >
                              <Edit className="w-5 h-5" />
                            </Button>
                            <Button
                              onClick={() => setDeleteDialog({ isOpen: true, entrada })}
                              variant="ghost"
                              size="icon"
                              className="w-12 h-12 rounded-[1.2rem] bg-white/5 hover:bg-red-600 hover:text-white transition-all shadow-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {historialPaginado.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-6 text-dark-secondary opacity-15">
                            <Activity className="w-20 h-20 animate-pulse" />
                            <p className="font-black uppercase tracking-[0.5em] text-[12px]">Sin registros identificados en base de datos</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Advanced Pagination UI */}
              {totalPages > 1 && (
                <footer className="flex items-center justify-between p-12 bg-white/[0.02] border-t border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Indexación de Consultas</span>
                    <span className="text-xs font-bold text-white/60">Segmento {currentPage} de {totalPages}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button onClick={() => goToPage(1)} disabled={currentPage === 1} className="w-12 h-12 p-0 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"><ChevronsLeft className="w-5 h-5" /></Button>
                    <Button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="w-12 h-12 p-0 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></Button>

                    <div className="flex gap-2 mx-4">
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${currentPage === i + 1 ? 'w-12 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'w-2 bg-white/10'}`} />
                      ))}
                    </div>

                    <Button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="w-12 h-12 p-0 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"><ChevronRight className="w-5 h-5" /></Button>
                    <Button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="w-12 h-12 p-0 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"><ChevronsRight className="w-5 h-5" /></Button>
                  </div>
                </footer>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const renderSeleccionMascota = () => {
    const mascotasDelCliente = mascotas.filter(m => m.id_cliente === clienteSeleccionado?.id_cliente);

    return (
      <div className="flex flex-col min-h-screen bg-[#050607] animate-in fade-in slide-in-from-right-12 duration-1000 relative">
        {/* Atmosphere */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-pink-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[100px]" />
        </div>

        {/* Dynamic Toolbar */}
        <header className="px-10 py-6 border-b border-white/5 bg-dark-card/30 backdrop-blur-3xl flex justify-between items-center sticky top-0 z-50">
          <Button
            variant="ghost"
            onClick={() => setPasoActual('cliente')}
            className="text-dark-secondary hover:text-dark-primary hover:bg-white/5 rounded-[1.2rem] gap-3 font-black text-xs tracking-widest uppercase transition-all px-6 border border-white/5 h-14"
          >
            <ChevronLeft className="w-5 h-5" />
            Vuelve a Propietarios
          </Button>
          <div className="flex items-center gap-4 px-6 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-[10px] font-black text-dark-secondary uppercase tracking-[0.3em]">Selección de Paciente</span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto w-full px-10 py-20 space-y-24 relative z-10">
          {/* Propietario Profile Hero */}
          <section className="relative group">
            <div className="bg-gradient-to-br from-[#121418] to-[#0a0b0d] border border-white/10 rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-blue-500/15 transition-colors duration-1000" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                <div className="w-40 h-40 rounded-[3.5rem] bg-gradient-to-br from-blue-500/20 via-indigo-600/20 to-blue-500/20 p-px group-hover:scale-110 transition-transform duration-700 shadow-2xl">
                  <div className="w-full h-full rounded-[3.45rem] bg-[#050607] flex items-center justify-center">
                    <User className="w-20 h-20 text-blue-400 drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)]" />
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-8">
                  <div className="space-y-2">
                    <h1 className="text-6xl font-black text-white tracking-tighter leading-none mb-3">
                      {clienteSeleccionado?.nombre}
                    </h1>
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Titular de Cuenta #0{clienteSeleccionado?.id_cliente}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-12 text-sm">
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-black text-dark-secondary uppercase tracking-widest opacity-40">Documento</span>
                      <div className="flex items-center gap-3">
                        <Hash className="w-4 h-4 text-white/20" />
                        <span className="text-lg font-black text-white">{clienteSeleccionado?.cedula || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="w-px h-12 bg-white/5 hidden md:block" />
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-black text-dark-secondary uppercase tracking-widest opacity-40">Contacto Directo</span>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-emerald-500/50" />
                        <span className="text-lg font-black text-white">{clienteSeleccionado?.telefono || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Patients Grid */}
          <section className="space-y-12">
            <header className="flex items-center justify-between px-6 border-b border-white/5 pb-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                  <Heart className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Pacientes Vinculados</h2>
              </div>
              <div className="px-6 py-2 bg-[#0a0b0d] rounded-full border border-white/10">
                <span className="text-[11px] font-black text-dark-secondary uppercase tracking-widest opacity-60">
                  {mascotasDelCliente.length} {mascotasDelCliente.length === 1 ? 'Paciente' : 'Pacientes'} en Sistema
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {mascotasDelCliente.length > 0 ? (
                mascotasDelCliente.map(mascota => (
                  <button
                    key={mascota.id_mascota}
                    onClick={() => {
                      setMascotaSeleccionada(mascota);
                      setPasoActual('timeline');
                    }}
                    className="group relative bg-[#0a0b0d]/50 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] p-12 text-center hover:bg-[#121418] hover:border-pink-500/30 hover:scale-[1.03] transition-all duration-700 shadow-2xl overflow-hidden active:scale-95 text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-pink-500/0 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative z-10">
                      <div className="w-32 h-32 rounded-[3.5rem] bg-[#050607] border-2 border-white/5 flex items-center justify-center mx-auto mb-10 transition-all duration-700 group-hover:border-pink-500/40 relative shadow-2xl">
                        <div className="absolute inset-4 rounded-[2.5rem] bg-gradient-to-br from-pink-500/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <Heart className="w-12 h-12 text-pink-500 relative z-20 group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-[1.2rem] bg-pink-500 border-4 border-[#0a0b0d] shadow-xl flex items-center justify-center group-hover:rotate-[360deg] transition-transform duration-1000">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <h3 className="text-3xl font-black text-white tracking-tighter mb-4 text-center group-hover:text-pink-400 transition-colors">
                        {mascota.nombre}
                      </h3>

                      <div className="flex flex-col items-center gap-3">
                        <span className="px-6 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-dark-secondary uppercase tracking-[0.3em] border border-white/10 group-hover:border-pink-500/20 group-hover:text-pink-300 transition-all">
                          {mascota.especie}
                        </span>
                        <p className="text-xs font-bold text-dark-secondary opacity-40 italic tracking-tight">Raza: {mascota.raza || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-3 group-hover:text-white transition-colors">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-dark-secondary group-hover:text-pink-400">Ver Expediente</span>
                      <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full py-32 text-center bg-[#0a0b0d]/20 rounded-[4rem] border border-dashed border-white/10 shadow-inner">
                  <Activity className="w-20 h-20 text-dark-secondary opacity-15 mx-auto mb-8 animate-pulse" />
                  <h3 className="text-3xl font-black text-white opacity-40 tracking-tighter">Sin pacientes vinculados</h3>
                  <p className="text-sm text-dark-secondary opacity-20 font-black uppercase tracking-[0.4em] mt-4">No se han registrado mascotas para este perfil de usuario.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  };

  function renderTimeline() {
    const historialDeLaMascota = historiales
      .filter(h => h.id_mascota === mascotaSeleccionada?.id_mascota)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const elementosPorPaginaMascota = 5;
    const totalPaginas = Math.ceil(historialDeLaMascota.length / elementosPorPaginaMascota);
    const indiceInicio = (paginaActualMascota - 1) * elementosPorPaginaMascota;
    const indiceFin = indiceInicio + elementosPorPaginaMascota;
    const historialesPaginados = historialDeLaMascota.slice(indiceInicio, indiceFin);

    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 animate-in fade-in duration-500 relative selection:bg-blue-600/10">
        <header className="px-10 py-6 border-b border-slate-200 bg-white/90 backdrop-blur-md flex justify-between items-center sticky top-0 z-[100] shadow-sm">
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              onClick={() => setPasoActual('mascota')}
              className="w-10 h-10 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Trayectoria Clínica</p>
              <h2 className="text-lg font-black text-slate-900 uppercase">Historial de Consultas</h2>
            </div>
          </div>

          <Button
            onClick={() => abrirFormulario()}
            className="bg-slate-900 text-white font-bold text-[11px] px-8 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-3"
          >
            <Plus className="w-4 h-4" /> NUEVA CONSULTA
          </Button>
        </header>

        <main className="max-w-5xl mx-auto w-full px-8 py-16 space-y-20 relative z-10">

          {/* Identity Card */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-5xl font-black text-slate-800 shadow-inner">
              {(mascotaSeleccionada?.nombre || 'M').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">{mascotaSeleccionada?.nombre}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                  ID PACIENTE: #0{mascotaSeleccionada?.id_mascota}
                </span>
              </div>
            </div>
          </section>

          {/* Clean Timeline */}
          <section className="relative space-y-12">
            <div className="absolute left-[2.25rem] top-0 bottom-0 w-px bg-slate-200" />

            <div className="space-y-12">
              {historialesPaginados.length > 0 ? (
                historialesPaginados.map((entrada, idx) => (
                  <div key={entrada.id_historial} className="relative flex items-start gap-10">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm relative z-10 shrink-0">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:border-blue-200 transition-all group">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{entrada.fecha ? new Date(entrada.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '--/--/----'}</p>
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{entrada.motivoConsulta || entrada.descripcion}</h3>
                        </div>
                        <div className="flex gap-2">
                          {Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita.slice(0, 2).map((tipo, tIdx) => (
                            <span key={tIdx} className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest">{tipo}</span>
                          )) : null}
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mb-8 line-clamp-2">
                        {entrada.diagnostico || 'No se registró un diagnóstico detallado para esta sesión.'}
                      </p>

                      <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entrada.veterinario}</span>
                        </div>
                        <Button
                          onClick={() => abrirDetalles(entrada)}
                          variant="ghost"
                          className="text-[10px] font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-6 uppercase tracking-widest"
                        >
                          DETALLES
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <Activity className="w-12 h-12 text-slate-200 mx-auto" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin trayectoria registrada</p>
                </div>
              )}
            </div>
          </section>

          {/* Pagination */}
          {totalPaginas > 1 && (
            <footer className="flex justify-center items-center gap-4 pt-10">
              <Button
                onClick={() => setPaginaActualMascota(Math.max(1, paginaActualMascota - 1))}
                disabled={paginaActualMascota === 1}
                variant="outline"
                className="w-12 h-12 rounded-xl border-slate-200 disabled:opacity-20"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest">
                Página {paginaActualMascota} de {totalPaginas}
              </div>
              <Button
                onClick={() => setPaginaActualMascota(Math.min(totalPaginas, paginaActualMascota + 1))}
                disabled={paginaActualMascota === totalPaginas}
                variant="outline"
                className="w-12 h-12 rounded-xl border-slate-200 disabled:opacity-20"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </footer>
          )}
        </main>
      </div>
    );
  }

  const renderReporteCompleto = (idMascota: number) => {
    const historialesMascota = historiales
      .filter(h => h.id_mascota === idMascota)
      .sort((a, b) => {
        const dateA = new Date(a.fecha + 'T' + ((a as any).hora || '00:00')).getTime();
        const dateB = new Date(b.fecha + 'T' + ((b as any).hora || '00:00')).getTime();
        return dateB - dateA;
      });

    const mascota = historialesMascota[0]?.mascota || mascotaSeleccionada;

    return (
      <div className="flex flex-col bg-white min-h-screen animate-in fade-in duration-700 print:bg-white print:block">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            .no-print { display: none !important; }
            body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
            .report-page { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; padding: 2.5cm !important; }
            .history-entry { break-inside: avoid; border-left-color: #e2e8f0 !important; }
            .grid { display: grid !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}} />

        {/* Barra de Acciones (No imprimible) */}
        <div className="bg-[#0f172a] px-8 py-4 flex justify-between items-center no-print sticky top-0 z-50 shadow-2xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setPasoActual('detalles')}
              className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span>Volver</span>
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest opacity-80">Vista de Impresión</h2>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 h-11 rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Exportar PDF / Imprimir
            </Button>
          </div>
        </div>

        {/* Contenido del Reporte A4 */}
        <div className="report-page max-w-[950px] mx-auto w-full bg-white p-16 my-8 shadow-[0_0_80px_rgba(0,0,0,0.1)] transition-all duration-500 print:my-0 print:p-[2.5cm]">

          {/* Encabezado Institucional */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-[3px] border-slate-900 pb-8 mb-12">
            <div className="space-y-2 mb-6 md:mb-0 text-left">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">HISTORIAL MÉDICO</h1>
              <p className="text-xs font-black text-blue-600 tracking-[0.3em] uppercase">KaiVet Manager · Gestión Clínica Digital</p>
            </div>

            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento Generado</p>
              <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <div className="pt-2">
                <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                  Expediente #{mascota?.id_mascota || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloques de Información (Grid Limpio) */}
          <div className="grid grid-cols-2 gap-16 mb-16 relative">
            {/* Divider vertical sutil */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200 hidden md:block" />

            <section className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                <Heart className="w-4 h-4 text-pink-500" /> Datos del Paciente
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nombre</span>
                  <span className="text-sm font-black text-slate-900">{toSentenceCase(mascota?.nombre)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Especie / Raza</span>
                  <span className="text-sm font-bold text-slate-900">{mascota?.especie} · {mascota?.raza || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Edad</span>
                  <span className="text-sm font-bold text-slate-900">{mascota?.edad || 'N/A'} años</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Peso Promedio</span>
                  <span className="text-sm font-bold text-slate-900">{mascota?.peso || 'N/A'} kg</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 mb-6 text-left">
                <User className="w-4 h-4 text-blue-500" /> Información del Propietario
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Propietario</span>
                  <span className="text-sm font-black text-slate-900">{toSentenceCase(mascota?.cliente?.nombre)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Identificación</span>
                  <span className="text-sm font-bold text-slate-900">{mascota?.cliente?.cedula || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</span>
                  <span className="text-sm font-bold text-slate-900">{mascota?.cliente?.telefono || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dirección</span>
                  <span className="text-sm font-bold text-slate-800 italic line-clamp-1">{toSentenceCase(mascota?.cliente?.direccion) || 'No registrada'}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Listado de Evoluciones (Timeline Profesional) */}
          <div className="space-y-12">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600" />
                CRONOLOGÍA DE EVOLUCIÓN CLÍNICA
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{historialesMascota.length} Entradas Registradas</span>
            </div>

            <div className="space-y-16 mt-12">
              {historialesMascota.map((h, index) => (
                <article key={h.id_historial} className="history-entry relative pl-10 border-l-2 border-slate-200 space-y-4 text-left">
                  {/* Marcador de tiempo circular */}
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-[3px] border-slate-900" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900">
                        {h.fecha ? new Date(h.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs font-bold text-slate-400 uppercase">{(h as any).hora || '00:00'} hs</span>
                    </div>
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                      <Stethoscope className="w-3 h-3" />
                      Médico: {toSentenceCase((h as any).veterinario || 'Veterinario General')}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Activity className="w-3 h-3 text-pink-400" /> Hallazgos y Diagnóstico
                        </h5>
                        <p className="text-sm text-slate-800 leading-relaxed font-medium italic">
                          {h.diagnostico || 'Sin registro de diagnóstico.'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Syringe className="w-3 h-3 text-emerald-400" /> Tratamiento e Indicaciones
                        </h5>
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">
                          {h.tratamiento || 'Sin registro de tratamiento.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider interno más corto */}
                  {index < historialesMascota.length - 1 && (
                    <div className="pt-8 opacity-20">
                      <div className="h-px w-full bg-gradient-to-r from-slate-300 via-transparent to-transparent" />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          {/* Pie de Página Oficial */}
          <footer className="mt-32 pt-16 border-t border-slate-100 text-center flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            </div>
            <p className="text-[9px] font-black text-slate-400 tracking-[0.5em] uppercase">Documento Clínico Legal · KaiVet Manager System 2026</p>
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-1">Este reporte contiene información confidencial protegida por secreto médico.</p>
          </footer>
        </div>
      </div>
    );
  }

  const renderContenido = () => {
    switch (pasoActual) {
      case 'cliente':
        return renderSeleccionCliente();
      case 'mascota':
        return renderSeleccionMascota();
      case 'timeline':
        return renderTimeline();
      case 'formulario':
        return renderFormularioHistorial();
      case 'detalles':
        return entradaSeleccionada ? renderReporteDetallado(entradaSeleccionada) : renderSeleccionCliente();
      case 'reporteCompleto':
        return entradaSeleccionada ? renderReporteCompleto(entradaSeleccionada.id_mascota) : renderSeleccionCliente();
      default:
        return renderSeleccionCliente();
    }
  };

  return (
    <div className="flex flex-col bg-[#0a0b0c]">
      {!['formulario', 'detalles', 'reporteCompleto'].includes(pasoActual) && (
        <header className="px-10 py-6 border-b border-dark-color bg-dark-bg shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ClipboardPlus className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-black text-dark-primary  tracking-tighter">Historial Mascotas</h1>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest">
                  <div className={`w-1.5 h-1.5 rounded-full ${pasoActual === 'cliente' ? 'bg-blue-500' : 'bg-dark-color'}`} />
                  <span className={pasoActual === 'cliente' ? 'text-blue-400' : 'text-dark-secondary'}>Cliente</span>
                </div>
                <ChevronRight className="w-3 h-3 text-dark-color" />
                <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest">
                  <div className={`w-1.5 h-1.5 rounded-full ${pasoActual === 'mascota' ? 'bg-pink-500' : 'bg-dark-color'}`} />
                  <span className={pasoActual === 'mascota' ? 'text-pink-400' : 'text-dark-secondary'}>Mascota</span>
                </div>
                <ChevronRight className="w-3 h-3 text-dark-color" />
                <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest">
                  <div className={`w-1.5 h-1.5 rounded-full ${pasoActual === 'timeline' ? 'bg-emerald-500' : 'bg-dark-color'}`} />
                  <span className={pasoActual === 'timeline' ? 'text-emerald-400' : 'text-dark-secondary'}>Historial</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {(pasoActual !== 'cliente') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasoActual('cliente');
                    setClienteSeleccionado(null);
                    setMascotaSeleccionada(null);
                  }}
                  className="border-dark-color text-dark-secondary hover:bg-dark-hover rounded-2xl h-12 font-black  text-xs tracking-widest px-6"
                >
                  Reiniciar
                </Button>
              )}
            </div>
          </div>
        </header>
      )}

      {renderContenido()}

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, entrada: null })}>
        <AlertDialogContent className="bg-gradient-to-br from-[#0f1113] to-[#0a0b0c] border border-red-500/20 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden max-w-md w-full sm:max-w-md mx-auto relative">
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10 w-full">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-red-500/20 relative group">
              <div className="absolute inset-0 bg-red-500/20 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <Trash2 className="w-10 h-10 text-red-500 relative z-10" />
            </div>

            <AlertDialogHeader className="w-full">
              <AlertDialogTitle className="text-3xl font-black text-white tracking-tighter mb-4 text-center w-full">
                ¿Eliminar registro?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 text-sm font-medium leading-relaxed tracking-wide text-center">
                Esta acción es <strong className="text-red-400 font-bold">irreversible</strong>. El historial médico seleccionado será eliminado de forma permanente y no podrá ser recuperado.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="w-full mt-10 gap-3 flex flex-col sm:flex-row sm:space-x-3">
              <AlertDialogCancel className="w-full sm:w-1/2 bg-[#1a1c20] hover:bg-[#25282e] text-slate-300 border-slate-700 h-14 rounded-2xl font-black text-xs tracking-widest transition-all mt-0 sm:mt-0">
                Conservar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEliminarEntrada}
                className="w-full sm:w-1/2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white h-14 rounded-2xl font-black text-xs tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] border border-red-500/50 transition-all mt-3 sm:mt-0"
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
