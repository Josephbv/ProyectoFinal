import { useState } from "react";
import { Button } from "../../../shared/components/button";
import { Switch } from "../../../shared/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shared/components/dialog";
import { toast } from "sonner";
import { Wrench, Plus, Search, Clock, DollarSign, Eye, Edit, Trash2, Users, Award, AlertCircle, CheckCircle, Tag, Star, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ListFilter, Hash } from "lucide-react";
import { useServicios, Servicio } from "../hooks/useServicios";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";
import { ServicioModal } from "../components/ServicioModal";

export function ServiciosPage() {
  const { servicios, loading, agregarServicio, actualizarServicio, eliminarServicio, buscarServicios, obtenerEstadisticas } = useServicios();
  const { user } = useEmailAuth();

  const roleName = typeof user?.rol === 'string' ? user.rol : (user?.rol as any)?.nombre_rol || '';
  const isVetRole = roleName.toLowerCase().includes('veterinario');

  const [busqueda, setBusqueda] = useState("");
  const [servicioModal, setServicioModal] = useState({ isOpen: false, servicio: null as Servicio | null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, servicio: null as Servicio | null });
  const [verDetallesDialog, setVerDetallesDialog] = useState({ isOpen: false, servicio: null as Servicio | null });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(10);

  const serviciosFiltrados = buscarServicios(busqueda);
  const estadisticas = obtenerEstadisticas();

  // Calcular paginación
  const totalPaginas = Math.ceil(serviciosFiltrados.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const indiceFin = indiceInicio + elementosPorPagina;
  const serviciosPaginados = serviciosFiltrados.slice(indiceInicio, indiceFin);

  // Resetear página cuando cambian los filtros
  const resetearPagina = () => {
    setPaginaActual(1);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-green-900/20 text-green-400";
      case "inactivo":
        return "bg-red-900/20 text-red-400";
      case "mantenimiento":
        return "bg-orange-900/20 text-orange-400";
      default:
        return "bg-gray-900/20 text-gray-400";
    }
  };



  const handleCrearServicio = async (servicioData: any) => {
    const result = await agregarServicio(servicioData);
    if (result.success) {
      toast.success("Servicio registrado exitosamente");
      cerrarServicioModal();
      return { success: true };
    } else {
      toast.error(result.error || "Error al registrar servicio");
      return { success: false };
    }
  };

  const handleActualizarServicio = async (servicioData: any) => {
    if (!servicioModal.servicio) return { success: false };

    const result = await actualizarServicio(
      servicioModal.servicio.id_servicio || servicioModal.servicio.id!,
      servicioData
    );
    if (result.success) {
      toast.success('Servicio actualizado exitosamente');
      cerrarServicioModal();
      return { success: true };
    } else {
      toast.error(result.error || 'Error al actualizar servicio');
      return { success: false };
    }
  };

  const handleCambiarEstado = async (servicio: Servicio) => {
    const nuevoEstado = servicio.estado === 'activo' ? 'inactivo' : 'activo';
    const result = await actualizarServicio(
      servicio.id_servicio || servicio.id!,
      { ...servicio, estado: nuevoEstado }
    );
    if (result.success) {
      toast.success(`Servicio marcado como ${nuevoEstado}`);
    } else {
      toast.error('Error al cambiar estado del servicio');
    }
  };

  const handleEliminarServicio = async () => {
    if (!deleteDialog.servicio) return;

    const result = await eliminarServicio(deleteDialog.servicio.id_servicio || deleteDialog.servicio.id!);
    if (result.success) {
      toast.success("Servicio eliminado exitosamente");
      setDeleteDialog({ isOpen: false, servicio: null });
    } else {
      toast.error(result.error || "Error al eliminar servicio");
    }
  };

  const abrirServicioModal = (servicio?: Servicio) => {
    setServicioModal({ isOpen: true, servicio: servicio || null });
  };

  const cerrarServicioModal = () => {
    setServicioModal({ isOpen: false, servicio: null });
  };

  const abrirDetalles = (servicio: Servicio) => {
    setVerDetallesDialog({ isOpen: true, servicio });
  };

  const cerrarDetalles = () => {
    setVerDetallesDialog({ isOpen: false, servicio: null });
  };

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Gestión de Servicios</h1>
            <p className="text-sm text-dark-secondary mt-1">Administra el catálogo de servicios veterinarios y sus precios</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  resetearPagina();
                }}
                className="pl-10 pr-4 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
              />
            </div>
            {!isVetRole && (
              <button
                onClick={() => abrirServicioModal()}
                className="dark-button-primary gap-2 flex items-center"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Registrar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Tabla de Servicios */}
        <div className="dark-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">
                  <TableHead className="text-dark-primary font-semibold min-w-[300px]">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-400" />
                      Servicio
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      Precio
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <ListFilter className="w-4 h-4 text-blue-400" />
                      Estado
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviciosPaginados.map((servicio, index) => (
                  <TableRow key={`${servicio.id || index}`} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                    <TableCell className="font-medium text-dark-primary">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {(servicio.nombre || servicio.nombre_servicio)?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="font-medium">{servicio.nombre || servicio.nombre_servicio || 'Sin nombre'}</div>
                          <div className="text-sm text-dark-secondary max-w-48 truncate">{servicio.descripcion || 'Sin descripción'}</div>
                        </div>
                      </div>
                    </TableCell>



                    <TableCell className="text-dark-primary">
                      <div>
                        <div className="font-semibold">${(servicio.precio || 0).toLocaleString()}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={servicio.estado === 'activo'}
                          onCheckedChange={() => handleCambiarEstado(servicio)}
                          disabled={loading || isVetRole}
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-wider w-12 ${servicio.estado === 'activo' ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                          {servicio.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => abrirDetalles(servicio)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                          title="Ver detalle"
                          disabled={loading}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!isVetRole && (
                          <>
                            <Button
                              onClick={() => abrirServicioModal(servicio)}
                              variant="outline"
                              size="sm"
                              className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                              title="Editar"
                              disabled={loading}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setDeleteDialog({ isOpen: true, servicio })}
                              variant="outline"
                              size="sm"
                              className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                              title="Eliminar"
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {serviciosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Wrench className="w-16 h-16 text-dark-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">
                  {busqueda ? 'No se encontraron servicios' : 'No hay servicios registrados'}
                </h3>
                <p className="text-dark-secondary mb-6">
                  {busqueda
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza registrando el primer servicio veterinario'
                  }
                </p>
                {!busqueda && (
                  <Button
                    onClick={() => abrirServicioModal()}
                    className="bg-dark-cta text-white hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Servicio
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-dark-color">
            <div className="text-sm text-dark-secondary">
              Mostrando {indiceInicio + 1}-{Math.min(indiceFin, serviciosFiltrados.length)} de {serviciosFiltrados.length} servicios
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-dark-secondary">Página {paginaActual} de {totalPaginas || 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={() => setPaginaActual(1)} disabled={paginaActual === 1 || loading || totalPaginas === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                <Button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1 || loading || totalPaginas === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                <Button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                <Button onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal de registro/edición */}
      <ServicioModal
        isOpen={servicioModal.isOpen}
        onClose={cerrarServicioModal}
        onSubmit={servicioModal.servicio ? handleActualizarServicio : handleCrearServicio}
        servicio={servicioModal.servicio}
        servicios={servicios}
        loading={loading}
      />

      {/* Modal de Ver Detalles (Solo lectura) */}
      <Dialog open={verDetallesDialog.isOpen} onOpenChange={cerrarDetalles}>
        <DialogContent className="bg-dark-card border-dark-color max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-dark-primary flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              Detalles del Servicio
            </DialogTitle>
            <DialogDescription className="text-dark-secondary">
              Información completa del servicio veterinario
            </DialogDescription>
          </DialogHeader>

          {verDetallesDialog.servicio && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-dark-primary border-b border-dark-color pb-2">
                  Información General
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Nombre</label>
                    <p className="text-dark-primary font-bold text-lg">{verDetallesDialog.servicio.nombre || verDetallesDialog.servicio.nombre_servicio}</p>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-dark-secondary mb-1 border-t border-dark-color pt-4">Descripción</label>
                    <p className="text-dark-primary leading-relaxed bg-dark-hover/30 p-4 rounded-xl border border-dark-color/30">{verDetallesDialog.servicio.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
              </div>

              {/* Información Comercial */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-dark-primary border-b border-dark-color pb-2">
                  Información Comercial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Precio</label>
                    <p className="text-dark-primary font-semibold">${verDetallesDialog.servicio.precio?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Estado</label>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getEstadoColor(verDetallesDialog.servicio.estado || 'activo')} w-fit`}>
                      {verDetallesDialog.servicio.estado === 'activo' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {(verDetallesDialog.servicio.estado || 'activo').charAt(0).toUpperCase() + (verDetallesDialog.servicio.estado || 'activo').slice(1)}
                    </div>
                  </div>
                </div>
              </div>





              <div className="flex justify-end">
                <Button
                  onClick={cerrarDetalles}
                  className="bg-dark-cta text-white hover:bg-blue-600"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, servicio: null })}
        onConfirm={handleEliminarServicio}
        title="¿Eliminar Servicio?"
        description={`¿Estás seguro de eliminar "${deleteDialog.servicio?.nombre || 'este servicio'}"? Se perderán todas las configuraciones asociadas.`}
        loading={loading}
      />
    </>
  );
}
