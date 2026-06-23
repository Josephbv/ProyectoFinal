import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { toast } from "sonner";
import { Calendar, Plus, Search, Clock, Edit, Trash2, User, Stethoscope, Ticket, Eye, FileText, DollarSign, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Activity, Dog } from "lucide-react";
import { useAgendamiento, Agendamiento, AgendamientoServicio } from "../hooks/useAgendamiento";
import { CitaModal } from "../components/CitaModal";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";
import { formatTo12h } from '../../../shared/utils/formatTime';
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";

import { useClientes } from "../../clientes/hooks/useClientes";
import { useHistorialMascotas } from "../../historial/hooks/useHistorialMascotas";
import { useMascotas } from "../../mascotas/hooks/useMascotas";

interface AgendamientoPageProps {
  onNavigate?: (page: string) => void;
  onPagar?: (cita: Agendamiento) => void;
}

export function AgendamientoPage({ onNavigate, onPagar }: AgendamientoPageProps) {
  const { citas, loading, agendarCita, actualizarCita, eliminarCita } = useAgendamiento();
  const { user } = useEmailAuth();
  const { clientes } = useClientes();
  const { mascotas } = useMascotas();
  const { crearEntradaHistorial } = useHistorialMascotas();

  const [busqueda, setBusqueda] = useState("");
  const [citaModal, setCitaModal] = useState({ isOpen: false, cita: null as Agendamiento | null, readOnly: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, cita: null as Agendamiento | null });

  const roleName = typeof user?.rol === 'string' ? user.rol : (user?.rol as any)?.nombre_rol || '';
  const isClienteRole = roleName.toLowerCase().includes('cliente');
  const isVetRole = roleName.toLowerCase().includes('veterinario');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const citasFiltradas = citas.filter(cita => {
    if (cita.estado === 'cancelada') return false;
    if (isClienteRole) {
      if (cita.id_cliente !== user?.id_cliente) return false;
    }
    if (isVetRole) {
      if (cita.id_empleado !== user?.id_empleado) return false;
    }
    const mascotaAsociada = mascotas.find(m => m.id_mascota === cita.id_mascota);
    const nombreMascota = mascotaAsociada ? mascotaAsociada.nombre : '';

    const matchBusqueda = (cita.cliente?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cita.cliente?.cedula || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cita.empleado?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      nombreMascota.toLowerCase().includes(busqueda.toLowerCase()) ||
      (cita.fecha || '').includes(busqueda);
    return matchBusqueda;
  }).sort((a, b) => (a.cliente?.nombre || '').localeCompare(b.cliente?.nombre || '', 'es', { sensitivity: 'base' }));

  const totalPages = Math.ceil(citasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const citasPaginadas = citasFiltradas.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  const handleCrearCita = async (citaData: Partial<Agendamiento>) => {
    const result = await agendarCita(citaData);
    if (result.success) {
      toast.success("Cita agendada exitosamente");
      return { success: true };
    } else {
      toast.error(result.error || "Error al crear cita");
      return { success: false };
    }
  };

  const handleActualizarCita = async (citaData: Partial<Agendamiento>) => {
    if (!citaModal.cita) return { success: false };

    const intentandoCompletar = citaData.estado === 'completada' && citaModal.cita.estado !== 'completada';

    const result = await actualizarCita(citaModal.cita.id_agendamiento, { ...citaModal.cita, ...citaData });

    if (result.success) {
      toast.success("Cita actualizada exitosamente");

      // AUTO-GENERAR HISTORIAL CLÍNICO SI SE COMPLETA
      if (intentandoCompletar && citaModal.cita.id_mascota) {
        try {
          const serviciosNombres = citaModal.cita.agendamiento_servicios?.map(as => as.servicio?.nombre_servicio).filter(Boolean).join(', ') || 'Consulta General';

          await crearEntradaHistorial({
            id_mascota: citaModal.cita.id_mascota,
            fecha: new Date().toISOString().split('T')[0],
            motivoConsulta: `Atención programada: ${serviciosNombres}`,
            descripcion: `Registro automático generado desde módulo de agendamiento. Servicios realizados: ${serviciosNombres}`,
            veterinario: citaModal.cita.empleado?.nombre || 'Personal KaiVet',
            tipoVisita: ['Cita Programada'],
            diagnostico: 'Pendiente de valoración detallada',
            tratamiento: 'Pendiente',
            estado: 'normal'
          });
          toast.success("🩺 Historial clínico actualizado automáticamente");
        } catch (hErr) {
          console.error("Error al auto-generar historial:", hErr);
          toast.error("Cita guardada, pero hubo un error actualizando el historial clínico.");
        }
      }

      return { success: true };
    } else {
      toast.error(result.error || "Error al actualizar cita");
      return { success: false };
    }
  };

  const handleEliminarCita = async () => {
    if (!deleteDialog.cita) return;
    const result = await actualizarCita(deleteDialog.cita.id_agendamiento, {
      ...deleteDialog.cita,
      estado: 'cancelada'
    });

    if (result.success) {
      toast.success("Cita removida exitosamente");
      setDeleteDialog({ isOpen: false, cita: null });
    } else {
      toast.error(result.error || "Error al eliminar cita");
    }
  };

  const abrirCitaModal = (cita?: Agendamiento, readOnly: boolean = false) => {
    setCitaModal({ isOpen: true, cita: cita || null, readOnly });
  };

  const cerrarCitaModal = () => {
    setCitaModal({ isOpen: false, cita: null, readOnly: false });
  };

  return (
    <>
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Agendamiento de Citas</h1>
            <p className="text-sm text-dark-secondary mt-1">Programa citas y asigna empleados a los pacientes</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-dark-hover border border-dark-color rounded-lg text-dark-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => abrirCitaModal()}
              className="dark-button-primary font-bold gap-2 flex items-center"
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
                  <TableHead className="text-dark-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Fecha
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      Hora
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      Cliente
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Dog className="w-4 h-4 text-blue-400" />
                      Mascota
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Estado
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-36">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citasPaginadas.map((cita: Agendamiento) => {
                  const isPagadoLocal = localStorage.getItem(`pagado_${cita.id_agendamiento}`) === 'true';
                  const estadoFinal = isPagadoLocal ? 'completada' : cita.estado;

                  return (
                    <TableRow key={cita.id_agendamiento} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                      <TableCell className="text-dark-primary font-medium">
                        {cita.fecha
                          ? new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'Sin fecha'}
                      </TableCell>
                      <TableCell className="text-dark-primary font-medium">
                        {cita.hora ? formatTo12h(cita.hora) : 'Sin hora'}
                      </TableCell>
                      <TableCell className="font-medium text-dark-primary">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow">
                            {(cita.cliente?.nombre || 'D').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{cita.cliente?.nombre || 'Desconocido'}</div>
                            <div className="text-xs text-dark-secondary">{cita.cliente?.cedula ? `C.C. ${cita.cliente.cedula}` : 'Sin documento'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-dark-primary font-semibold">
                        {(() => {
                          const mas = mascotas.find(m => m.id_mascota === cita.id_mascota);
                          return (
                            <span className="bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full text-xs font-bold">
                              {mas?.nombre || 'Consulta General'}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            estadoFinal === 'completada' 
                              ? 'bg-green-950/20 text-green-400 border border-green-500/20' 
                              : 'bg-amber-900/20 text-amber-400 border border-amber-500/20'
                          }`}>
                            {estadoFinal === 'completada' ? 'Completada' : 'Activa'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Button 
                            onClick={() => abrirCitaModal(cita, true)} 
                            variant="outline" 
                            size="sm" 
                            className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => abrirCitaModal(cita)} 
                            variant="outline" 
                            size="sm" 
                            className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* Botón Pagar — solo para citas ACTIVAS (no completadas) */}
                          {estadoFinal !== 'completada' && onPagar && !isVetRole && !isClienteRole && (
                            <Button
                              onClick={() => onPagar(cita)}
                              variant="outline"
                              size="sm"
                              disabled={cita.fecha ? cita.fecha > new Date().toLocaleDateString('en-CA') : false}
                              className={`p-2 h-9 w-9 bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30 ${cita.fecha && cita.fecha > new Date().toLocaleDateString('en-CA') ? 'opacity-40 cursor-not-allowed' : ''}`}
                              title={cita.fecha && cita.fecha > new Date().toLocaleDateString('en-CA') ? "El pago solo se puede registrar el día de la cita o posterior" : "Registrar pago"}
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            onClick={() => setDeleteDialog({ isOpen: true, cita })} 
                            variant="outline" 
                            size="sm" 
                            className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30" 
                            disabled={estadoFinal === 'completada'}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-dark-color">
            <div className="text-sm text-dark-secondary">
              Mostrando {startIndex + 1}-{Math.min(endIndex, citasFiltradas.length)} de {citasFiltradas.length} citas
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-dark-secondary">Página {currentPage} de {totalPages || 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1 || loading || totalPages === 0} 
                  variant="outline" 
                  size="sm" 
                  className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                >
                  <ChevronsLeft className="w-3 h-3" />
                </Button>
                <Button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1 || loading || totalPages === 0} 
                  variant="outline" 
                  size="sm" 
                  className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages || loading || totalPages === 0} 
                  variant="outline" 
                  size="sm" 
                  className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button 
                  onClick={() => setCurrentPage(totalPages)} 
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
      </main>

      <CitaModal
        isOpen={citaModal.isOpen}
        onClose={cerrarCitaModal}
        onSubmit={citaModal.cita ? handleActualizarCita : handleCrearCita}
        cita={citaModal.cita}
        loading={loading}
        readOnly={citaModal.readOnly}
      />

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, cita: null })}
        onConfirm={handleEliminarCita}
        title="¿Eliminar Cita?"
        description="¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer."
        loading={loading}
      />
    </>
  );
}
