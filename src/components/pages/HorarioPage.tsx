import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

import { toast } from "sonner";
import { Clock, Users, Plus, Search, Filter, User, Calendar, CheckCircle, Edit, Trash2, Eye, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useHorario, Horario } from "../hooks/useHorario";

interface HorarioPageProps {
  onNewHorario?: () => void;
  onEditHorario?: (horario: any) => void;
}

export function HorarioPage({ onNewHorario, onEditHorario }: HorarioPageProps) {
  const { horarios, loading, crearHorario, actualizarHorario, eliminarHorario } = useHorario();
  const [busqueda, setBusqueda] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, horario: null as any | null });
  const [verDetallesDialog, setVerDetallesDialog] = useState({ isOpen: false, horario: null as any | null });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina] = useState(5);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr;
  };

  // Agrupar horarios por empleado (usando cedula o id_empleado como clave)
  const empleadosConHorarios = horarios.reduce((acc, horario) => {
    const emp = horario.empleado;
    const key = emp?.cedula || horario.id_empleado.toString();

    if (!acc[key]) {
      acc[key] = {
        cc: emp?.cedula || 'N/A',
        nombre: emp?.nombre || 'Empleado',
        apellido: emp?.cargo || '', // Usamos cargo si no hay apellido, o vacío
        horarios: []
      };
    }
    acc[key].horarios.push(horario);
    return acc;
  }, {} as Record<string, { cc: string; nombre: string; apellido: string; horarios: Horario[] }>);

  const empleadosArray = Object.values(empleadosConHorarios);

  // Filtrar empleados: se omiten administradores si el requerimiento es no mostrar a Administrador, 
  // pero solo filtra la vista. O mejor, si el usuario pide sacarlo, podemos omitir "Administrador".
  const empleadosFiltrados = empleadosArray.filter(empleado => {
    // Excluir únicamente al Administrador Maestro (usando su cédula o nombre identificador)
    if (empleado.cc === '1001780874' || empleado.nombre.toLowerCase().includes('joseph ballestas')) return false;

    const searchLower = busqueda.toLowerCase();
    const nombreMatch = (empleado.nombre || '').toLowerCase().includes(searchLower);
    const apellidoMatch = (empleado.apellido || '').toLowerCase().includes(searchLower);
    const ccMatch = (empleado.cc || '').toLowerCase().includes(searchLower);

    return nombreMatch || apellidoMatch || ccMatch;
  });

  // Calcular paginación
  const totalPaginas = Math.ceil(empleadosFiltrados.length / elementosPorPagina);
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const indiceFin = indiceInicio + elementosPorPagina;
  const empleadosPaginados = empleadosFiltrados.slice(indiceInicio, indiceFin);

  // Resetear página cuando cambian los filtros
  const resetearPagina = () => {
    setPaginaActual(1);
  };

  const handleCambiarEstado = async (horario: any) => {
    const nuevoEstado = !horario.disponible;

    const resultado = await actualizarHorario(horario.id_horario, {
      disponible: nuevoEstado
    } as any);

    if (resultado.success) {
      toast.success(`Horario marcado como ${nuevoEstado ? 'disponible' : 'no disponible'}`);
    } else {
      toast.error(resultado.error || "Error al cambiar estado");
    }
  };

  const handleEliminarHorario = async () => {
    if (!deleteDialog.horario) return;

    const resultado = await eliminarHorario(deleteDialog.horario.id_horario);

    if (resultado.success) {
      toast.success("Horario eliminado exitosamente");
    } else {
      toast.error(resultado.error || "Error al eliminar horario");
    }

    setDeleteDialog({ isOpen: false, horario: null });
  };

  const abrirDetalles = (horario: any) => {
    setVerDetallesDialog({ isOpen: true, horario });
  };

  const cerrarDetalles = () => {
    setVerDetallesDialog({ isOpen: false, horario: null });
  };

  // Estadísticas calculadas
  const stats = {
    totalEmpleados: empleadosArray.length,
    totalHorarios: horarios.length,
    disponibles: horarios.filter((h: any) => h.disponible).length
  };

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Horarios de Personal</h1>
            <p className="text-sm text-dark-secondary mt-1">Control de turnos y disponibilidad del personal</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar personal..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  resetearPagina();
                }}
                className="pl-10 pr-4 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
              />
            </div>
            <button
              onClick={() => onNewHorario?.()}
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
        {/* Tabla de Horarios */}
        <div className="dark-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-dark-color hover:bg-dark-hover">
                  <TableHead className="text-dark-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold">
                    Rol
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold">
                    Tipo Documento
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold">
                    Documento
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Días Asignados
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empleadosPaginados.map((empleado: any) => {
                  const diasOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                  const diasTrabajo = empleado.horarios
                    .map((h: Horario) => h.dia_semana)
                    .sort((a: string, b: string) => diasOrdenados.indexOf(a) - diasOrdenados.indexOf(b));

                  const todosDisponibles = empleado.horarios.every((h: any) => h.disponible);

                  return (
                    <TableRow key={empleado.cc} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                            {empleado.nombre?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="font-semibold text-dark-primary">{empleado.nombre}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={`${empleado.apellido.toLowerCase() === 'veterinario'
                          ? 'bg-emerald-900/30 text-emerald-400'
                          : 'bg-blue-900/30 text-blue-400'
                          } border-0`}>
                          {empleado.apellido || 'N/A'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-dark-primary">Cédula</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-dark-primary font-mono">{empleado.cc}</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {diasTrabajo.slice(0, 3).map((dia: string, idx: number) => (
                            <Badge key={idx} className="bg-blue-900/20 text-blue-400 border-0 text-xs">
                              {dia.slice(0, 3)}
                            </Badge>
                          ))}
                          {diasTrabajo.length > 3 && (
                            <Badge className="bg-slate-700/20 text-slate-400 border-0 text-xs">
                              +{diasTrabajo.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-dark-secondary mt-1">
                          {empleado.horarios.length} {empleado.horarios.length === 1 ? 'día' : 'días'}
                        </div>
                      </TableCell>



                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            onClick={() => setVerDetallesDialog({ isOpen: true, horario: empleado.horarios[0] })}
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 border-dark-color text-blue-400 hover:bg-blue-900/20 hover:border-blue-400"
                            disabled={loading}
                            title="Ver todos los horarios"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => onEditHorario?.(empleado.horarios[0])}
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 border-dark-color text-yellow-400 hover:bg-yellow-900/20 hover:border-yellow-400"
                            disabled={loading}
                            title="Editar horario"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setDeleteDialog({ isOpen: true, horario: empleado.horarios[0] })}
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 border-dark-color text-red-400 hover:bg-red-900/20 hover:border-red-400"
                            disabled={loading}
                            title="Eliminar horario"
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

            {empleadosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-dark-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">
                  {busqueda ? 'No se encontró personal' : 'No hay personal con horarios'}
                </h3>
                <p className="text-dark-secondary mb-6">
                  {busqueda
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza registrando el primer horario para el personal'
                  }
                </p>
                {!busqueda && (
                  <Button
                    onClick={() => onNewHorario?.()}
                    className="bg-dark-cta text-white hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Horario
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-dark-color">
              <div className="text-sm text-dark-secondary">
                Mostrando {indiceInicio + 1}-{Math.min(indiceFin, empleadosFiltrados.length)} de {empleadosFiltrados.length} empleados
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
              Total: {stats.totalEmpleados} empleados • {stats.totalHorarios} días programados
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-secondary">Días disponibles: {stats.disponibles}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Ver Detalles (Solo lectura) */}
      <Dialog open={verDetallesDialog.isOpen} onOpenChange={cerrarDetalles}>
        <DialogContent className="bg-dark-card border-dark-color max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-dark-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Horarios de Personal
            </DialogTitle>
            <DialogDescription className="text-dark-secondary">
              Información completa de todos los horarios asignados
            </DialogDescription>
          </DialogHeader>

          {verDetallesDialog.horario && (() => {
            // Obtener todos los horarios del mismo empleado
            const empleadoCC = verDetallesDialog.horario.empleado?.cedula;
            const todosLosHorarios = horarios.filter((h: Horario) => h.empleado?.cedula === empleadoCC);
            const diasOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            const horariosOrdenados = todosLosHorarios.sort((a: Horario, b: Horario) =>
              diasOrdenados.indexOf(a.dia_semana || '') - diasOrdenados.indexOf(b.dia_semana || '')
            );

            return (
              <div className="space-y-6">
                {/* Información del Personal */}
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-lg">
                      {verDetallesDialog.horario.empleado?.nombre?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-dark-primary">
                        {verDetallesDialog.horario.empleado?.nombre}
                      </h3>
                      <p className="text-dark-secondary">CC: {verDetallesDialog.horario.empleado?.cedula || 'N/A'}</p>
                      <p className="text-sm text-blue-400 mt-1">
                        {todosLosHorarios.length} {todosLosHorarios.length === 1 ? 'día asignado' : 'días asignados'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Horarios por Día */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dark-primary border-b border-dark-color pb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Horarios Semanales
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {horariosOrdenados.map((horario: any, index: number) => (
                      <div
                        key={horario.id}
                        className="bg-dark-hover border border-dark-color rounded-lg p-4 hover:border-blue-500/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-900/20 text-blue-400 border-0">
                              {horario.dia_semana}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={horario.disponible}
                                onCheckedChange={() => handleCambiarEstado(horario)}
                                disabled={loading}
                              />
                              <span className={`text-[10px] font-bold uppercase tracking-wider w-24 ${horario.disponible ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                                {horario.disponible ? 'Disponible' : 'No disponible'}
                              </span>
                            </div>

                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-dark-secondary mb-1">Hora de Inicio</label>
                            <div className="bg-emerald-900/20 text-emerald-400 px-3 py-2 rounded-lg font-mono font-semibold">
                              {formatTime(horario.hora_inicio)}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-dark-secondary mb-1">Hora Final</label>
                            <div className="bg-orange-900/20 text-orange-400 px-3 py-2 rounded-lg font-mono font-semibold">
                              {formatTime(horario.hora_fin)}
                            </div>
                          </div>
                        </div>

                        {horario.observaciones && (
                          <div className="mt-3 pt-3 border-t border-dark-color">
                            <label className="block text-xs font-medium text-dark-secondary mb-1">Observaciones</label>
                            <p className="text-sm text-dark-primary">{horario.observaciones}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-dark-primary mb-3">Resumen</h4>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-dark-secondary">Total días:</span>
                      <p className="text-dark-primary font-semibold">{todosLosHorarios.length}</p>
                    </div>
                    <div>
                      <span className="text-dark-secondary">Días activos:</span>
                      <p className="text-green-400 font-semibold">{todosLosHorarios.filter((h: any) => h.disponible).length}</p>
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
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, horario: null })}>
        <AlertDialogContent className="bg-dark-card border-dark-color">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dark-primary">¿Eliminar Horario?</AlertDialogTitle>
            <AlertDialogDescription className="text-dark-secondary">
              ¿Estás seguro de que deseas eliminar el horario de "{deleteDialog.horario?.empleado?.nombre}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-color text-dark-secondary hover:bg-dark-hover">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminarHorario}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={loading}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
