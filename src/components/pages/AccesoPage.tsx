import { useState } from "react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { toast } from "sonner";
import { Lock, Plus, Search, Filter, Eye, Shield, Clock, User, AlertTriangle, Trash2, Activity, Database } from "lucide-react";
import { AccesoModal } from "../modals/AccesoModal";
import { useAcceso, Acceso } from "../hooks/useAcceso";

export function AccesoPage() {
  const {
    accesos,
    loading,
    registrarAcceso,
    eliminarAcceso,
    filtrarPorUsuario,
    filtrarPorModulo,
    filtrarPorExito,
    obtenerEstadisticas,
    limpiarRegistrosAntiguos
  } = useAcceso();

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'exitosos' | 'fallidos'>('todos');
  const [accesoModal, setAccesoModal] = useState({ isOpen: false, acceso: null as any });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, acceso: null as Acceso | null });
  const [cleanupDialog, setCleanupDialog] = useState(false);

  const accesosFiltrados = accesos.filter(acceso => {
    const matchBusqueda = acceso.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
      acceso.modulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      acceso.ip.includes(busqueda) ||
      acceso.dispositivo.toLowerCase().includes(busqueda.toLowerCase());

    const matchTipo = filtroTipo === 'todos' ||
      (filtroTipo === 'exitosos' && acceso.exitoso) ||
      (filtroTipo === 'fallidos' && !acceso.exitoso);

    return matchBusqueda && matchTipo;
  });

  const estadisticas = obtenerEstadisticas();

  const handleRegistrarAcceso = async (accesoData: any) => {
    const resultado = await registrarAcceso({
      usuario: accesoData.usuario,
      modulo: accesoData.recurso || accesoData.modulo, // Usar recurso del modal o modulo del log
      accion: accesoData.accion,
      ip: '127.0.0.1', // Valor por defecto
      dispositivo: 'Desktop',
      exitoso: true,
      detalles: accesoData.razonCreacion || accesoData.condiciones || 'Registro manual de permiso'
    });

    if (resultado.success) {
      toast.success("Acceso registrado exitosamente");
      cerrarAccesoModal();
    } else {
      toast.error(resultado.error || "Error al registrar acceso");
    }

    return resultado;
  };

  const handleEliminarAcceso = async () => {
    if (!deleteDialog.acceso) return;

    const resultado = await eliminarAcceso(deleteDialog.acceso.id);

    if (resultado.success) {
      toast.success("Registro de acceso eliminado exitosamente");
    } else {
      toast.error(resultado.error || "Error al eliminar registro");
    }

    setDeleteDialog({ isOpen: false, acceso: null });
  };

  const handleLimpiarRegistrosAntiguos = async () => {
    const resultado = await limpiarRegistrosAntiguos(30);

    if (resultado.success) {
      toast.success("Registros antiguos eliminados exitosamente");
    } else {
      toast.error(resultado.error || "Error al limpiar registros");
    }

    setCleanupDialog(false);
  };

  const abrirAccesoModal = (acceso?: Acceso) => {
    setAccesoModal({ isOpen: true, acceso: acceso || null });
  };

  const cerrarAccesoModal = () => {
    setAccesoModal({ isOpen: false, acceso: null });
  };

  const getEstadoColor = (exitoso: boolean) => {
    return exitoso ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400";
  };

  return (
    <>
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Control de Acceso</h1>
            <p className="text-sm text-dark-secondary mt-1">Monitorea actividad del sistema y registros de seguridad</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar accesos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="px-3 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary focus:border-dark-cta focus:outline-none"
            >
              <option value="todos">Todos</option>
              <option value="exitosos">Exitosos</option>
              <option value="fallidos">Fallidos</option>
            </select>
            <button
              onClick={() => setCleanupDialog(true)}
              className="dark-button-secondary gap-2 flex items-center"
              disabled={loading}
            >
              <Database className="w-4 h-4" />
              Limpiar
            </button>
            <button
              onClick={() => abrirAccesoModal()}
              className="dark-button-primary gap-2 flex items-center"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Registrar Acceso
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Total Registros</p>
                <p className="text-2xl font-bold text-dark-primary">{estadisticas.total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Accesos Exitosos</p>
                <p className="text-2xl font-bold text-green-400">{estadisticas.exitosos}</p>
              </div>
              <Shield className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Accesos Fallidos</p>
                <p className="text-2xl font-bold text-red-400">{estadisticas.fallidos}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-purple-400">{estadisticas.tasaExito}%</p>
              </div>
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="dark-card">
          <div className="flex items-center justify-between pb-6">
            <h3 className="text-xl font-bold text-dark-primary">
              Registro de Accesos ({accesosFiltrados.length})
            </h3>
            <div className="text-sm text-dark-secondary">
              {estadisticas.usuariosUnicos} usuarios únicos • {estadisticas.modulosAccedidos} módulos
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-dark-color hover:bg-dark-hover">
                  <TableHead className="text-dark-primary font-semibold">Usuario</TableHead>
                  <TableHead className="text-dark-primary font-semibold">Módulo</TableHead>
                  <TableHead className="text-dark-primary font-semibold">Acción</TableHead>
                  <TableHead className="text-dark-primary font-semibold">Fecha y Hora</TableHead>
                  <TableHead className="text-dark-primary font-semibold">IP/Dispositivo</TableHead>
                  <TableHead className="text-dark-primary font-semibold">Estado</TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accesosFiltrados.map((acceso) => (
                  <TableRow key={acceso.id} className="border-dark-color hover:bg-dark-table-hover">
                    <TableCell className="font-medium text-dark-primary">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-dark-secondary" />
                        {acceso.usuario}
                      </div>
                    </TableCell>
                    <TableCell className="text-dark-secondary">{acceso.modulo}</TableCell>
                    <TableCell className="text-dark-secondary">{acceso.accion}</TableCell>
                    <TableCell className="text-dark-secondary">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {acceso.fechaHora}
                      </div>
                    </TableCell>
                    <TableCell className="text-dark-secondary">
                      <div>
                        <div className="font-medium">{acceso.ip}</div>
                        <div className="text-sm">{acceso.dispositivo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(acceso.exitoso)}`}>
                        {acceso.exitoso ? 'Exitoso' : 'Fallido'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          onClick={() => abrirAccesoModal(acceso)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"
                          disabled={loading}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => setDeleteDialog({ isOpen: true, acceso })}
                          variant="outline"
                          size="sm"
                          className="p-2 h-8 w-8 border-red-600 text-red-400 hover:bg-red-600/10"
                          disabled={loading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Modales */}
      <AccesoModal
        isOpen={accesoModal.isOpen}
        onClose={cerrarAccesoModal}
        onSubmit={handleRegistrarAcceso}
        acceso={accesoModal.acceso}
        loading={loading}
      />

      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, acceso: null })}>
        <AlertDialogContent className="bg-dark-card border-dark-color">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dark-primary">¿Eliminar Registro?</AlertDialogTitle>
            <AlertDialogDescription className="text-dark-secondary">
              ¿Estás seguro de que deseas eliminar este registro de acceso?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-color text-dark-secondary hover:bg-dark-hover">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminarAcceso}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={loading}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Limpieza de Registros */}
      <AlertDialog open={cleanupDialog} onOpenChange={setCleanupDialog}>
        <AlertDialogContent className="bg-dark-card border-dark-color">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dark-primary">¿Limpiar Registros Antiguos?</AlertDialogTitle>
            <AlertDialogDescription className="text-dark-secondary">
              Esta acción eliminará todos los registros de acceso con más de 30 días de antigüedad.
              ¿Estás seguro de continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-color text-dark-secondary hover:bg-dark-hover">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLimpiarRegistrosAntiguos}
              className="bg-orange-600 text-white hover:bg-orange-700"
              disabled={loading}
            >
              Limpiar Registros
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
