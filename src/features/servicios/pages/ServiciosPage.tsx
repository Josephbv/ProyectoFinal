import { useState } from "react";
import { Button } from "../../../shared/components/button";
import { Switch } from "../../../shared/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shared/components/dialog";
import { toast } from "sonner";
import { Wrench, Plus, Search, Clock, DollarSign, Eye, Edit, Trash2, Users, Award, AlertCircle, CheckCircle, Tag, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useServicios, Servicio } from "../hooks/useServicios";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";
import { ServicioModal } from "../components/ServicioModal";

export function ServiciosPage() {
  const { servicios, loading, agregarServicio, actualizarServicio, eliminarServicio, buscarServicios, obtenerEstadisticas } = useServicios();

  const [busqueda, setBusqueda] = useState("");
  const [servicioModal, setServicioModal] = useState({ isOpen: false, servicio: null as Servicio | null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, servicio: null as Servicio | null });
  const [verDetallesDialog, setVerDetallesDialog] = useState({ isOpen: false, servicio: null as Servicio | null });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(8);

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

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "consulta":
        return "bg-blue-900/20 text-blue-400";
      case "cirugia":
        return "bg-purple-900/20 text-purple-400";
      case "vacunacion":
        return "bg-green-900/20 text-green-400";
      case "laboratorio":
        return "bg-cyan-900/20 text-cyan-400";
      case "estetica":
        return "bg-pink-900/20 text-pink-400";
      case "emergencia":
        return "bg-red-900/20 text-red-400";
      case "domicilio":
        return "bg-orange-900/20 text-orange-400";
      case "especializada":
        return "bg-violet-900/20 text-violet-400";
      default:
        return "bg-gray-900/20 text-gray-400";
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < count ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
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

    const result = await actualizarServicio(servicioModal.servicio.id!, servicioData);
    if (result.success) {
      toast.success("Servicio actualizado exitosamente");
      cerrarServicioModal();
      return { success: true };
    } else {
      toast.error(result.error || "Error al actualizar servicio");
      return { success: false };
    }
  };

  const handleCambiarEstado = async (servicio: Servicio) => {
    const nuevoEstado = servicio.estado === 'activo' ? 'inactivo' : 'activo';

    const result = await actualizarServicio(servicio.id!, { estado: nuevoEstado });
    if (result.success) {
      toast.success(`Servicio marcado como ${nuevoEstado}`);
    } else {
      toast.error("Error al cambiar estado del servicio");
    }
  };

  const handleEliminarServicio = async () => {
    if (!deleteDialog.servicio) return;

    const result = await eliminarServicio(deleteDialog.servicio.id!);
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
            <button
              onClick={() => abrirServicioModal()}
              className="dark-button-primary gap-2 flex items-center"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Registrar
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Tabla de Servicios */}
        <div className="dark-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-dark-color hover:bg-dark-hover">
                  <TableHead className="text-dark-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Servicio
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold">Precio</TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center">Estado</TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviciosPaginados.map((servicio) => (
                  <TableRow key={servicio.id} className="border-dark-color hover:bg-dark-table-hover transition-colors">
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
                          disabled={loading}
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
                          className="p-2 h-9 w-9 border-dark-color text-blue-400 hover:bg-blue-900/20 hover:border-blue-400"
                          title="Ver detalle"
                          disabled={loading}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => abrirServicioModal(servicio)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 border-dark-color text-yellow-400 hover:bg-yellow-900/20 hover:border-yellow-400"
                          title="Editar"
                          disabled={loading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteDialog({ isOpen: true, servicio })}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 border-dark-color text-red-400 hover:bg-red-900/20 hover:border-red-400"
                          title="Eliminar"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-dark-color">
              <div className="text-sm text-dark-secondary">
                Mostrando {indiceInicio + 1}-{Math.min(indiceFin, serviciosFiltrados.length)} de {serviciosFiltrados.length} servicios
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="border-dark-color text-dark-secondary hover:bg-dark-hover hover:text-dark-primary"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNumber;
                    if (totalPaginas <= 5) {
                      pageNumber = i + 1;
                    } else if (paginaActual <= 3) {
                      pageNumber = i + 1;
                    } else if (paginaActual >= totalPaginas - 2) {
                      pageNumber = totalPaginas - 4 + i;
                    } else {
                      pageNumber = paginaActual - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={paginaActual === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaginaActual(pageNumber)}
                        className={`w-8 h-8 p-0 ${paginaActual === pageNumber
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border-dark-color text-dark-secondary hover:bg-dark-hover hover:text-dark-primary"
                          }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="border-dark-color text-dark-secondary hover:bg-dark-hover hover:text-dark-primary"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Footer de la tabla */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color">
            <div className="text-sm text-dark-secondary">
              Total: {servicios.length} servicios registrados
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-secondary">Activos: {estadisticas.serviciosActivos}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span className="text-dark-secondary">Ingresos: ${(estadisticas.ingresosPotenciales / 1000000).toFixed(1)}M</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Nombre</label>
                    <p className="text-dark-primary">{verDetallesDialog.servicio.nombre || verDetallesDialog.servicio.nombre_servicio}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Categoría</label>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCategoriaColor(verDetallesDialog.servicio.categoria || 'consulta')} w-fit`}>
                      <Tag className="w-3 h-3" />
                      {(verDetallesDialog.servicio.categoria || 'consulta').charAt(0).toUpperCase() + (verDetallesDialog.servicio.categoria || 'consulta').slice(1)}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Descripción</label>
                    <p className="text-dark-primary">{verDetallesDialog.servicio.descripcion || 'Sin descripción'}</p>
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

              {/* Equipos y Materiales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-dark-primary border-b border-dark-color pb-2">
                  Equipos y Materiales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Equipo Necesario</label>
                    <div className="flex flex-wrap gap-2">
                      {verDetallesDialog.servicio.equipoNecesario?.length ? (
                        verDetallesDialog.servicio.equipoNecesario.map((equipo, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-900/20 text-blue-400 rounded text-sm">
                            {equipo}
                          </span>
                        ))
                      ) : (
                        <p className="text-dark-secondary">No hay equipos especificados</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Materiales Incluidos</label>
                    <div className="flex flex-wrap gap-2">
                      {verDetallesDialog.servicio.materialesIncluidos?.length ? (
                        verDetallesDialog.servicio.materialesIncluidos.map((material, index) => (
                          <span key={index} className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-sm">
                            {material}
                          </span>
                        ))
                      ) : (
                        <p className="text-dark-secondary">No hay materiales especificados</p>
                      )}
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
