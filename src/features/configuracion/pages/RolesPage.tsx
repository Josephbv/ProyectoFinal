import { useState } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../shared/components/dialog";
import { toast } from "sonner";
import { Shield, Plus, Search, Users, Eye, Edit, Trash2, Lock, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Switch } from "../../../shared/components/switch";
import { RolModal } from "../components/RolModal";
import { useRoles, Rol } from "../hooks/useRoles";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";

export function RolesPage() {
  const { roles, loading, crearRol, actualizarRol, eliminarRol, toggleActivoRol } = useRoles();
  const [busqueda, setBusqueda] = useState("");
  const [rolModal, setRolModal] = useState({ isOpen: false, rol: null as Rol | null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, rol: null as Rol | null });
  const [detallesDialog, setDetallesDialog] = useState({ isOpen: false, rol: null as Rol | null });

  const rolesFiltrados = roles.filter(rol =>
    (rol.nombre || '').toLowerCase().includes((busqueda || '').toLowerCase())
  );

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(10);

  const totalPaginas = Math.ceil(rolesFiltrados.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const indiceFin = indiceInicio + elementosPorPagina;
  const rolesPaginados = rolesFiltrados.slice(indiceInicio, indiceFin);

  const handleCrearRol = async (rolData: any) => {
    const resultado = await crearRol({
      nombre: rolData.nombre,
      modulos: rolData.modulos || [],
      activo: rolData.activo || true
    });

    if (resultado.success) {
      toast.success("Rol creado exitosamente");
      cerrarRolModal();
    } else {
      toast.error(resultado.error || "Error al crear rol");
    }

    return resultado;
  };

  const handleActualizarRol = async (rolData: any) => {
    if (!rolModal.rol) return { success: false };

    const resultado = await actualizarRol(rolModal.rol.id, {
      nombre: rolData.nombre,
      modulos: rolData.modulos || [],
      activo: rolData.activo
    });

    if (resultado.success) {
      toast.success("Rol actualizado exitosamente");
      cerrarRolModal();
    } else {
      toast.error(resultado.error || "Error al actualizar rol");
    }

    return resultado;
  };

  const handleEliminarRol = async () => {
    if (!deleteDialog.rol) return;

    const resultado = await eliminarRol(deleteDialog.rol.id);

    if (resultado.success) {
      toast.success("Rol eliminado exitosamente");
    } else {
      toast.error(resultado.error || "Error al eliminar rol");
    }

    setDeleteDialog({ isOpen: false, rol: null });
  };

  const handleToggleActivo = async (rol: Rol) => {
    const resultado = await toggleActivoRol(rol.id);

    if (resultado.success) {
      toast.success(`Rol ${rol.activo ? 'desactivado' : 'activado'} exitosamente`);
    } else {
      toast.error(resultado.error || "Error al cambiar estado del rol");
    }
  };

  const abrirRolModal = (rol?: Rol) => {
    setRolModal({ isOpen: true, rol: rol || null });
  };

  const cerrarRolModal = () => {
    setRolModal({ isOpen: false, rol: null });
  };

  const rolesActivos = roles.filter(r => r.activo);
  const totalModulos = roles.reduce((acc, r) => acc + (r.modulos?.length || 0), 0);

  const getColorForRole = (roleName: string) => {
    const colors = {
      'Administrador': 'bg-red-600',
      'Cliente': 'bg-blue-600',
      'Veterinario': 'bg-green-600'
    };
    return colors[roleName as keyof typeof colors] || 'bg-gray-600';
  };

  return (
    <>
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Gestión de Roles</h1>
            <p className="text-sm text-dark-secondary mt-1">Administra roles y permisos del sistema KaiVet Manager</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar por nombre de rol..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
              />
            </div>

            <button
              onClick={() => abrirRolModal()}
              className="dark-button-primary gap-2 flex items-center"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Nuevo Rol
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Descripción de Roles - Ahora en la parte superior */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="dark-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-primary">Administrador</h4>
                <p className="text-sm text-dark-secondary">Control total</p>
              </div>
            </div>
            <p className="text-sm text-dark-secondary">
              Acceso completo a todas las funcionalidades del sistema KaiVet Manager.
              Puede gestionar usuarios, configuraciones y generar reportes.
            </p>
          </div>

          <div className="dark-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-primary">Cliente</h4>
                <p className="text-sm text-dark-secondary">Acceso limitado</p>
              </div>
            </div>
            <p className="text-sm text-dark-secondary">
              Permite a los clientes consultar el historial de sus mascotas y
              agendar citas de manera autónoma.
            </p>
          </div>

          <div className="dark-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-dark-primary">Veterinario</h4>
                <p className="text-sm text-dark-secondary">Operaciones diarias</p>
              </div>
            </div>
            <p className="text-sm text-dark-secondary">
              Rol para personal médico con acceso a operaciones diarias como
              agendamiento, historial clínico y asistencia en consultas.
            </p>
          </div>
        </div>

        <div className="dark-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">
                  <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" />Rol</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                    <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-400" />Módulos</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" />Estado</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesPaginados.map((rol, index) => (
                  <TableRow key={`${rol.id}-${index}`} className="border-dark-color hover:bg-dark-table-hover">
                    <TableCell className="font-medium text-dark-primary">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${getColorForRole(rol.nombre)} rounded-full flex items-center justify-center`}>
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">{rol.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-dark-primary">
                      <div className="flex items-center gap-1">
                        <Lock className="w-4 h-4 text-dark-secondary" />
                        <span className="font-medium">{(rol.modulos || []).length}</span>
                        <span className="text-dark-secondary text-sm">módulos</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rol.activo}
                          onCheckedChange={() => handleToggleActivo(rol)}
                          disabled={loading}
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-wider w-12 ${rol.activo ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                          {rol.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-1.5">
                        <Button
                          onClick={() => setDetallesDialog({ isOpen: true, rol })}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                          disabled={loading}
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => abrirRolModal(rol)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                          disabled={loading || (rol.nombre || '').toLowerCase() === 'administrador'}
                          title={(rol.nombre || '').toLowerCase() === 'administrador'
                            ? 'No se puede editar el rol Administrador'
                            : ['veterinario', 'cliente'].includes((rol.nombre || '').toLowerCase())
                              ? 'Editar módulos del rol (nombre protegido)'
                              : 'Editar rol'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteDialog({ isOpen: true, rol })}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                          disabled={loading || ['administrador', 'cliente', 'veterinario'].includes((rol.nombre || '').toLowerCase())}
                          title={['administrador', 'cliente', 'veterinario'].includes((rol.nombre || '').toLowerCase()) ? 'No se puede eliminar los roles base del sistema' : 'Eliminar rol'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {rolesFiltrados.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color px-4 pb-4">
              <div className="text-sm text-dark-secondary">
                Mostrando {indiceInicio + 1}-{Math.min(indiceFin, rolesFiltrados.length)} de {rolesFiltrados.length} roles
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1 || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1 || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Modales */}
      <RolModal
        isOpen={rolModal.isOpen}
        onClose={cerrarRolModal}
        onSubmit={rolModal.rol ? handleActualizarRol : handleCrearRol}
        rol={rolModal.rol}
        loading={loading}
        roles={roles}
      />

      {/* Modal de Ver Detalles */}
      <Dialog open={detallesDialog.isOpen} onOpenChange={() => setDetallesDialog({ isOpen: false, rol: null })}>
        <DialogContent className="max-w-3xl bg-dark-card border-dark-color">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Detalles del Rol
            </DialogTitle>
            <DialogDescription className="text-dark-secondary">
              Información completa del rol y sus permisos asignados
            </DialogDescription>
          </DialogHeader>

          {detallesDialog.rol && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="bg-dark-hover border border-dark-color rounded-lg p-4">
                <h3 className="text-lg font-semibold text-dark-primary mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Información General
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Nombre del Rol</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${getColorForRole(detallesDialog.rol.nombre)} rounded-full flex items-center justify-center`}>
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-dark-primary font-semibold">{detallesDialog.rol.nombre}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Estado</label>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${detallesDialog.rol.activo ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'
                      }`}>
                      {detallesDialog.rol.activo ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Total de Módulos</label>
                    <p className="text-dark-primary font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-400" />
                      {detallesDialog.rol.modulos.length} módulos asignados
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-secondary mb-1">Última Modificación</label>
                    <p className="text-dark-primary">{detallesDialog.rol.fechaModificacion}</p>
                  </div>
                </div>
              </div>

              {/* Módulos */}
              <div className="bg-dark-hover border border-dark-color rounded-lg p-4">
                <h3 className="text-lg font-semibold text-dark-primary mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Módulos Asignados
                </h3>
                {detallesDialog.rol.modulos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {detallesDialog.rol.modulos.map((modulo, index) => (
                      <div key={index} className="flex items-center gap-2 bg-dark-bg border border-dark-color rounded-lg px-3 py-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-dark-primary">{modulo}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-secondary text-center py-8">No hay módulos asignados a este rol</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setDetallesDialog({ isOpen: false, rol: null })}
              className="bg-dark-cta text-white hover:bg-blue-600"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, rol: null })}
        onConfirm={handleEliminarRol}
        title="¿Eliminar Rol?"
        description={`¿Estás seguro de eliminar el rol "${deleteDialog.rol?.nombre}"? Esta acción afectará a todos los usuarios vinculados.`}
        loading={loading}
      />
    </>
  );
}
