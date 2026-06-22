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

const toSentenceCase = (str: string = '') => {
  if (!str) return '';
  const s = str.trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const toTitleCase = (str: string = '') => {
  if (!str) return '';
  return str.trim().toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  const exportarHistorialesPDF = () => {
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.");
        return;
      }

      const fechaGeneracion = new Date().toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const filasHtml = historialFiltrado.map(h => `
        <tr>
          <td>${h.id_historial}</td>
          <td style="font-weight: 600;">${h.nombreMascota || ''}</td>
          <td>${h.nombreCliente || ''} (${h.cedulaCliente || '—'})</td>
          <td>${h.fecha ? h.fecha.split('T')[0] : ''} ${(h as any).hora || ''}</td>
          <td>${h.veterinario || '—'}</td>
          <td style="font-size: 11px;">${h.diagnostico || '—'}</td>
          <td style="font-size: 11px;">${h.tratamiento || '—'}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Historial Clínico - KaiVet</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
              body {
                font-family: 'Outfit', sans-serif;
                color: #1e293b;
                padding: 40px;
                margin: 0;
                background-color: #ffffff;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .logo-container {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .logo-icon {
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 18px;
              }
              .logo-text {
                font-size: 22px;
                font-weight: 700;
                color: #0f172a;
              }
              .logo-sub {
                color: #3b82f6;
              }
              .report-info {
                text-align: right;
              }
              .title {
                font-size: 24px;
                font-weight: 700;
                color: #0f172a;
                margin: 0;
                margin-top: 10px;
              }
              .date {
                font-size: 12px;
                color: #64748b;
                margin-top: 5px;
              }
              .summary {
                margin-bottom: 25px;
                font-size: 14px;
                color: #475569;
                background-color: #f8fafc;
                padding: 12px 20px;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
                display: inline-block;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th {
                background-color: #f1f5f9;
                color: #475569;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                text-align: left;
                padding: 12px;
                border-bottom: 2px solid #e2e8f0;
              }
              td {
                padding: 12px;
                font-size: 13px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
              }
              tr:nth-child(even) td {
                background-color: #f8fafc;
              }
              .footer {
                text-align: center;
                font-size: 11px;
                color: #94a3b8;
                margin-top: 60px;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
              }
              @page {
                size: letter;
                margin: 20mm;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <div class="logo-icon">🐾</div>
                <div class="logo-text">KaiVet<span class="logo-sub"> Manager</span></div>
              </div>
              <div class="report-info">
                <div class="title">Reporte de Historial Clínico</div>
                <div class="date">Generado el ${fechaGeneracion}</div>
              </div>
            </div>
            
            <div class="summary">
              <strong>Total de registros:</strong> ${historialFiltrado.length} entradas de historial clínico encontradas.
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">ID</th>
                  <th style="width: 12%;">Mascota</th>
                  <th style="width: 18%;">Propietario</th>
                  <th style="width: 14%;">Fecha/Hora</th>
                  <th style="width: 14%;">Veterinario</th>
                  <th style="width: 17%;">Diagnóstico</th>
                  <th style="width: 17%;">Tratamiento</th>
                </tr>
              </thead>
              <tbody>
                ${filasHtml}
              </tbody>
            </table>

            <div class="footer">
              Este es un reporte oficial emitido por la plataforma KaiVet Manager. &copy; ${new Date().getFullYear()} KaiVet. Todos los derechos reservados.
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("Historial médico listo para imprimir / guardar como PDF");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar reporte");
    }
  };

  // Paginación para Historial
  const [paginaActualMascota, setPaginaActualMascota] = useState(1);

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
      entrada.id_historial.toString().includes(searchLow) ||
      (entrada.descripcion || '').toLowerCase().includes(searchLow) ||
      (entrada.diagnostico || '').toLowerCase().includes(searchLow) ||
      (entrada.tratamiento || '').toLowerCase().includes(searchLow) ||
      (entrada.nombreMascota || '').toLowerCase().includes(searchLow) ||
      (entrada.nombreCliente || '').toLowerCase().includes(searchLow) ||
      (entrada.cedulaCliente || '').toLowerCase().includes(searchLow) ||
      (entrada.veterinario || '').toLowerCase().includes(searchLow)
    );
  }).sort((a, b) => (a.nombreMascota || '').localeCompare(b.nombreMascota || '', 'es', { sensitivity: 'base' }));

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
        const doctoresList = [
          ...usuarios
            .filter(u => {
              const roleName = u.rol?.nombre_rol?.toLowerCase();
              return roleName === 'veterinario' || roleName === 'administrador' || roleName === 'admin';
            })
            .map(u => ({ id: `user-${u.id_usuario}`, nombre: `Dr. ${u.nombre_usuario}`, cedula: (u as any).cedula })),
          ...empleados
            .filter(e => e.cargo?.toLowerCase() === 'veterinario')
            .map(e => ({ id: `emp-${e.id_empleado}`, nombre: `Dr. ${e.nombre}`, cedula: e.cedula }))
        ];

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
        <header className="bg-dark-card border-b border-dark-color px-10 py-6 flex justify-between items-center shrink-0 z-20 sticky top-0">
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
              <span>Generar reporte histórico</span>
            </Button>
          </div>
        </header>

        <div className="p-10 space-y-12">
          {/* Fila Superior: Mascota, Cliente e Info Cita */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mt-12">
            {/* Tarjeta de la Mascota */}
            <div className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-pink-500/10 transition-colors" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl mb-3 transform -rotate-3 group-hover:rotate-0 transition-transform">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-black text-dark-primary tracking-tight mb-0.5">{toSentenceCase(mascotaInfo?.nombre || (entrada as any).nombreMascota || 'Mascota')}</h3>
                <p className="text-[9px] font-black text-pink-400 tracking-[0.2em] mb-3 uppercase">Mascota</p>

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
            <div className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-2xl relative overflow-hidden group">
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
                    <p className="text-[10px] text-dark-secondary font-black tracking-tighter opacity-60 uppercase">Cédula: {clienteInfo?.cedula || 'N/A'}</p>
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
            <div className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mb-12 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="relative z-10 flex flex-col">
                <h4 className="text-[9px] font-black text-dark-secondary tracking-[0.3em] pl-1 opacity-50 uppercase mb-3">{toSentenceCase('Información de visita')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-dark-secondary tracking-widest mb-0.5 uppercase">Fecha</p>
                      <p className="text-xs font-black text-dark-primary">{entrada.fecha ? new Date(entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] + 'T12:00:00' : entrada.fecha + 'T12:00:00').toLocaleDateString() : 'Sin fecha'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-dark-secondary tracking-widest mb-0.5 uppercase">Hora</p>
                      <p className="text-xs font-black text-dark-primary">{formatTo12h((entrada as any).hora) || '00:00'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secciones Clínicas: Diagnóstico y Tratamiento (Narrower) */}
          <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-4 border-pink-600 pl-8 py-2">
                <Activity className="w-8 h-8 text-pink-500" />
                <h3 className="text-2xl font-black text-dark-primary tracking-[0.15em] uppercase">{toSentenceCase('Diagnóstico y evolución')}</h3>
              </div>
              <div className="bg-dark-card p-12 rounded-[3.5rem] border border-dark-color shadow-2xl transform transition-all hover:scale-[1.005]">
                <p className="text-xl text-dark-primary leading-relaxed font-medium whitespace-pre-wrap min-h-[100px]">
                  {toSentenceCase(entrada.diagnostico || 'Sin diagnóstico registrado')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-4 border-emerald-600 pl-8 py-2">
                <Stethoscope className="w-8 h-8 text-emerald-500" />
                <h3 className="text-2xl font-black text-dark-primary tracking-[0.15em] uppercase">{toSentenceCase('Tratamiento realizado')}</h3>
              </div>
              <div className="bg-dark-card p-12 rounded-[3.5rem] border border-dark-color shadow-2xl transform transition-all hover:scale-[1.005]">
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

  function renderFormularioHistorial() {
    const isEdit = !!entradaSeleccionada;

    // Deduplicar doctores (Usuario + Empleado)
    const doctores = [
      ...usuarios
        .filter(u => {
          const roleName = u.rol?.nombre_rol?.toLowerCase();
          return roleName === 'veterinario' || roleName === 'administrador' || roleName === 'admin';
        })
        .map(u => ({ id: `user-${u.id_usuario}`, nombre: `Dr. ${u.nombre_usuario}`, cedula: (u as any).cedula })),
      ...empleados
        .filter(e => e.cargo?.toLowerCase() === 'veterinario')
        .map(e => ({ id: `emp-${e.id_empleado}`, nombre: `Dr. ${e.nombre}`, cedula: e.cedula }))
    ].filter((v, i, a) => a.findIndex(t => t.nombre === v.nombre) === i);

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
              <div className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 shadow-xl space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

                <h2 className="text-lg font-black text-dark-primary flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl">
                    <ClipboardList className="w-5 h-5 text-blue-400" />
                  </div>
                  Detalles de la Entrada Clínica
                </h2>

                {/* Tipos de Visita */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80 uppercase">
                    Tipo de servicio <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {visitTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleTipoVisita(type.id)}
                        className={`px-5 py-3 rounded-2xl border text-xs font-black tracking-widest transition-all flex items-center gap-3 ${formData.tipoVisita.includes(type.id)
                          ? `bg-blue-500/20 border-blue-500 text-blue-400 shadow-md transform scale-105`
                          : 'bg-dark-bg border-dark-color/50 text-dark-secondary hover:bg-dark-hover'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${formData.tipoVisita.includes(type.id) ? `bg-blue-400 animate-pulse` : 'bg-dark-secondary opacity-30'}`} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diagnóstico */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80 uppercase">
                      Diagnóstico y evolución <span className="text-red-500">*</span>
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
              <div className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700 pointer-events-none" />

                <h2 className="text-lg font-black text-dark-primary flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <HeartPulse className="w-5 h-5 text-emerald-400" />
                  </div>
                  Plan de Tratamiento
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-dark-secondary tracking-[0.2em] opacity-80 uppercase">
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

            {/* Columna Derecha: Paciente, Dueño y Doctor (col-span-1) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Card 1: Paciente y Dueño */}
              <div className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 shadow-xl space-y-6 relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Activity className="w-16 h-16 text-blue-500 rotate-12" />
                </div>

                <h3 className="text-xs font-black text-dark-primary tracking-wider uppercase border-b border-dark-color/50 pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Responsable y Paciente
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
                        <div className="absolute left-0 w-full mt-1 z-[100] bg-dark-card border border-dark-color rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto pointer-events-auto">
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
                              <p className="text-[10px] font-black text-pink-400 tracking-widest leading-none mb-1.5 opacity-80">Paciente</p>
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
                          Paciente (Mascota) <span className="text-red-500">*</span>
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
              <div className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 shadow-xl space-y-6 relative group">
                
                <h3 className="text-xs font-black text-dark-primary tracking-wider uppercase border-b border-dark-color/50 pb-3 flex items-center gap-2">
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
                      <div className="absolute left-0 w-full mt-1 z-[100] bg-dark-card border border-dark-color rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
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
                Registros históricos recientes
              </h3>
              <span className="text-[10px] font-black text-dark-secondary tracking-widest">{historialFiltrado.length} entradas totales</span>
            </div>

            <div className="dark-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">

                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-blue-400" />Paciente</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[140px]">
                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />Propietario</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-blue-400" />Documento</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" />Fecha / hora</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                        <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" />Categoría</div>
                      </TableHead>
                      <TableHead className="text-dark-primary font-semibold min-w-[140px]">
                        <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-400" />Veterinario</div>
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
                              onClick={() => abrirDetalles(entrada)}
                              variant="outline"
                              size="sm"
                              className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                              title="Ver reporte"
                              disabled={loading}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!isClienteRole && (
                              <>
                                <Button
                                  onClick={() => abrirFormulario(entrada)}
                                  variant="outline"
                                  size="sm"
                                  className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                                  title="Editar"
                                  disabled={loading}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {!isVetRole && (
                                  <Button
                                    onClick={() => setDeleteDialog({ isOpen: true, entrada })}
                                    variant="outline"
                                    size="sm"
                                    className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                                    title="Eliminar"
                                    disabled={loading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
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
                            <p className="font-black  tracking-[0.2em] text-sm">No se encontraron registros médicos</p>
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
      <div className="p-8 space-y-8 animate-in slide-in-from-right duration-500">
        <div className="max-w-6xl mx-auto space-y-12">
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

  const renderTimeline = () => {
    const historialDeLaMascota = historiales
      .filter(h => h.id_mascota === mascotaSeleccionada?.id_mascota)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Paginación para Historial
    const elementosPorPaginaMascota = 5;

    const totalPaginas = Math.ceil(historialDeLaMascota.length / elementosPorPaginaMascota);
    const indiceInicio = (paginaActualMascota - 1) * elementosPorPaginaMascota;
    const indiceFin = indiceInicio + elementosPorPaginaMascota;
    const historialesPaginados = historialDeLaMascota.slice(indiceInicio, indiceFin);

    return (
      <div className="p-8 space-y-8 animate-in zoom-in-95 duration-500">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => setPasoActual('mascota')}
              className="text-dark-secondary hover:bg-dark-hover gap-2 font-black  tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a Mascotas
            </Button>
            {!isClienteRole && (
              <Button
                onClick={() => abrirFormulario(undefined, true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest px-8 rounded-2xl h-12 shadow-xl shadow-blue-500/20 gap-2 transition-all active:scale-95 hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> Nuevo
              </Button>
            )}
          </div>

          <header className="bg-dark-card border border-dark-color rounded-[3rem] p-10 shadow-2xl mb-12 flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0 shadow-2xl rotate-3">
              <Heart className="w-16 h-16 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-black text-dark-primary  tracking-tighter mb-2">{mascotaSeleccionada?.nombre}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <span className="text-sm font-black text-pink-400  tracking-widest">Edad: {mascotaSeleccionada?.edad || 'N/A'} meses</span>
                <div className="w-1.5 h-1.5 bg-dark-color rounded-full" />
                <span className="text-sm font-black text-emerald-400  tracking-widest">Vacunas: {mascotaSeleccionada?.vacunas ? 'AL DÍA' : 'PENDIENTE'}</span>
              </div>
            </div>
          </header>

          <div className="space-y-12 pl-8 border-l border-dark-color relative">
            {historialesPaginados.map((entrada, index) => (
              <div key={`${entrada.id_historial}-${index}`} className="relative">
                <div className="absolute -left-[41px] top-4 w-5 h-5 rounded-full bg-[#0a0b0c] border-[4px] border-blue-500 z-10" />

                <div className="bg-dark-card border border-dark-color rounded-[2.5rem] p-8 shadow-xl hover:border-blue-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black  tracking-widest underline decoration-2">
                          ID: #{entrada.id_historial}
                        </span>
                        <span className="text-[10px] font-black text-dark-secondary  tracking-widest">
                          {new Date(
                            (entrada.fecha.includes('T') ? entrada.fecha.split('T')[0] : entrada.fecha) + 'T12:00:00'
                          ).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-dark-primary  tracking-tight group-hover:text-blue-400 transition-colors">
                        {toSentenceCase(entrada.descripcion) || 'Consulta médica'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => abrirDetalles(entrada)} variant="outline" size="icon" className="w-10 h-10 rounded-2xl border-dark-color text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-5 h-5" />
                      </Button>
                      {!isClienteRole && (
                        <>
                          <Button onClick={() => abrirFormulario(entrada)} variant="outline" size="icon" className="w-10 h-10 rounded-2xl border-dark-color text-yellow-400 hover:bg-yellow-500/10">
                            <Edit className="w-5 h-5" />
                          </Button>
                          {!isVetRole && (
                            <Button onClick={() => setDeleteDialog({ isOpen: true, entrada })} variant="outline" size="icon" className="w-10 h-10 rounded-2xl border-dark-color text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Paginación */}
            {historialDeLaMascota.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 px-4 pb-4">
                <div className="text-sm text-dark-secondary">
                  Mostrando {indiceInicio + 1}-{Math.min(indiceFin, historialDeLaMascota.length)} de {historialDeLaMascota.length} entradas
                </div>

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

  const renderReporteCompleto = (idMascota: number) => {
    const historialesMascota = historiales
      .filter(h => h.id_mascota === idMascota)
      .sort((a, b) => {
        const dateA = new Date(a.fecha + 'T' + ((a as any).hora || '00:00')).getTime();
        const dateB = new Date(b.fecha + 'T' + ((b as any).hora || '00:00')).getTime();
        return dateB - dateA; // Newest first
      });

    const mascotaInfo = mascotas.find(m => m.id_mascota === idMascota) || mascotaSeleccionada || historialesMascota[0]?.mascota;
    const clienteInfo = clientes.find(c => c.id_cliente === mascotaInfo?.id_cliente) || mascotaInfo?.cliente || clienteSeleccionado;

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
        <div className="bg-slate-900 px-10 py-6 flex justify-between items-center shrink-0 print:hidden sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setPasoActual('detalles')}
              className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Vista Previa del Reporte Completo</h2>
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
              onClick={() => setPasoActual('detalles')}
              className="border-slate-700 text-slate-400 hover:bg-slate-800 font-black text-xs tracking-widest px-8 h-12 rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </div>

        {/* Contenido del Reporte (Formato A4) */}
        <div id="printable-report-area" className="max-w-[1000px] mx-auto w-full p-16 print:p-0 bg-white print:shadow-none shadow-2xl my-10 print:my-0">
          {/* Header del Documento */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10 text-slate-900">
            <div>
              <h1 className="text-4xl font-bold tracking-tighter mb-2">{toSentenceCase('Historial Clínico Consolidado')}</h1>
              <p className="text-sm font-bold text-slate-500 tracking-widest uppercase text-left">Centro Veterinario KaiVet Manager</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-black">Fecha de Generación</p>
              <p className="font-bold text-slate-500">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Información del Paciente y Dueño */}
          <div className="grid grid-cols-2 gap-10 mb-12">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-4">Información del Paciente</h3>
              <p className="text-2xl font-bold text-slate-900 mb-2">{toSentenceCase(mascotaInfo?.nombre || historialesMascota[0]?.nombreMascota)}</p>
              <div className="space-y-1 text-sm font-semibold text-slate-600">
                <p>Especie: <span className="text-slate-900">{toSentenceCase(mascotaInfo?.especie) || 'N/A'}</span></p>
                <p>Raza: <span className="text-slate-900">{toSentenceCase(mascotaInfo?.raza) || 'N/A'}</span></p>
                <p>Edad: <span className="text-slate-900">{mascotaInfo?.edad || 'N/A'} meses</span></p>
                <p>Peso: <span className="text-slate-900">{mascotaInfo?.peso || 'N/A'} kg</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-4">Información del Propietario</h3>
              <p className="text-2xl font-bold text-slate-900 mb-2">{toSentenceCase(clienteInfo?.nombre || historialesMascota[0]?.nombreCliente)}</p>
              <div className="space-y-1 text-sm font-semibold text-slate-600">
                <p>ID: <span className="text-slate-900">{clienteInfo?.cedula || historialesMascota[0]?.cedulaCliente || 'N/A'}</span></p>
                <p>Teléfono: <span className="text-slate-900">{clienteInfo?.telefono || 'N/A'}</span></p>
                <p>Dirección: <span className="text-slate-900 text-left">{toSentenceCase(clienteInfo?.direccion) || 'N/A'}</span></p>
              </div>
            </div>
          </div>

          {/* Listado de Evoluciones Clínicas */}
          <div className="space-y-12">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight border-b-2 border-slate-200 pb-2 uppercase">{toSentenceCase(`Cronología médica (${historialesMascota.length} Entradas)`)}</h3>

            {historialesMascota.map((h, index) => {
              const vetRaw = (h as any).veterinario || 'Veterinario';
              const cleanVet = vetRaw.replace(/^(?:(?:dr|dra|doctor|doctora)\.?\s*)+/i, '');
              const formattedVet = `Dr. ${toSentenceCase(cleanVet)}`;

              return (
                <div key={h.id_historial} className="relative pl-6 border-l-2 border-slate-200 pb-12 last:pb-0">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-400 tracking-widest uppercase mb-1">
                      <span>{h.fecha ? new Date(h.fecha.includes('T') ? h.fecha.split('T')[0] + 'T12:00:00' : h.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</span>
                      <span className="text-slate-200">|</span>
                      <span>{formatTo12h((h as any).hora) || '00:00'}</span>
                      <span className="text-slate-200">|</span>
                      <span className="text-slate-900">{formattedVet}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">{toSentenceCase('Evolución clínica')}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-2 text-blue-800">Diagnóstico Y Hallazgos</p>
                      <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {toSentenceCase(h.diagnostico || 'No registrado')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-2 text-emerald-800">Tratamiento Y Procedimientos</p>
                      <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {toSentenceCase(h.tratamiento || 'No registrado')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer del Documento */}
          <div className="mt-20 pt-10 border-t border-slate-200 text-center uppercase">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.4em]">Fin Del Reporte Médico Oficial - KaiVet Manager</p>
          </div>
        </div>
      </div>
    );
  }

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
        return entradaSeleccionada ? renderReporteCompleto(entradaSeleccionada.id_mascota) : renderInicio();
      default:
        return renderInicio();
    }
  };

  return (
    <div className="flex flex-col bg-[#0a0b0c]">
      {!['formulario', 'detalles', 'reporteCompleto'].includes(pasoActual) && (
        <header className="px-10 py-6 border-b border-dark-color bg-dark-bg shrink-0">
          <div className="flex items-center justify-between gap-12">
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <ClipboardPlus className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-black text-dark-primary  tracking-tighter">Historial Mascotas</h1>
              </div>
              <div className="flex items-center gap-4 mt-1">
                {pasoActual !== 'inicio' && (
                  <>
                    {!isClienteRole && (
                      <>
                        <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest">
                          <div className={`w-1.5 h-1.5 rounded-full ${pasoActual === 'cliente' ? 'bg-blue-500' : 'bg-dark-color'}`} />
                          <span className={pasoActual === 'cliente' ? 'text-blue-400' : 'text-dark-secondary'}>Cliente</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-dark-color" />
                      </>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest">
                      <div className={`w-1.5 h-1.5 rounded-full ${pasoActual === 'mascota' ? 'bg-pink-500' : 'bg-dark-color'}`} />
                      <span className={pasoActual === 'mascota' ? 'text-pink-400' : 'text-dark-secondary'}>Mascota</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-dark-color" />
                    <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest">
                      <div className={`w-1.5 h-1.5 rounded-full ${pasoActual === 'timeline' ? 'bg-emerald-500' : 'bg-dark-color'}`} />
                      <span className={pasoActual === 'timeline' ? 'text-emerald-400' : 'text-dark-secondary'}>Historial</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Buscador Integrado en el Encabezado */}
            {pasoActual === 'inicio' && !isClienteRole && (
              <div className="flex-1 max-w-xl group">
                <div className="relative flex items-center bg-dark-card border border-dark-color rounded-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all shadow-inner px-4 overflow-hidden">
                  <Search className="w-4 h-4 text-dark-secondary shrink-0 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <Input
                    placeholder="Buscar historial..."
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
                  onClick={exportarHistorialesPDF}
                  className="dark-button-secondary font-bold gap-2 flex items-center"
                  disabled={loading || historialFiltrado.length === 0}
                >
                  <FileText className="w-4 h-4" />
                  <span>Exportar Reporte</span>
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

    </div>
  );
}