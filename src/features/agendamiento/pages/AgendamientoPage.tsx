import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { Calendar, Plus, Search, Clock, Edit, Trash2, User, Stethoscope, Ticket, Eye, FileText, DollarSign, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAgendamiento, Agendamiento, AgendamientoServicio } from "../hooks/useAgendamiento";
import { CitaModal } from "../components/CitaModal";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";
import { formatTo12h } from '../../../shared/utils/formatTime';
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";

interface AgendamientoPageProps {
  onNavigate?: (page: string) => void;
  onPagar?: (cita: Agendamiento) => void;
}

export function AgendamientoPage({ onNavigate, onPagar }: AgendamientoPageProps) {
  const { citas, loading, agendarCita, actualizarCita, eliminarCita } = useAgendamiento();
  const { user } = useEmailAuth();

  const [busqueda, setBusqueda] = useState("");
  const [citaModal, setCitaModal] = useState({ isOpen: false, cita: null as Agendamiento | null, readOnly: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, cita: null as Agendamiento | null });

  const isClienteRole = user?.rol?.toLowerCase().includes('cliente');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const citasFiltradas = citas.filter(cita => {
    // Si es cliente, solo ve sus citas
    if (isClienteRole) {
      if (cita.id_cliente !== user?.id_cliente) return false;
    }

    const matchBusqueda = (cita.cliente?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cita.cliente?.cedula || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cita.empleado?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cita.fecha || '').includes(busqueda);
    return matchBusqueda;
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(citasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const citasPaginadas = citasFiltradas.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda
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

    const result = await actualizarCita(citaModal.cita.id_agendamiento, { ...citaModal.cita, ...citaData });
    if (result.success) {
      toast.success("Cita actualizada exitosamente");
      return { success: true };
    } else {
      toast.error(result.error || "Error al actualizar cita");
      return { success: false };
    }
  };

  const handleEliminarCita = async () => {
    if (!deleteDialog.cita) return;

    const result = await eliminarCita(deleteDialog.cita.id_agendamiento);
    if (result.success) {
      toast.success("Cita eliminada exitosamente");
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

  const formatearServicios = (agendamiento_servicios?: AgendamientoServicio[]) => {
    if (!agendamiento_servicios || agendamiento_servicios.length === 0) return 'Sin servicios';
    return agendamiento_servicios.map(s => s.servicio?.nombre_servicio).join(', ');
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
            {!isClienteRole && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, empleado o fecha..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10 pr-4 py-2 w-72 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
                />
              </div>
            )}
            <button
              onClick={() => abrirCitaModal()}
              className="dark-button-primary gap-2 flex items-center"
            >
              <Plus className="w-4 h-4" />
              Agendar Cita
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
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400" />Fecha</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[100px]">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" />Hora</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold w-[200px]">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-indigo-400" />Cliente</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400" />Doc. Cliente</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center min-w-[150px]">
                    <div className="flex items-center justify-center gap-2"><Ticket className="w-4 h-4 text-indigo-400" />Servicios</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-2"><Clock className="w-4 h-4 text-indigo-400" />Estado</div>
                  </TableHead>
                  {!isClienteRole && (
                    <TableHead className="text-dark-primary font-semibold text-center min-w-[100px]">
                      <div className="flex items-center justify-center gap-2"><DollarSign className="w-4 h-4 text-indigo-400" />Pago</div>
                    </TableHead>
                  )}
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citasPaginadas.map((cita: Agendamiento) => {
                  // Verificar si está marcado como pagado en localStorage (failsafe)
                  const isPagadoLocal = localStorage.getItem(`pagado_${cita.id_agendamiento}`) === 'true';
                  const estadoFinal = isPagadoLocal ? 'completada' : cita.estado;

                  return (
                    <TableRow key={cita.id_agendamiento} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                      <TableCell className="font-medium text-dark-primary">
                        {cita.fecha ? new Date(cita.fecha.includes('T') ? cita.fecha.split('T')[0] + 'T12:00:00' : cita.fecha + 'T12:00:00').toLocaleDateString() : 'Sin fecha'}
                      </TableCell>
                      <TableCell className="text-dark-primary">
                        {cita.hora ? formatTo12h(cita.hora) : 'Sin hora'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-dark-primary">{cita.cliente?.nombre || 'Desconocido'}</span>
                      </TableCell>
                      <TableCell className="text-dark-secondary font-mono text-xs">
                        {cita.cliente?.cedula || 'N/A'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-bold">
                          {cita.agendamiento_servicios?.length ?? 0} servicio{(cita.agendamiento_servicios?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {estadoFinal === 'completada' ? (
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3" />
                              Completada
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3" />
                              Activa
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {!isClienteRole && (
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {estadoFinal === 'completada' ? (
                              <div className="flex flex-col items-center">
                                <div className="p-1 bg-green-500/10 rounded-full mb-0.5">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-[9px] font-black text-green-500 tracking-tighter">PAGADO</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => onPagar?.(cita)}
                                variant="outline"
                                size="sm"
                                className="gap-1.5 bg-emerald-500/15 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all duration-200"
                                title="Ir a Ventas"
                              >
                                <DollarSign className="w-4 h-4" />
                                <span className="text-xs font-medium">Pagar</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => abrirCitaModal(cita, true)}
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                            disabled={loading}
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => abrirCitaModal(cita)}
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                            disabled={loading}
                            title="Editar cita"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setDeleteDialog({ isOpen: true, cita })}
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={loading || estadoFinal === 'completada'}
                            title={estadoFinal === 'completada' ? "No se puede eliminar una cita pagada" : "Eliminar cita"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {citasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-dark-secondary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">
                  {busqueda ? 'No se encontraron citas' : 'No hay citas programadas'}
                </h3>
                <p className="text-dark-secondary mb-6">
                  {busqueda
                    ? 'Intenta con otras fechas o términos'
                    : 'Comienza agendando tu primera cita'
                  }
                </p>
                {!busqueda && (
                  <Button
                    onClick={() => abrirCitaModal()}
                    className="dark-button-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color">
            <div className="text-sm text-dark-secondary">
              Mostrando {startIndex + 1}-{Math.min(endIndex, citasFiltradas.length)} de {citasFiltradas.length} citas
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-dark-secondary">Página {currentPage} de {totalPages || 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                <Button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
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
        description={`¿Estás seguro de eliminar la cita del día ${deleteDialog.cita?.fecha}? Esta acción no se puede deshacer.`}
        loading={loading}
      />
    </>
  );
}
