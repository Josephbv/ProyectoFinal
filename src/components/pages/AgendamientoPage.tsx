import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { toast } from "sonner";
import { Calendar, Plus, Search, Clock, Edit, Trash2, User, Stethoscope, Ticket, Eye, FileText, DollarSign } from "lucide-react";
import { useAgendamiento, Agendamiento, AgendamientoServicio } from "../hooks/useAgendamiento";
import { CitaModal } from "../modals/CitaModal";

interface AgendamientoPageProps {
  onNavigate?: (page: string) => void;
}

export function AgendamientoPage({ onNavigate }: AgendamientoPageProps) {
  const { citas, loading, agendarCita, actualizarCita, eliminarCita } = useAgendamiento();

  const [busqueda, setBusqueda] = useState("");
  const [citaModal, setCitaModal] = useState({ isOpen: false, cita: null as Agendamiento | null, readOnly: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, cita: null as Agendamiento | null });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const citasFiltradas = citas.filter(cita => {
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

    const result = await actualizarCita(citaModal.cita.id_agendamiento, citaData);
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
                <TableRow className="border-dark-color hover:bg-dark-hover">
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Fecha</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[100px]">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" />Hora</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold w-[200px]">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" />Cliente</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4" />Doc. Cliente</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                    <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4" />Empleado Asignado</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[250px]">
                    <div className="flex items-center gap-2"><Ticket className="w-4 h-4" />Servicios</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-2"><DollarSign className="w-4 h-4" />Pago</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citasPaginadas.map((cita: Agendamiento) => (
                  <TableRow key={cita.id_agendamiento} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                    <TableCell className="font-medium text-dark-primary">
                      {cita.fecha ? new Date(cita.fecha.includes('T') ? cita.fecha.split('T')[0] + 'T12:00:00' : cita.fecha + 'T12:00:00').toLocaleDateString() : 'Sin fecha'}
                    </TableCell>
                    <TableCell className="text-dark-primary">
                      {cita.hora ? new Date(cita.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sin hora'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-dark-primary">{cita.cliente?.nombre || 'Desconocido'}</span>
                    </TableCell>
                    <TableCell className="text-dark-secondary font-mono text-xs">
                      {cita.cliente?.cedula || 'N/A'}
                    </TableCell>
                    <TableCell className="text-dark-secondary">
                      {cita.empleado?.nombre || 'Sin empleado'}
                    </TableCell>
                    <TableCell className="text-dark-secondary truncate max-w-[250px]" title={formatearServicios(cita.agendamiento_servicios)}>
                      {formatearServicios(cita.agendamiento_servicios)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          onClick={() => onNavigate?.("Ventas")}
                          variant="outline"
                          size="sm"
                          className="gap-1.5 bg-emerald-500/15 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all duration-200"
                          title="Ir a Ventas"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs font-medium">Pagar</span>
                        </Button>
                      </div>
                    </TableCell>
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
                          className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                          disabled={loading}
                          title="Eliminar cita"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
          {citasFiltradas.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color">
              <div className="text-sm text-dark-secondary">
                Mostrando {startIndex + 1}-{Math.min(endIndex, citasFiltradas.length)} de {citasFiltradas.length} citas
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                  variant="outline" size="sm" className="border-dark-color text-dark-secondary">Anterior</Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                  variant="outline" size="sm" className="border-dark-color text-dark-secondary">Siguiente</Button>
              </div>
            </div>
          )}
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

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, cita: null })}>
        <AlertDialogContent className="bg-dark-card border-dark-color">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dark-primary">¿Eliminar Cita?</AlertDialogTitle>
            <AlertDialogDescription className="text-dark-secondary">
              Estás a punto de eliminar la cita seleccionada del {deleteDialog.cita?.fecha}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-color text-dark-secondary hover:bg-dark-hover">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminarCita}
              className="bg-red-600 text-white hover:bg-red-700 font-bold"
              disabled={loading}
            >
              Eliminar Cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
