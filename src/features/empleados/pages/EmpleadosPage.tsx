import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { User, Plus, Search, Edit, Trash2, Briefcase, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Phone, Mail, Shield, Hash, Fingerprint } from "lucide-react";
import { useEmpleados, Empleado } from "../hooks/useEmpleados";
import { EmpleadoModal } from "../components/EmpleadoModal";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";

export function EmpleadosPage() {
    const { empleados, loading, crearEmpleado, actualizarEmpleado, eliminarEmpleado, buscarEmpleados } = useEmpleados();
    const [busqueda, setBusqueda] = useState("");
    const [empleadoModal, setEmpleadoModal] = useState({ isOpen: false, empleado: null as Empleado | null, readOnly: false });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, empleado: null as Empleado | null });

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [elementosPorPagina] = useState(10);

    const empleadosFiltrados = buscarEmpleados(busqueda);

    // Calcular paginación
    const totalPaginas = Math.ceil(empleadosFiltrados.length / elementosPorPagina);
    const indiceInicio = (paginaActual - 1) * elementosPorPagina;
    const indiceFin = indiceInicio + elementosPorPagina;
    const empleadosPaginados = empleadosFiltrados.slice(indiceInicio, indiceFin);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const handleCrearEmpleado = async (empleadoData: Partial<Empleado>) => {
        const result = await crearEmpleado(empleadoData);
        if (result.success) {
            toast.success("Empleado registrado exitosamente");
            cerrarEmpleadoModal();
            return { success: true };
        } else {
            toast.error(result.error || "Error al registrar empleado");
            return { success: false };
        }
    };

    const handleActualizarEmpleado = async (empleadoData: Partial<Empleado>) => {
        if (!empleadoModal.empleado) return { success: false };

        const result = await actualizarEmpleado(empleadoModal.empleado.id_empleado, empleadoData);
        if (result.success) {
            toast.success("Información del empleado actualizada");
            cerrarEmpleadoModal();
            return { success: true };
        } else {
            toast.error(result.error || "Error al actualizar información");
            return { success: false };
        }
    };

    const handleEliminarEmpleado = async () => {
        if (!deleteDialog.empleado) return;

        const result = await eliminarEmpleado(deleteDialog.empleado.id_empleado);
        if (result.success) {
            toast.success("Empleado eliminado del sistema");
            setDeleteDialog({ isOpen: false, empleado: null });
        } else {
            toast.error(result.error || "Error al eliminar empleado");
        }
    };

    const abrirEmpleadoModal = (empleado?: Empleado, readOnly: boolean = false) => {
        setEmpleadoModal({ isOpen: true, empleado: empleado || null, readOnly });
    };

    const cerrarEmpleadoModal = () => {
        setEmpleadoModal({ isOpen: false, empleado: null, readOnly: false });
    };

    return (
        <>
            <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-dark-primary">Directorio de Empleados</h1>
                        <p className="text-dark-secondary text-sm">Administra la nómina de la clínica</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
                            <input
                                type="text"
                                placeholder="Buscar por cédula o nombre..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
                            />
                        </div>

                        <Button
                            onClick={() => abrirEmpleadoModal()}
                            disabled={loading}
                            className="bg-dark-cta text-white hover:bg-blue-600 gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Empleado
                        </Button>
                    </div>
                </div>
            </header>

            <main className="p-8">
                <div className="dark-card">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">

                                    <TableHead className="text-dark-primary font-semibold w-36">
                                        <div className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-blue-400" />Cédula</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold min-w-[250px]">
                                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />Nombre</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                                        <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400" />Email</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                                        <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-400" />Teléfono</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                                        <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" />Cargo</div>
                                    </TableHead>
                                    <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {empleadosPaginados.map((empleado, index) => (
                                    <TableRow key={`${empleado.id_empleado || index}`} className="border-dark-color hover:bg-dark-table-hover transition-colors">

                                        <TableCell className="text-dark-primary font-mono text-sm">
                                            {empleado.cedula || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium text-dark-primary">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow">
                                                    {empleado.nombre.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{empleado.nombre}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-dark-secondary">
                                            <span className="text-xs text-dark-primary">{empleado.correo || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell className="text-dark-secondary">
                                            <span className="text-xs">{empleado.telefono || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell className="text-dark-secondary">
                                            <span className="capitalize">{empleado.cargo || 'Sin Especificar'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    onClick={() => abrirEmpleadoModal(empleado, true)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                {/* No permitir editar ni borrar al Administrador Maestro desde la lista general */}
                                                {(empleado.correo === 'josephballestas10@gmail.com' || empleado.cedula === '1001780874') ? (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-dark-table-hover rounded border border-dark-color opacity-60">
                                                        <Shield className="w-3 h-3 text-blue-400" />
                                                        <span className="text-[10px] font-bold text-dark-secondary uppercase">Protegido</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Button
                                                            onClick={() => abrirEmpleadoModal(empleado)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                                                            title="Editar empleado"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => setDeleteDialog({ isOpen: true, empleado })}
                                                            variant="outline"
                                                            size="sm"
                                                            className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                                                            title="Eliminar empleado"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {empleadosPaginados.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-dark-secondary">
                                            <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            {busqueda ? 'No se encontraron empleados.' : 'No hay empleados registrados.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Paginación */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color">
                            <div className="text-sm text-dark-secondary">
                                Mostrando {indiceInicio + 1}-{Math.min(indiceFin, empleadosFiltrados.length)} de {empleadosFiltrados.length} empleados
                            </div>

                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1 || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1 || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas || loading || totalPaginas === 0} className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <EmpleadoModal
                isOpen={empleadoModal.isOpen}
                onClose={cerrarEmpleadoModal}
                onSubmit={empleadoModal.empleado ? handleActualizarEmpleado : handleCrearEmpleado}
                empleado={empleadoModal.empleado}
                loading={loading}
                readOnly={empleadoModal.readOnly}
            />

            <ConfirmDeleteDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, empleado: null })}
                onConfirm={handleEliminarEmpleado}
                title="¿Eliminar Empleado?"
                description={`¿Estás seguro de eliminar a ${deleteDialog.empleado?.nombre}? Esta acción es irreversible.`}
                loading={loading}
            />
        </>
    );
}
