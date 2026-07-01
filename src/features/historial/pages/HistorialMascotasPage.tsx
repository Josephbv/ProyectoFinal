import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Switch } from "../../../shared/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shared/components/dialog";
import { toast } from "sonner";
import { FileText, Plus, Search, Calendar, Eye, Edit, Trash2, Heart, User, Users, Stethoscope, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardPlus, TrendingUp, Activity, Syringe, CheckCircle, XCircle, Save, Undo2, Phone, Hash, Fingerprint, Dog, ClipboardList, HeartPulse } from "lucide-react";
import { useHistorialMascotas, HistorialMascota } from "../hooks/useHistorialMascotas";
import { useClientes } from "../../clientes/hooks/useClientes";
import { formatTo12h } from '../../../shared/utils/formatTime';
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { useUsuarios } from "../../configuracion/hooks/useUsuarios";
import { useEmpleados } from "../../empleados/hooks/useEmpleados";
import { useServicios } from "../../servicios/hooks/useServicios";
import { Input } from "../../../shared/components/input";
import { Label } from "../../../shared/components/label";
import { Textarea } from "../../../shared/components/textarea";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";

const toSentenceCase = (str: any = '') => {
  if (str === null || str === undefined) return '';
  const stringVal = typeof str === 'string' ? str : String(str);
  if (!stringVal.trim()) return '';
  const s = stringVal.trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const toTitleCase = (str: any = '') => {
  if (str === null || str === undefined) return '';
  const stringVal = typeof str === 'string' ? str : String(str);
  if (!stringVal.trim()) return '';
  return stringVal.trim().toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function HistorialMascotasPage() {
  const { historiales, loading, cargarHistoriales, crearEntradaHistorial, actualizarEntradaHistorial, eliminarEntradaHistorial } = useHistorialMascotas();
  const { user } = useEmailAuth();

  const [busqueda, setBusqueda] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, entrada: null as HistorialMascota | null });

  const roleName = typeof user?.rol === 'string' ? user.rol : (user?.rol as any)?.nombre_rol || '';
  const isClienteRole = roleName.toLowerCase().includes('cliente');
  const isVetRole = roleName.toLowerCase().includes('veterinario');

  // Nuevo flujo de navegación
  const [pasoActual, setPasoActual] = useState<'inicio' | 'cliente' | 'mascota' | 'timeline' | 'formulario' | 'detalles' | 'reporteCompleto'>('inicio');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<any | null>(null);
  const [entradaSeleccionada, setEntradaSeleccionada] = useState<HistorialMascota | null>(null);
  const [detalleModal, setDetalleModal] = useState<{ isOpen: boolean; entrada: HistorialMascota | null }>({ isOpen: false, entrada: null });

  const exportarHistorialesExcel = () => {
    try {
      const headers = ["ID", "Mascota", "Propietario", "Cédula Propietario", "Fecha", "Hora", "Veterinario", "Diagnóstico", "Tratamiento"];

      const rows = historialFiltrado.map(h => [
        h.id_historial,
        h.nombreMascota || '',
        h.nombreCliente || '',
        h.cedulaCliente || '',
        h.fecha ? h.fecha.split('T')[0] : '',
        (h as any).hora || '',
        h.veterinario || '',
        h.diagnostico || '',
        h.tratamiento || ''
      ]);

      const csvLines = [
        "sep=;",
        headers.join(";"),
        ...rows.map(row => row.map(val => {
          const cleanVal = typeof val === 'string' ? val.replace(/"/g, '""') : val;
          return typeof val === 'string' && (String(cleanVal).includes(";") || String(cleanVal).includes("\n") || String(cleanVal).includes('"'))
            ? `"${cleanVal}"`
            : cleanVal;
        }).join(";"))
      ];

      const defaultName = `Historial_Clinico_${new Date().toISOString().split('T')[0]}`;
      const customName = window.prompt("Ingrese el nombre para el archivo de Excel:", defaultName);
      if (customName === null) return; // Cancelado
      const finalName = customName.trim() ? customName.trim() : defaultName;

      const csvContent = "\uFEFF" + csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${finalName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Historial exportado en formato Excel con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar historial");
    }
  };

  // Paginación para Historial
  const [paginaActualMascota, setPaginaActualMascota] = useState(1);
  const [filtroServicio, setFiltroServicio] = useState("");

  // Hooks para el formulario
  const { clientes } = useClientes();
  const { mascotas } = useMascotas();
  const { usuarios } = useUsuarios();
  const { empleados } = useEmpleados();
  const { servicios } = useServicios();

  // Estado del formulario
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    tipoVisita: [] as string[],
    veterinario: '',
    diagnostico: '',
    tratamiento: '',
    estado: 'activo' as any
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados para búsqueda de veterinario
  const [busquedaVetCedula, setBusquedaVetCedula] = useState("");
  const [doctoresFiltrados, setDoctoresFiltrados] = useState<any[]>([]);
  const [mostrarSugerenciasVet, setMostrarSugerenciasVet] = useState(false);
  const [vetSeleccionado, setVetSeleccionado] = useState<any>(null);

  // Estados para búsqueda de cliente en formulario
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarSugerenciasCliente, setMostrarSugerenciasCliente] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const historialFiltrado = historiales.filter(entrada => {
    // Si es cliente, solo ve historiales de sus mascotas
    if (isClienteRole) {
      if (entrada.mascota?.id_cliente !== user?.id_cliente) return false;
    }

    // Si es veterinario, solo ve historiales donde él sea el facultativo
    if (isVetRole) {
      const vetName = (entrada.veterinario || '').toLowerCase();
      // Limpiamos prefijos como "Dr." para una comparación más flexible
      const cleanVetName = vetName.replace(/^(?:(?:dr|dra|doctor|doctora)\.?\s*)+/i, '').trim();

      const myUsername = (user?.nombre_usuario || '').toLowerCase().trim();
      const myFullName = (user?.nombre_completo || '').toLowerCase().trim();

      const isMine = cleanVetName.includes(myUsername) ||
        cleanVetName.includes(myFullName) ||
        myFullName.includes(cleanVetName);

      if (!isMine) return false;
    }

    const searchLow = busqueda.toLowerCase().trim();
    if (!searchLow) return true;

    return (
      (entrada.nombreCliente || '').toLowerCase().includes(searchLow) ||
      (entrada.cedulaCliente || '').toLowerCase().includes(searchLow) ||
      (entrada.nombreMascota || '').toLowerCase().includes(searchLow)
    );
  }).sort((a, b) => (b.id_historial || 0) - (a.id_historial || 0));

  // Agrupamos el historial clínico por mascota única (id_mascota) para evitar duplicados en la tabla principal
  // Nos quedamos con la entrada más reciente de cada mascota para mostrar su información actual
  const historialAgrupadoPorMascota = Object.values(
    historialFiltrado.reduce((acc, entrada) => {
      const petId = entrada.id_mascota;
      if (!petId) return acc;
      if (!acc[petId]) {
        acc[petId] = entrada;
      } else {
        const currentNewest = acc[petId];
        const dateCurrent = new Date(currentNewest.fecha + 'T' + (currentNewest.hora || '00:00')).getTime();
        const dateNew = new Date(entrada.fecha + 'T' + (entrada.hora || '00:00')).getTime();
        if (dateNew > dateCurrent) {
          acc[petId] = entrada;
        }
      }
      return acc;
    }, {} as Record<number, HistorialMascota>)
  ).sort((a, b) => (b.id_historial || 0) - (a.id_historial || 0));

  const estadisticas = {
    total: historiales.length,
    hoy: historiales.filter(h => h.fecha === new Date().toISOString().split('T')[0]).length
  };

  // Cálculos de paginación basados en mascotas únicas
  const totalPages = Math.ceil(historialAgrupadoPorMascota.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const historialPaginado = historialAgrupadoPorMascota.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  // Redirigir si es cliente y está en el paso de selección de cliente
  useEffect(() => {
    if (isClienteRole && pasoActual === 'cliente') {
      setPasoActual('inicio');
    }
  }, [isClienteRole, pasoActual]);

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
      setPasoActual('inicio');
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
      diagnostico: '',
      tratamiento: '',
      estado: 'activo'
    });
    setSelectedClientId('');
    setSelectedPetId('');
    setErrors({});
    setBusquedaVetCedula('');
    setDoctoresFiltrados([]);
    setMostrarSugerenciasVet(false);
    setVetSeleccionado(null);
    setBusquedaCliente('');
    setMostrarSugerenciasCliente(false);
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

  const abrirFormulario = (entrada?: HistorialMascota, presetSelection: boolean = false) => {
    if (entrada) {
      setEntradaSeleccionada(entrada);
      setFormData({
        fecha: entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] : entrada.fecha,
        hora: (entrada as any).hora || new Date().toTimeString().slice(0, 5),
        tipoVisita: Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita : [],
        veterinario: entrada.veterinario || '',
        diagnostico: entrada.diagnostico || '',
        tratamiento: entrada.tratamiento || '',
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

      if (entrada.veterinario) {
        // Buscar el doctor en la lista para obtener su cédula si es posible
        const doctoresMap = new Map<string, { id: string; nombre: string; cedula: string }>();
        const agregarOActualizar = (key: string, doc: { id: string; nombre: string; cedula: string }) => {
          const existing = doctoresMap.get(key);
          if (!existing || doc.nombre.length > existing.nombre.length) {
            doctoresMap.set(key, doc);
          }
        };

        usuarios
          .filter(u => {
            const roleName = u.rol?.nombre_rol?.toLowerCase();
            return roleName === 'veterinario' || roleName === 'administrador' || roleName === 'admin';
          })
          .forEach(u => {
            const cedula = (u as any).cedula || '';
            const cleanCed = cedula.trim();
            const doc = { id: `user-${u.id_usuario}`, nombre: `Dr. ${u.nombre_usuario}`, cedula };
            const key = cleanCed || `user-${u.id_usuario}`;
            agregarOActualizar(key, doc);
          });

        empleados
          .filter(e => e.cargo?.toLowerCase() === 'veterinario')
          .forEach(e => {
            const cedula = e.cedula || '';
            const cleanCed = cedula.trim();
            const doc = { id: `emp-${e.id_empleado}`, nombre: `Dr. ${e.nombre}`, cedula };
            const key = cleanCed || `emp-${e.id_empleado}`;
            agregarOActualizar(key, doc);
          });

        const doctoresList = Array.from(doctoresMap.values());

        const nombreLimpio = entrada.veterinario.replace(/^(?:(?:dr|dra|doctor|doctora)\.?\s*)+/i, '').toLowerCase().trim();
        const docEncontrado = doctoresList.find(d =>
          d.nombre.toLowerCase().includes(nombreLimpio) ||
          (d.id && d.id.includes(nombreLimpio))
        );

        if (docEncontrado) {
          setVetSeleccionado(docEncontrado);
          setBusquedaVetCedula(docEncontrado.nombre);
        } else {
          setVetSeleccionado({ nombre: entrada.veterinario });
          setBusquedaVetCedula(entrada.veterinario);
        }
      }
    } else {
      setEntradaSeleccionada(null);
      resetForm();
      if (presetSelection) {
        setSelectedClientId(clienteSeleccionado?.id_cliente?.toString() || '');
        setSelectedPetId(mascotaSeleccionada?.id_mascota?.toString() || '');
      } else {
        setClienteSeleccionado(null);
        setMascotaSeleccionada(null);
        setSelectedClientId('');
        setSelectedPetId('');
      }
    }
    setPasoActual('formulario');
  };

  const cerrarVistaActual = () => {
    setPasoActual('inicio');
    setEntradaSeleccionada(null);
  };

  const abrirDetalles = (entrada: HistorialMascota) => {
    setEntradaSeleccionada(entrada);
    setPasoActual('detalles');
  };

  const abrirTimelineMascota = (entrada: HistorialMascota) => {
    const petInfo = mascotas.find(m => m.id_mascota === entrada.id_mascota) || entrada.mascota;
    const clientInfo = clientes.find(c => c.id_cliente === petInfo?.id_cliente) || petInfo?.cliente;
    
    setClienteSeleccionado(clientInfo || null);
    setMascotaSeleccionada(petInfo || null);
    setPaginaActualMascota(1);
    setPasoActual('timeline');
  };

  const registrarNuevoHistorialMascota = (entrada: HistorialMascota) => {
    const petInfo = mascotas.find(m => m.id_mascota === entrada.id_mascota) || entrada.mascota;
    const clientInfo = clientes.find(c => c.id_cliente === petInfo?.id_cliente) || petInfo?.cliente;
    
    setClienteSeleccionado(clientInfo || null);
    setMascotaSeleccionada(petInfo || null);
    setEntradaSeleccionada(null);
    resetForm();
    
    setSelectedClientId(clientInfo?.id_cliente?.toString() || '');
    setSelectedPetId(petInfo?.id_mascota?.toString() || '');
    
    setPasoActual('formulario');
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
    const mascotaInfo = mascotas.find((m: any) => m.id_mascota === entrada.id_mascota) || entrada.mascota || mascotaSeleccionada;
    const clienteInfo = clientes.find((c: any) => c.id_cliente === mascotaInfo?.id_cliente) || mascotaInfo?.cliente || clienteSeleccionado;

    return (
      <div className="flex flex-col bg-[#0a0b0c] animate-in fade-in duration-500 overflow-y-auto min-h-screen">
        {/* Header del Reporte */}
        <header className="bg-dark-card border-b border-dark-color px-10 py-6 shrink-0 z-20 sticky top-0">
          <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={cerrarVistaActual}
                className="text-dark-secondary hover:bg-dark-hover rounded-full w-12 h-12 p-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="bg-blue-500 w-2 h-6 rounded-full" />
                  <h2 className="text-2xl font-black text-dark-primary tracking-tighter">{toSentenceCase('Informe clínico detallado')}</h2>
                </div>
                <p className="text-[10px] text-dark-secondary font-black tracking-widest pl-5 opacity-60">{toSentenceCase(`Expediente médico #${entrada.id_historial}`)}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setPasoActual('reporteCompleto')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-[11px] font-black tracking-widest h-12 px-8 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.25)] border border-emerald-400/20 transition-all hover:scale-105 active:scale-95 gap-3"
              >
                <FileText className="w-4 h-4" />
                <span>Generar reporte de consulta</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-10 pt-12 pb-10 space-y-12 w-full">
          {/* Fila Superior: Mascota, Cliente e Info Cita */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            {/* Tarjeta de la Mascota */}
            <div className="dark-card p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-pink-500/10 transition-colors" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl mb-3 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-black text-dark-primary tracking-tight mb-0.5">{toSentenceCase(mascotaInfo?.nombre || (entrada as any).nombreMascota || 'Mascota')}</h3>
                <p className="text-[9px] font-black text-pink-400 tracking-[0.2em] mb-3">Mascota</p>

                <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-dark-color/40">
                  <div className="bg-dark-bg/30 p-2 rounded-xl border border-dark-color/30 flex flex-col">
                    <p className="text-[7px] font-black text-dark-secondary tracking-[0.1em] mb-0.5">Edad</p>
                    <p className="text-[10px] font-black text-emerald-400">{mascotaInfo?.edad || 'N/A'} meses</p>
                  </div>
                  <div className="bg-dark-bg/30 p-2 rounded-xl border border-dark-color/30 flex flex-col">
                    <p className="text-[7px] font-black text-dark-secondary tracking-[0.1em] mb-0.5">Peso</p>
                    <p className="text-[10px] font-black text-blue-400">{mascotaInfo?.peso || 'N/A'} kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta del Cliente */}
            <div className="dark-card p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -ml-12 -mt-12 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="relative z-10 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-blue-400 tracking-widest leading-none mb-1.5 opacity-80">{toSentenceCase('Cliente')}</p>
                    <h4 className="text-base font-black text-dark-primary truncate leading-tight tracking-tight">
                      {toSentenceCase(clienteInfo?.nombre || (entrada as any).nombreCliente || 'Desconocido')}
                    </h4>
                    <p className="text-[10px] text-dark-secondary font-black tracking-tighter opacity-60">Cédula: {clienteInfo?.cedula || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-dark-color/40">
                  <div className="flex items-center gap-3 text-[10px] text-dark-secondary/80 font-bold">
                    <Phone className="w-3 h-3 text-blue-400" />
                    <span className="truncate">{clienteInfo?.telefono || 'No registrado'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-dark-secondary/80 font-bold">
                    <Search className="w-3 h-3 text-blue-400" />
                    <span className="truncate">{toSentenceCase(clienteInfo?.direccion || 'No registrado')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Detalles de la Cita */}
            <div className="dark-card p-8 relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mb-12 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="relative z-10 flex flex-col">
                <h4 className="text-[9px] font-black text-dark-secondary tracking-[0.3em] pl-1 opacity-50 mb-3">Información de Visita</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-dark-secondary tracking-widest mb-0.5">Fecha</p>
                      <p className="text-xs font-black text-dark-primary">{entrada.fecha ? new Date(entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] + 'T12:00:00' : entrada.fecha + 'T12:00:00').toLocaleDateString() : 'Sin fecha'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-dark-secondary tracking-widest mb-0.5">Hora</p>
                      <p className="text-xs font-black text-dark-primary">{formatTo12h((entrada as any).hora) || '00:00'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secciones Clínicas: Diagnóstico y Tratamiento (Narrower) */}
          <div className="grid grid-cols-1 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-4 border-pink-600 pl-8 py-2">
                <Activity className="w-8 h-8 text-pink-500" />
                <h3 className="text-2xl font-black text-dark-primary tracking-[0.15em]">Diagnóstico y Evolución</h3>
              </div>
              <div className="dark-card p-12 transform transition-all hover:scale-[1.005]">
                <p className="text-xl text-dark-primary leading-relaxed font-medium whitespace-pre-wrap min-h-[100px]">
                  {toSentenceCase(entrada.diagnostico || 'Sin diagnóstico registrado')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-4 border-emerald-600 pl-8 py-2">
                <Stethoscope className="w-8 h-8 text-emerald-500" />
                <h3 className="text-2xl font-black text-dark-primary tracking-[0.15em]">Tratamiento Realizado</h3>
              </div>
              <div className="dark-card p-12 transform transition-all hover:scale-[1.005]">
                <p className="text-xl text-dark-primary leading-relaxed font-medium whitespace-pre-wrap min-h-[100px]">
                  {toSentenceCase(entrada.tratamiento || 'Sin tratamiento registrado')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTimeline = () => {
    const serviciosActivos = servicios.filter(s => s.estado === 'activo');

    const historialDeLaMascota = historiales
      .filter(h => h.id_mascota === mascotaSeleccionada?.id_mascota)
      .filter(h => {
        if (!filtroServicio) return true;
        const tipoVisitaArr = Array.isArray(h.tipoVisita) ? h.tipoVisita : [h.tipoVisita];
        const normalizeStr = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const normalizedFilter = normalizeStr(filtroServicio);
        return tipoVisitaArr.some(tipo => tipo && normalizeStr(tipo).includes(normalizedFilter));
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const elementosPorPaginaMascota = 10;
    const totalPaginas = Math.ceil(historialDeLaMascota.length / elementosPorPaginaMascota);
    const indiceInicio = (paginaActualMascota - 1) * elementosPorPaginaMascota;
    const indiceFin = indiceInicio + elementosPorPaginaMascota;
    const historialesPaginados = historialDeLaMascota.slice(indiceInicio, indiceFin);

    return (
      <div className="p-4 md:p-8 space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => { setFiltroServicio(""); setPasoActual('inicio'); }}
                className="text-dark-secondary hover:bg-dark-hover gap-2 font-black tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" /> Volver al Inicio
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative min-w-[220px]">
                <select
                  value={filtroServicio}
                  onChange={(e) => { setFiltroServicio(e.target.value); setPaginaActualMascota(1); }}
                  className="w-full h-12 bg-dark-card border border-dark-color rounded-2xl px-4 text-xs font-bold text-dark-primary focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner cursor-pointer outline-none"
                >
                  <option value="">Todos los servicios</option>
                  {serviciosActivos.map((s) => (
                    <option key={s.id_servicio} value={s.nombre_servicio}>{toSentenceCase(s.nombre_servicio)}</option>
                  ))}
                </select>
              </div>
              {!isClienteRole && (
                <Button
                  onClick={() => abrirFormulario(undefined, true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest px-8 rounded-2xl h-12 shadow-xl shadow-blue-500/20 gap-2 transition-all active:scale-95 hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" /> Nuevo
                </Button>
              )}
            </div>
          </div>

          <div className="dark-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">
                    <TableHead className="text-dark-primary font-semibold min-w-[120px]"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" />Fecha / Hora</div></TableHead>
                    <TableHead className="text-dark-primary font-semibold min-w-[120px]"><div className="flex items-center gap-2"><Dog className="w-4 h-4 text-blue-400" />Mascota</div></TableHead>
                    <TableHead className="text-dark-primary font-semibold min-w-[120px]"><div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" />Servicios</div></TableHead>
                    <TableHead className="text-dark-primary font-semibold min-w-[140px]"><div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-400" />Veterinario</div></TableHead>
                    <TableHead className="text-dark-primary font-semibold min-w-[160px]"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" />Diagnóstico</div></TableHead>
                    <TableHead className="text-dark-primary font-semibold min-w-[160px]"><div className="flex items-center gap-2"><HeartPulse className="w-4 h-4 text-blue-400" />Tratamiento</div></TableHead>
                    <TableHead className="text-dark-primary font-semibold text-center w-28">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialesPaginados.map((entrada, index) => {
                    const cleanVet = ((entrada as any).veterinario || '').replace(/^(?:(?:dr|dra|doctor|doctora)\.?\s*)+/i, '');
                    const formattedVet = cleanVet ? `Dr. ${toSentenceCase(cleanVet)}` : 'No asignado';
                    let diagText = toSentenceCase(entrada.diagnostico || 'Sin diagnóstico');
                    diagText = diagText.length > 20 ? diagText.substring(0, 20) + '...' : diagText;
                    let tratText = toSentenceCase(entrada.tratamiento || 'Sin tratamiento');
                    tratText = tratText.length > 20 ? tratText.substring(0, 20) + '...' : tratText;

                    return (
                      <TableRow key={`${entrada.id_historial}-${index}`} className="border-dark-color hover:bg-dark-table-hover transition-colors group">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-dark-primary text-xs font-black">
                              {new Date((entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] : entrada.fecha) + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="text-[9px] text-dark-secondary font-bold tracking-widest mt-0.5">{formatTo12h((entrada as any).hora) || '00:00'}</span>
                          </div>
                        </TableCell>
                        <TableCell><span className="font-semibold text-dark-primary text-xs">{toSentenceCase(mascotaSeleccionada?.nombre || (entrada as any).nombreMascota)}</span></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita.map((tipo, idx) => (
                              <span key={idx} className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest ${getTipoVisitaColor(tipo)}`}>{toSentenceCase(tipo)}</span>
                            )) : (
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest ${getTipoVisitaColor(entrada.tipoVisita)}`}>{toSentenceCase(entrada.tipoVisita)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><span className="text-dark-primary text-xs font-bold">{formattedVet}</span></TableCell>
                        <TableCell className="max-w-[200px]"><p className="text-xs text-dark-secondary truncate" title={entrada.diagnostico ?? undefined}>{diagText}</p></TableCell>
                        <TableCell className="max-w-[200px]"><p className="text-xs text-dark-secondary truncate" title={entrada.tratamiento ?? undefined}>{tratText}</p></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              onClick={() => setDetalleModal({ isOpen: true, entrada })}
                              variant="outline" size="sm"
                              className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!isClienteRole && (
                              <>
                                <Button
                                  onClick={() => abrirFormulario(entrada)}
                                  variant="outline" size="sm"
                                  className="p-2 h-9 w-9 bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {!isVetRole && (
                                  <Button
                                    onClick={() => setDeleteDialog({ isOpen: true, entrada })}
                                    variant="outline" size="sm"
                                    className="p-2 h-9 w-9 bg-rose-500/20 border-rose-500 text-rose-500 hover:bg-rose-500/30"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {historialesPaginados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center border-none">
                        <p className="text-sm text-dark-secondary italic">No hay consultas registradas para esta mascota</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {historialDeLaMascota.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 px-4 pb-4 border-t border-dark-color/40">
                <div className="text-sm text-dark-secondary">Mostrando {indiceInicio + 1}-{Math.min(indiceFin, historialDeLaMascota.length)} de {historialDeLaMascota.length} entradas</div>
                {totalPaginas > 1 && (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPaginaActualMascota(1)} disabled={paginaActualMascota === 1} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPaginaActualMascota(prev => Math.max(prev - 1, 1))} disabled={paginaActualMascota === 1} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPaginaActualMascota(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActualMascota === totalPaginas} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPaginaActualMascota(totalPaginas)} disabled={paginaActualMascota === totalPaginas} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  function renderFormularioHistorial() {
    const isEdit = !!entradaSeleccionada;

    // Deduplicar doctores (Usuario + Empleado) por cédula, prefiriendo nombres más completos
    const doctoresMap = new Map<string, { id: string; nombre: string; cedula: string }>();
    const agregarOActualizar = (key: string, doc: { id: string; nombre: string; cedula: string }) => {
      const existing = doctoresMap.get(key);
      if (!existing || doc.nombre.length > existing.nombre.length) {
        doctoresMap.set(key, doc);
      }
    };

    usuarios
      .filter(u => {
        const roleName = u.rol?.nombre_rol?.toLowerCase();
        return roleName === 'veterinario' || roleName === 'administrador' || roleName === 'admin';
      })
      .forEach(u => {
        const cedula = (u as any).cedula || '';
        const cleanCed = cedula.trim();
        const doc = { id: `user-${u.id_usuario}`, nombre: `Dr. ${u.nombre_usuario}`, cedula };
        const key = cleanCed || `user-${u.id_usuario}`;
        agregarOActualizar(key, doc);
      });

    empleados
      .filter(e => e.cargo?.toLowerCase() === 'veterinario')
      .forEach(e => {
        const cedula = e.cedula || '';
        const cleanCed = cedula.trim();
        const doc = { id: `emp-${e.id_empleado}`, nombre: `Dr. ${e.nombre}`, cedula };
        const key = cleanCed || `emp-${e.id_empleado}`;
        agregarOActualizar(key, doc);
      });

    const doctores = Array.from(doctoresMap.values());

    const visitTypes = servicios
      .filter(s => s.estado === 'activo')
      .map(s => ({
        id: s.nombre_servicio.toLowerCase().replace(/\s+/g, '_'),
        label: s.nombre_servicio,
        color: 'blue'
      }));

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
      <div className="flex flex-col min-h-screen bg-dark-bg animate-in fade-in duration-500">
        {/* Header Formulario */}
        <header className="sticky top-0 bg-dark-bg/80 backdrop-blur-xl border-b border-dark-color px-6 md:px-10 py-6 flex justify-between items-center z-30">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={cerrarVistaActual}
              className="text-dark-secondary hover:bg-dark-hover rounded-full w-12 h-12 p-0"
            >
              <Undo2 className="w-6 h-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-blue-500 w-2 h-6 rounded-full" />
                <h2 className="text-2xl font-black text-dark-primary tracking-tighter">
                  {isEdit ? 'Editar expediente clínico' : 'Nueva entrada médica'}
                </h2>
              </div>
              <p className="text-[10px] text-dark-secondary font-black tracking-widest pl-5 opacity-60">
                {isEdit ? `ID de historial: #${entradaSeleccionada.id_historial}` : 'Módulo de registro clínico v2.0'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={cerrarVistaActual}
              className="hidden md:flex text-dark-secondary hover:text-dark-primary hover:bg-dark-hover"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="historial-form"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-900/20"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Procesando...' : (entradaSeleccionada ? 'Actualizar Historial' : 'Guardar Historial')}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <form id="historial-form" onSubmit={handleGuardarFormulario} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Información de la Visita (col-span-2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Detalles del Servicio y Diagnóstico */}
              <div className="dark-card p-8 space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

                <h2 className="text-lg font-black text-dark-primary flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <ClipboardList className="w-5 h-5 text-blue-400" />
                  </div>
                  Detalles de la Entrada Clínica
                </h2>

                {/* Tipos de Visita */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80">
                    Tipo de Servicio <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap justify-start items-center gap-3 w-full">
                    {visitTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleTipoVisita(type.id)}
                        className={`flex items-center justify-center gap-3 px-6 rounded-2xl border text-[13px] font-black tracking-wider transition-all whitespace-nowrap h-[46px] ${formData.tipoVisita.includes(type.id)
                          ? `bg-blue-500/20 border-blue-500 text-blue-400 shadow-md transform scale-105`
                          : 'bg-dark-bg border-dark-color/50 text-dark-secondary hover:bg-dark-hover'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${formData.tipoVisita.includes(type.id) ? `bg-blue-400 animate-pulse` : 'bg-dark-secondary opacity-30'}`} />
                        <span>{type.label}</span>
                        {/* Invisible spacer of the same size as the dot to center the text perfectly */}
                        <div className="w-2 h-2 shrink-0 opacity-0 pointer-events-none" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diagnóstico */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80">
                      Diagnóstico y Evolución <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[10px] text-dark-secondary opacity-50 bg-dark-bg px-3 py-1 rounded-full border border-dark-color">
                      {(formData.diagnostico || '').length}/100
                    </span>
                  </div>
                  <textarea
                    placeholder="Escribe el diagnóstico médico detallado, síntomas observados, evolución clínica..."
                    value={formData.diagnostico}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value.slice(0, 100) }))}
                    maxLength={100}
                    className="w-full min-h-[160px] p-6 bg-dark-bg border border-dark-color rounded-2xl text-sm text-dark-primary focus:border-blue-500/50 outline-none resize-none transition-all placeholder:text-dark-secondary/50 shadow-inner"
                  />
                </div>
              </div>

              {/* Card 2: Tratamiento */}
              <div className="dark-card p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700 pointer-events-none" />

                <h2 className="text-lg font-black text-dark-primary flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <HeartPulse className="w-5 h-5 text-emerald-400" />
                  </div>
                  Plan de Tratamiento
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80">
                      Tratamiento y Procedimientos
                    </Label>
                    <span className="text-[10px] text-dark-secondary opacity-50 bg-dark-bg px-3 py-1 rounded-full border border-dark-color">
                      {(formData.tratamiento || '').length}/100
                    </span>
                  </div>
                  <textarea
                    placeholder="Procedimientos realizados, medicamentos recetados, recomendaciones..."
                    value={formData.tratamiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, tratamiento: e.target.value.slice(0, 100) }))}
                    maxLength={100}
                    className="w-full min-h-[120px] p-6 bg-dark-bg border border-dark-color rounded-2xl text-sm text-dark-primary focus:border-emerald-500/50 outline-none resize-none transition-all placeholder:text-dark-secondary/50 shadow-inner"
                  />
                </div>
              </div>

              {/* Botones de acción inferiores */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-dark-color">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarVistaActual}
                  className="h-12 border-dark-color text-dark-secondary hover:bg-dark-hover rounded-2xl font-black text-xs tracking-widest px-8"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs tracking-widest px-8 shadow-xl shadow-blue-500/20 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {entradaSeleccionada ? 'Actualizar Historial' : 'Guardar Historial'}
                </Button>
              </div>

            </div>

            {/* Columna Derecha: Mascota, Dueño y Doctor (col-span-1) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Card 1: Mascota y Dueño */}
              <div className="dark-card p-8 space-y-6 relative z-50 group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Activity className="w-16 h-16 text-blue-500 rotate-12" />
                </div>

                <h3 className="text-xs font-black text-dark-primary tracking-wider border-b border-dark-color/50 pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Responsable y Mascota
                </h3>

                {/* Responsible Section */}
                {clienteSeleccionado ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-black text-blue-400 tracking-widest leading-none mb-1.5 opacity-80">Responsable</p>
                          {!isEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setClienteSeleccionado(null);
                                setSelectedClientId('');
                                setMascotaSeleccionada(null);
                                setSelectedPetId('');
                              }}
                              className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                            >
                              Cambiar
                            </button>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-dark-primary truncate leading-tight tracking-tight">
                          {toTitleCase(clienteSeleccionado.nombre)}
                        </h4>
                        <p className="text-[9px] text-dark-secondary font-black tracking-widest opacity-60">
                          Ced: {clienteSeleccionado.cedula || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80">
                      Responsable (Cliente) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={busquedaCliente}
                        onChange={(e) => {
                          setBusquedaCliente(e.target.value);
                          setMostrarSugerenciasCliente(true);
                        }}
                        placeholder="Cédula o nombre..."
                        className="bg-dark-bg border-dark-color/50 h-14 rounded-2xl text-[11px] font-black text-dark-primary tracking-tighter focus:border-blue-500/30 transition-all shadow-inner px-4"
                        onBlur={() => setTimeout(() => setMostrarSugerenciasCliente(false), 200)}
                        onFocus={() => setMostrarSugerenciasCliente(true)}
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-secondary opacity-30" />

                      {mostrarSugerenciasCliente && (
                        <div className="absolute left-0 w-full mt-1 z-[100] bg-white dark:bg-[#0f172a] border border-dark-color/80 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto pointer-events-auto">
                          {clientes
                            .filter(c =>
                              (c.cedula || '').toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                              (c.nombre || '').toLowerCase().includes(busquedaCliente.toLowerCase())
                            )
                            .slice(0, 10)
                            .map(c => (
                              <button
                                key={c.id_cliente}
                                type="button"
                                className="w-full text-left p-4 hover:bg-blue-500/10 border-b border-dark-color/30 last:border-0 transition-colors group"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setClienteSeleccionado(c);
                                  setSelectedClientId(c.id_cliente.toString());
                                  setMascotaSeleccionada(null);
                                  setSelectedPetId('');
                                  setBusquedaCliente('');
                                  setMostrarSugerenciasCliente(false);
                                }}
                              >
                                <p className="text-[11px] font-bold text-dark-primary tracking-tighter">{c.nombre}</p>
                                <p className="text-[9px] text-dark-secondary tracking-widest opacity-60">Ced: {c.cedula || 'N/A'}</p>
                              </button>
                            ))}
                          {clientes.filter(c =>
                            (c.cedula || '').toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                            (c.nombre || '').toLowerCase().includes(busquedaCliente.toLowerCase())
                          ).length === 0 && (
                            <div className="p-4 text-center text-xs text-dark-secondary italic">No se encontraron clientes</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Patient Section */}
                <div className="border-t border-dark-color/50 pt-4">
                  {clienteSeleccionado ? (
                    mascotaSeleccionada ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20">
                            <Dog className="w-6 h-6 text-pink-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-[10px] font-black text-pink-400 tracking-widest leading-none mb-1.5 opacity-80">Mascota</p>
                              {!isEdit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMascotaSeleccionada(null);
                                    setSelectedPetId('');
                                  }}
                                  className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                                >
                                  Cambiar
                                </button>
                              )}
                            </div>
                            <h4 className="text-xs font-black text-dark-primary truncate leading-tight tracking-tight">
                              {toTitleCase(mascotaSeleccionada.nombre)}
                            </h4>
                            <p className="text-[9px] text-dark-secondary font-black tracking-tighter opacity-60">
                              {toSentenceCase(mascotaSeleccionada.especie)} · {toSentenceCase(mascotaSeleccionada.raza) || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Enhanced Patient Details Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-dark-bg p-3 rounded-2xl border border-dark-color/50 flex flex-col justify-center">
                            <p className="text-[8px] font-black text-dark-secondary tracking-[0.1em] mb-1">Edad</p>
                            <p className="text-xs font-black text-emerald-400 break-all">{mascotaSeleccionada.edad || 'N/A'} meses</p>
                          </div>
                          <div className="bg-dark-bg p-3 rounded-2xl border border-dark-color/50 flex flex-col justify-center">
                            <p className="text-[8px] font-black text-dark-secondary tracking-[0.1em] mb-1">Peso</p>
                            <p className="text-xs font-black text-blue-400 break-all">{mascotaSeleccionada.peso || 'N/A'} kg</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80">
                          Mascota <span className="text-red-500">*</span>
                        </Label>
                        {mascotas.filter(m => m.id_cliente === clienteSeleccionado.id_cliente).length === 0 ? (
                          <p className="text-[10px] text-red-400 italic bg-red-400/5 py-3 px-4 rounded-xl border border-dashed border-red-400/30">
                            Este cliente no tiene mascotas registradas
                          </p>
                        ) : (
                          <select
                            value={selectedPetId}
                            onChange={(e) => {
                              const petIdStr = e.target.value;
                              const pet = mascotas.find(m => m.id_mascota.toString() === petIdStr);
                              if (pet) {
                                setMascotaSeleccionada(pet);
                                setSelectedPetId(petIdStr);
                              }
                            }}
                            className="w-full h-12 px-3 py-2 bg-dark-bg border border-dark-color/50 rounded-2xl text-[11px] text-dark-primary focus:border-blue-500/30 outline-none cursor-pointer"
                          >
                            <option value="" disabled className="bg-dark-bg">Seleccionar mascota...</option>
                            {mascotas
                              .filter(m => m.id_cliente === clienteSeleccionado.id_cliente)
                              .map(m => (
                                <option key={m.id_mascota} value={m.id_mascota.toString()} className="bg-dark-bg text-dark-primary">
                                  {m.nombre} ({m.especie})
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="p-4 text-center text-xs text-dark-secondary italic bg-dark-bg/30 rounded-2xl border border-dashed border-dark-color/40">
                      Primero selecciona un responsable
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Veterinario Asignado */}
              <div className="dark-card p-8 space-y-6 relative group">
                
                <h3 className="text-xs font-black text-dark-primary tracking-wider border-b border-dark-color/50 pb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Veterinario Asignado
                </h3>

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      value={busquedaVetCedula}
                      onChange={(e) => handleBusquedaVetChange(e.target.value, doctores)}
                      placeholder="Buscar doctor..."
                      className="bg-dark-bg border-dark-color/50 h-14 rounded-2xl text-[11px] font-black text-dark-primary tracking-tighter focus:border-blue-500/30 transition-all shadow-inner px-4"
                      onBlur={() => setTimeout(() => setMostrarSugerenciasVet(false), 200)}
                      onFocus={() => busquedaVetCedula && setMostrarSugerenciasVet(true)}
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-secondary opacity-30" />

                    {mostrarSugerenciasVet && doctoresFiltrados.length > 0 && (
                      <div className="absolute left-0 w-full mt-1 z-[100] bg-white dark:bg-[#0f172a] border border-dark-color/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
                        {doctoresFiltrados.map(doc => (
                          <button
                            key={doc.id}
                            type="button"
                            className="w-full text-left p-4 hover:bg-blue-500/10 border-b border-dark-color/30 last:border-0 transition-colors group"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              seleccionarVeterinario(doc);
                            }}
                          >
                            <p className="text-[11px] font-bold text-dark-primary tracking-tighter group-hover:text-blue-400 transition-colors">{doc.nombre}</p>
                            <p className="text-[9px] text-dark-secondary tracking-widest opacity-60">Cédula: {doc.cedula || 'N/A'}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Detalles del Veterinario Seleccionado */}
                  {vetSeleccionado && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-blue-400 tracking-widest leading-none mb-1">Doctor Activo</p>
                          <h5 className="text-[11px] font-bold text-dark-primary tracking-tighter">
                            {toTitleCase(vetSeleccionado.nombre)}
                          </h5>
                          <p className="text-[9px] text-dark-secondary font-bold opacity-60">Cédula: {vetSeleccionado.cedula || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </form>
        </main>
      </div>
    );
  };
  const renderInicio = () => {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="w-full space-y-8">
          {/* Tabla Global de Historial Médicos */}
          <div className="space-y-6 pt-0">
            <div className="flex items-center justify-between px-6">
              <h3 className="text-xl font-black text-dark-primary tracking-tight flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-500" />
                Mascotas con registros médicos
              </h3>
              <span className="text-[10px] font-black text-dark-secondary tracking-widest">{historialAgrupadoPorMascota.length} mascotas registradas ({historialFiltrado.length} consultas)</span>
            </div>

            <div className="dark-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">

                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-blue-400" />Mascota</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[140px]">
                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />Propietario</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-blue-400" />Documento</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" />Última Visita</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" />Último Tipo</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[140px]">
                        <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-400" />Veterinario Asignado</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold text-center w-28">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialPaginado.map((entrada, index) => (
                      <TableRow key={`${entrada.id_historial}-${index}`} className="border-dark-color hover:bg-dark-table-hover transition-colors group">

                        <TableCell>
                          <span className="font-semibold text-dark-primary text-xs">{toSentenceCase(entrada.nombreMascota)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-dark-secondary text-xs font-bold tracking-tighter">{toSentenceCase(entrada.nombreCliente)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-dark-secondary text-xs">{entrada.cedulaCliente || '---'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-dark-primary text-xs font-black">
                              {new Date(
                                (entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] : entrada.fecha) + 'T12:00:00'
                              ).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="text-[9px] text-dark-secondary  font-bold tracking-widest">{formatTo12h((entrada as any).hora) || '---'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita.map((tipo, idx) => (
                              <span key={idx} className={`px-2 py-0.5 rounded-md text-[8px] font-black  tracking-widest ${getTipoVisitaColor(tipo)}`}>
                                {toSentenceCase(tipo)}
                              </span>
                            )) : (
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black  tracking-widest ${getTipoVisitaColor(entrada.tipoVisita)}`}>
                                {toSentenceCase(entrada.tipoVisita)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-dark-primary text-xs font-bold ">{toSentenceCase(entrada.veterinario) || '---'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              onClick={() => abrirTimelineMascota(entrada)}
                              variant="outline"
                              size="sm"
                              className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                              title="Ver historial completo"
                              disabled={loading}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!isClienteRole && (
                              <Button
                                onClick={() => registrarNuevoHistorialMascota(entrada)}
                                variant="outline"
                                size="sm"
                                className="p-2 h-9 w-9 bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30"
                                title="Nueva consulta rápida"
                                disabled={loading}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {historialPaginado.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-64 text-center border-none">
                          <div className="flex flex-col items-center justify-center gap-4 text-dark-secondary">
                            <FileText className="w-12 h-12 opacity-20" />
                            <p className="font-black  tracking-[0.2em] text-sm">No se encontraron mascotas con registros</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-dark-color bg-dark-hover/20">
                <span className="text-[10px] font-black text-dark-secondary  tracking-[0.2em]">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1 || loading || totalPages === 0}
                    variant="outline"
                    size="sm"
                    className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                  >
                    <ChevronsLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading || totalPages === 0}
                    variant="outline"
                    size="sm"
                    className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || loading || totalPages === 0}
                    variant="outline"
                    size="sm"
                    className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages || loading || totalPages === 0}
                    variant="outline"
                    size="sm"
                    className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                  >
                    <ChevronsRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSeleccionCliente = () => {
    // Solo mostramos clientes si hay algo en la búsqueda
    // La cédula busca coincidencias al INICIO para mayor precisión
    const clientesFiltrados = busqueda.trim() === ''
      ? []
      : clientes.filter(c =>
        (c.cedula || '').toLowerCase().startsWith(busqueda.toLowerCase()) ||
        (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
      );

    return (
      <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right duration-500">
        <div className="w-full space-y-12">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => {
                setPasoActual('inicio');
                setBusqueda('');
              }}
              className="text-dark-secondary hover:bg-dark-hover gap-2 font-black tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" /> Cancelar y volver
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-dark-primary tracking-tighter mb-4 text-center w-full">Selección de cliente</h1>
            <p className="text-dark-secondary text-lg max-w-xl mx-auto">Busca al responsable por su número de cédula o nombre para iniciar el registro.</p>
          </div>

          <div className="flex items-center gap-4 bg-dark-card border border-dark-color rounded-[2rem] shadow-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all mb-8 max-w-4xl mx-auto px-6 overflow-hidden">
            <Search className="w-6 h-6 text-dark-secondary shrink-0" />
            <Input
              placeholder="Buscar por cédula o nombre del cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-14 border-none bg-transparent text-xl text-dark-primary focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-dark-secondary/50 shadow-none"
            />
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <h3 className="text-xs font-black text-dark-secondary tracking-[0.3em] pl-6 opacity-50 uppercase">
              {busqueda ? 'Resultados de búsqueda' : 'Todos los clientes'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientesFiltrados.map(cliente => (
                <button
                  key={cliente.id_cliente}
                  onClick={() => {
                    setClienteSeleccionado(cliente);
                    setPasoActual('mascota');
                    setBusqueda('');
                  }}
                  className="flex items-center gap-6 p-6 bg-dark-card border border-dark-color rounded-[2rem] hover:border-blue-500/40 hover:bg-dark-hover transition-all text-left group shadow-lg"
                >
                  <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-dark-primary truncate group-hover:text-blue-400 transition-colors">{cliente.nombre}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-dark-secondary tracking-widest bg-dark-hover px-2 py-1 rounded-lg">ID: {cliente.cedula || 'N/A'}</span>
                      <span className="text-[10px] font-black text-emerald-400 tracking-widest">{cliente.telefono || 'Sin telf.'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-dark-secondary group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
              {clientesFiltrados.length === 0 && (
                <div className="col-span-full text-center py-20 bg-dark-card/30 rounded-[2rem] border border-dashed border-dark-color">
                  <User className="w-12 h-12 text-dark-secondary/20 mx-auto mb-4" />
                  <p className="text-dark-secondary">No se encontró ningún cliente con esa búsqueda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSeleccionMascota = () => {
    const mascotasDelCliente = mascotas.filter(m => m.id_cliente === clienteSeleccionado?.id_cliente);

    return (
      <div className="p-8 space-y-8 animate-in slide-in-from-right duration-500">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setPasoActual('inicio')}
            className="mb-8 text-dark-secondary hover:bg-dark-hover gap-2 font-black  tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </Button>

          <header className="mb-12 flex items-center gap-8 bg-dark-card p-8 rounded-[2rem] border border-dark-color">
            <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center shrink-0">
              <User className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-dark-primary  tracking-tighter">{clienteSeleccionado?.nombre}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-dark-secondary font-medium  tracking-widest">Documento: {clienteSeleccionado?.cedula || 'N/A'}</span>
                <div className="w-1 h-1 bg-dark-color rounded-full" />
                <span className="text-sm text-dark-secondary font-medium  tracking-widest">Telf: {clienteSeleccionado?.telefono || 'N/A'}</span>
              </div>
            </div>
          </header>

          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-xl font-black text-dark-primary  tracking-tight flex items-center gap-3">
              <Heart className="w-6 h-6 text-pink-500" />
              Mascotas Asociadas
            </h2>
            <span className="text-[10px] font-black text-dark-secondary  tracking-widest">{mascotasDelCliente.length} Registradas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mascotasDelCliente.map(mascota => (
              <button
                key={mascota.id_mascota}
                onClick={() => {
                  setMascotaSeleccionada(mascota);
                  setPasoActual('timeline');
                }}
                className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 hover:border-pink-500/40 hover:bg-dark-hover transition-all text-center group shadow-xl relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-3xl bg-pink-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-xl font-black text-dark-primary  tracking-tight mb-2 group-hover:text-pink-400 transition-colors">{mascota.nombre}</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-dark-hover rounded-full text-[10px] font-black text-dark-secondary  tracking-widest border border-dark-color">
                  {mascota.especie} · {mascota.raza || 'N/A'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };


  const renderReporteCompleto = (entrada: HistorialMascota) => {
    const mascotaInfo = mascotas.find(m => m.id_mascota === entrada.id_mascota) || mascotaSeleccionada || entrada.mascota;
    const clienteInfo = clientes.find(c => c.id_cliente === mascotaInfo?.id_cliente) || mascotaInfo?.cliente || clienteSeleccionado;

    const vetRaw = (entrada as any).veterinario || 'Veterinario';
    const cleanVet = vetRaw.replace(/^(?:(?:dr|dra|doctor|doctora)\.?\s*)+/i, '');
    const formattedVet = `Dr. ${toSentenceCase(cleanVet)}`;

    return (
      <div className="flex flex-col bg-white text-slate-900 min-h-screen animate-in fade-in duration-700 overflow-y-auto print:overflow-visible print:bg-white print:block">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            aside, header, nav, .print\\:hidden, button, [role="navigation"] { display: none !important; }
            body, html { background-color: white !important; margin: 0 !important; padding: 0 !important; }
            #printable-report-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 2cm !important; box-shadow: none !important; display: block !important; }
            .grid { display: grid !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}} />
        {/* Cabecera del Reporte (No imprimible) */}
        <div className="bg-slate-900 px-10 py-6 shrink-0 print:hidden sticky top-0 z-50">
          <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setPasoActual('timeline')}
                className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl font-black text-white tracking-widest">Vista Previa del Reporte de Consulta</h2>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-widest px-8 h-12 rounded-xl"
              >
                <FileText className="w-4 h-4 mr-2" /> Imprimir / Guardar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setPasoActual('timeline')}
                className="border-slate-700 text-slate-400 hover:bg-slate-800 font-black text-xs tracking-widest px-8 h-12 rounded-xl"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido del Reporte (Formato A4) */}
        <div id="printable-report-area" className="mx-auto w-full p-16 print:p-0 bg-white print:shadow-none" style={{ maxWidth: '850px' }}>
          {/* Header del Documento */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10 text-slate-900">
            <div>
              <h1 className="text-4xl font-bold tracking-tighter mb-2">{toSentenceCase('Reporte Clínico de Consulta')}</h1>
              <p className="text-sm font-bold text-slate-500 tracking-widest text-left">Centro Veterinario KaiVet Manager</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-black">Fecha de Generación</p>
              <p className="font-bold text-slate-500">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Información de la Mascota y Dueño */}
          <div className="grid grid-cols-2 gap-10 mb-12">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mb-4">Información de la Mascota</h3>
              <p className="text-2xl font-bold text-slate-900 mb-2">{toSentenceCase(mascotaInfo?.nombre || entrada.nombreMascota)}</p>
              <div className="space-y-1 text-sm font-semibold text-slate-600">
                <p>Especie: <span className="text-slate-900">{toSentenceCase(mascotaInfo?.especie) || 'N/A'}</span></p>
                <p>Raza: <span className="text-slate-900">{toSentenceCase(mascotaInfo?.raza) || 'N/A'}</span></p>
                <p>Edad: <span className="text-slate-900">{mascotaInfo?.edad || 'N/A'} meses</span></p>
                <p>Peso: <span className="text-slate-900">{mascotaInfo?.peso || 'N/A'} kg</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mb-4">Información del Propietario</h3>
              <p className="text-2xl font-bold text-slate-900 mb-2">{toSentenceCase(clienteInfo?.nombre || entrada.nombreCliente)}</p>
              <div className="space-y-1 text-sm font-semibold text-slate-600">
                <p>ID: <span className="text-slate-900">{clienteInfo?.cedula || entrada.cedulaCliente || 'N/A'}</span></p>
                <p>Teléfono: <span className="text-slate-900">{clienteInfo?.telefono || 'N/A'}</span></p>
                <p>Dirección: <span className="text-slate-900 text-left">{toSentenceCase(clienteInfo?.direccion) || 'N/A'}</span></p>
              </div>
            </div>
          </div>

          {/* Información de la Consulta */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-12">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mb-4">Detalles de la Consulta</h3>
            <div className="grid grid-cols-3 gap-6 text-sm font-semibold text-slate-600">
              <div>
                <p className="text-slate-400">Fecha y Hora</p>
                <p className="text-slate-900 font-bold">
                  {entrada.fecha ? new Date(entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] + 'T12:00:00' : entrada.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'} - {formatTo12h((entrada as any).hora) || '00:00'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Servicio / Tipo de Visita</p>
                <p className="text-slate-900 font-bold">
                  {Array.isArray(entrada.tipoVisita) 
                    ? entrada.tipoVisita.map(t => toSentenceCase(t)).join(', ') 
                    : toSentenceCase(entrada.tipoVisita || '')}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Médico Veterinario</p>
                <p className="text-slate-900 font-bold">{formattedVet}</p>
              </div>
            </div>
          </div>

          {/* Evoluciones Clínicas de la Consulta */}
          <div className="space-y-10">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight border-b-2 border-slate-200 pb-2">Información Clínica</h3>

            <div className="space-y-8">
              {entrada.motivoConsulta && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 tracking-widest mb-2">Motivo de Consulta / Síntomas</h4>
                  <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    {toSentenceCase(entrada.motivoConsulta)}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-400 tracking-widest mb-2">Diagnóstico y Hallazgos</h4>
                <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  {toSentenceCase(entrada.diagnostico || 'No registrado')}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 tracking-widest mb-2">Tratamiento y Procedimientos</h4>
                <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  {toSentenceCase(entrada.tratamiento || 'No registrado')}
                </p>
              </div>

              {(entrada as any).observaciones && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 tracking-widest mb-2">Observaciones Adicionales</h4>
                  <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    {toSentenceCase((entrada as any).observaciones)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer del Documento */}
          <div className="mt-20 pt-10 border-t border-slate-200 text-center">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.4em]">Fin del Reporte Médico Oficial - KaiVet Manager</p>
          </div>
        </div>
      </div>
    );
  };

  const renderContenido = () => {
    switch (pasoActual) {
      case 'inicio':
        return renderInicio();
      case 'cliente':
        return renderSeleccionCliente();
      case 'mascota':
        return renderSeleccionMascota();
      case 'timeline':
        return renderTimeline();
      case 'formulario':
        return renderFormularioHistorial();
      case 'detalles':
        return entradaSeleccionada ? renderReporteDetallado(entradaSeleccionada) : renderInicio();
      case 'reporteCompleto':
        return entradaSeleccionada ? renderReporteCompleto(entradaSeleccionada) : renderInicio();
      default:
        return renderInicio();
    }
  };

  return (
    <div className="flex flex-col bg-[#0a0b0c]">
      {!['formulario', 'detalles', 'reporteCompleto'].includes(pasoActual) && (
        <header className="px-10 py-6 border-b border-dark-color bg-dark-bg shrink-0">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-12">
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <ClipboardPlus className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-black text-dark-primary  tracking-tighter">Historial Mascotas</h1>
              </div>
            </div>

            {/* Buscador Integrado en el Encabezado */}
            {pasoActual === 'inicio' && !isClienteRole && (
              <div className="flex-1 max-w-xl group">
                <div className="relative flex items-center bg-dark-card border border-dark-color rounded-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-inner px-4 overflow-hidden">
                  <Search className="w-4 h-4 text-dark-secondary shrink-0 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <Input
                    placeholder="Buscar por propietario, cédula o mascota..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="h-11 border-none bg-transparent text-xs font-bold text-dark-primary focus-visible:ring-0 placeholder:text-dark-secondary/30 shadow-none w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 shrink-0">
              {pasoActual === 'inicio' && !isClienteRole && (
                <button
                  onClick={exportarHistorialesExcel}
                  className="dark-button-secondary font-bold gap-2 flex items-center"
                  disabled={loading || historialFiltrado.length === 0}
                >
                  <FileText className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>
              )}
              {pasoActual === 'inicio' && !isClienteRole && (
                <button
                  onClick={() => abrirFormulario()}
                  className="dark-button-primary font-bold gap-2 flex items-center"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {renderContenido()}

      {/* Alerta de Confirmación de Eliminación Reutilizable */}
      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, entrada: null })}
        onConfirm={handleEliminarEntrada}
        title="¿Eliminar registro?"
        description="Esta acción borrará el registro para siempre y no se podrá deshacer."
      />

      {/* Modal de Detalles del Historial */}
      <Dialog open={detalleModal.isOpen} onOpenChange={(open) => !open && setDetalleModal({ isOpen: false, entrada: null })}>
        <DialogContent className="bg-dark-card border-dark-color max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dark-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Informe Clínico Detallado
            </DialogTitle>
            <DialogDescription className="text-dark-secondary">
              {detalleModal.entrada ? `Expediente médico #${detalleModal.entrada.id_historial}` : ''}
            </DialogDescription>
          </DialogHeader>

          {detalleModal.entrada && (() => {
            const entrada = detalleModal.entrada;
            const mascotaInfo = mascotas.find((m: any) => m.id_mascota === entrada.id_mascota) || entrada.mascota;
            const clienteInfo = clientes.find((c: any) => c.id_cliente === mascotaInfo?.id_cliente) || mascotaInfo?.cliente;
            return (
              <div className="space-y-6 pt-2">
                {/* Fila superior: Mascota, Cliente, Visita */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mascota */}
                  <div className="bg-dark-bg/50 border border-dark-color/50 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-pink-400 tracking-widest">Mascota</p>
                      <h4 className="text-sm font-black text-dark-primary">{toSentenceCase(mascotaInfo?.nombre || entrada.nombreMascota || 'N/A')}</h4>
                      {mascotaInfo && (
                        <p className="text-[10px] text-dark-secondary">{toSentenceCase(mascotaInfo.especie)} · {toSentenceCase(mascotaInfo.raza) || 'N/A'}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-dark-color/30">
                      <div className="bg-dark-bg/50 p-2 rounded-xl">
                        <p className="text-[8px] text-dark-secondary">Edad</p>
                        <p className="text-[10px] font-black text-emerald-400">{mascotaInfo?.edad || 'N/A'} m</p>
                      </div>
                      <div className="bg-dark-bg/50 p-2 rounded-xl">
                        <p className="text-[8px] text-dark-secondary">Peso</p>
                        <p className="text-[10px] font-black text-blue-400">{mascotaInfo?.peso || 'N/A'} kg</p>
                      </div>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="bg-dark-bg/50 border border-dark-color/50 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-[9px] font-black text-blue-400 tracking-widest">Cliente</p>
                    </div>
                    <h4 className="text-sm font-black text-dark-primary">{toSentenceCase(clienteInfo?.nombre || entrada.nombreCliente || 'N/A')}</h4>
                    <p className="text-[10px] text-dark-secondary">Cédula: {clienteInfo?.cedula || entrada.cedulaCliente || 'N/A'}</p>
                    <div className="pt-2 border-t border-dark-color/30 space-y-1">
                      <p className="text-[10px] text-dark-secondary">{clienteInfo?.telefono || 'Sin teléfono'}</p>
                      <p className="text-[10px] text-dark-secondary">{toSentenceCase(clienteInfo?.direccion || 'Sin dirección')}</p>
                    </div>
                  </div>

                  {/* Visita */}
                  <div className="bg-dark-bg/50 border border-dark-color/50 rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-[9px] font-black text-dark-secondary tracking-widest">Información de Visita</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[8px] text-dark-secondary">Fecha</p>
                        <p className="text-xs font-black text-dark-primary">{entrada.fecha ? new Date((entrada.fecha.split('T')[0]) + 'T12:00:00').toLocaleDateString('es-CO') : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-[8px] text-dark-secondary">Hora</p>
                        <p className="text-xs font-black text-dark-primary">{formatTo12h((entrada as any).hora) || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[8px] text-dark-secondary">Veterinario</p>
                        <p className="text-xs font-black text-dark-primary">{toSentenceCase(entrada.veterinario) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagnóstico */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-l-4 border-pink-500 pl-3">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <h3 className="text-sm font-black text-dark-primary">Diagnóstico y Evolución</h3>
                  </div>
                  <div className="bg-dark-bg/50 border border-dark-color/50 rounded-2xl p-4">
                    <p className="text-sm text-dark-primary leading-relaxed whitespace-pre-wrap">{toSentenceCase(entrada.diagnostico || 'Sin diagnóstico registrado')}</p>
                  </div>
                </div>

                {/* Tratamiento */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-black text-dark-primary">Tratamiento Realizado</h3>
                  </div>
                  <div className="bg-dark-bg/50 border border-dark-color/50 rounded-2xl p-4">
                    <p className="text-sm text-dark-primary leading-relaxed whitespace-pre-wrap">{toSentenceCase(entrada.tratamiento || 'Sin tratamiento registrado')}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setDetalleModal({ isOpen: false, entrada: null });
                      setEntradaSeleccionada(entrada);
                      setPasoActual('reporteCompleto');
                    }}
                    className="dark-button-primary font-bold gap-2 flex items-center"
                  >
                    <FileText className="w-4 h-4 text-white" />
                    <span className="text-white">Generar Reporte</span>
                  </button>
                  <button
                    onClick={() => setDetalleModal({ isOpen: false, entrada: null })}
                    className="dark-button-primary font-bold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}