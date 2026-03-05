import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { toast } from "sonner";
import { Dog, Plus, Search, Eye, Edit, Trash2, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { MascotaModal } from "../modals/MascotaModal";
import { useMascotas, Mascota } from "../hooks/useMascotas";
import { useClientes } from "../hooks/useClientes";

export function MascotasPage() {
  const { mascotas, loading, crearMascota, actualizarMascota, eliminarMascota } = useMascotas();
  const { clientes } = useClientes();
  const [busqueda, setBusqueda] = useState("");
  const [mascotaModal, setMascotaModal] = useState({ isOpen: false, mascota: null as Mascota | null, readOnly: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, mascota: null as Mascota | null });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const mascotasConId = mascotas.map((m, index) => ({ ...m, displayId: index + 1 }));

  const mascotasFiltradas = mascotasConId.filter(mascota => {
    return mascota.displayId.toString().includes(busqueda);
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(mascotasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const mascotasPaginadas = mascotasFiltradas.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  const handleGuardarMascota = async (mascotaData: Partial<Mascota>) => {
    if (mascotaData.id_mascota) {
      const resultado = await actualizarMascota(mascotaData.id_mascota, mascotaData);
      if (resultado.success) toast.success(`Mascota ${mascotaData.nombre} actualizada`);
      return resultado;
    } else {
      const resultado = await crearMascota(mascotaData);
      if (resultado.success) toast.success(`Mascota ${mascotaData.nombre} registrada`);
      return resultado;
    }
  };

  const handleEliminarMascota = async () => {
    if (!deleteDialog.mascota) return;

    const resultado = await eliminarMascota(deleteDialog.mascota.id_mascota);

    if (resultado.success) {
      toast.success("Mascota eliminada exitosamente");
    } else {
      toast.error(resultado.error || "Error al eliminar mascota");
    }

    setDeleteDialog({ isOpen: false, mascota: null });
  };

  const abrirMascotaModal = (mascota?: Mascota, readOnly: boolean = false) => {
    setMascotaModal({ isOpen: true, mascota: mascota || null, readOnly });
  };

  const cerrarMascotaModal = () => {
    setMascotaModal({ isOpen: false, mascota: null, readOnly: false });
  };

  const getEspecieIcon = (especie: string) => {
    const especieLower = (especie || '').toLowerCase();
    return <Dog className="w-5 h-5 text-indigo-400" />;
  };

  const getClienteNombre = (id_cliente: number) => {
    const cliente = clientes.find(c => c.id_cliente === id_cliente);
    return cliente ? cliente.nombre : 'Cliente Desconocido';
  };

  return (
    <>
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Gestión de Mascotas</h1>
            <p className="text-sm text-dark-secondary mt-1">Registro y control de pacientes</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar por ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
              />
            </div>

            <button
              onClick={() => abrirMascotaModal()}
              className="dark-button-primary gap-2 flex items-center"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Nueva Mascota
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
                  <TableHead className="text-dark-primary font-semibold w-16">
                    ID
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Dog className="w-4 h-4" />
                      Mascota
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                    Especie
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                    Raza
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Dueño / Cliente
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-40">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {mascotasPaginadas.map((mascota) => (
                  <TableRow key={mascota.id_mascota} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                    <TableCell className="text-dark-secondary font-medium">
                      {(mascota as any).displayId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-dark-hover rounded-full flex items-center justify-center shadow-lg border border-dark-color">
                          {getEspecieIcon(mascota.especie || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-dark-primary">{mascota.nombre}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium text-dark-primary">
                        {mascota.especie || 'N/A'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-dark-primary">
                        {mascota.raza || 'N/A'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-dark-secondary" />
                          <span className="text-sm text-dark-primary font-medium hover:text-indigo-400 cursor-pointer">
                            {getClienteNombre(mascota.id_cliente)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => abrirMascotaModal(mascota, true)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                          disabled={loading}
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => abrirMascotaModal(mascota)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                          disabled={loading}
                          title="Editar mascota"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteDialog({ isOpen: true, mascota })}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                          disabled={loading}
                          title="Eliminar"
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

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color">
            <div className="text-sm text-dark-secondary">
              Mostrando {startIndex + 1}-{Math.min(endIndex, mascotasFiltradas.length)} de {mascotasFiltradas.length} mascotas
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-dark-secondary">Página {currentPage} de {totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={() => goToPage(1)} disabled={currentPage === 1 || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                <Button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                <Button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                <Button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MascotaModal
        isOpen={mascotaModal.isOpen}
        onClose={cerrarMascotaModal}
        onSubmit={handleGuardarMascota}
        mascota={mascotaModal.mascota}
        loading={loading}
        readOnly={mascotaModal.readOnly}
      />

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={() => setDeleteDialog({ isOpen: false, mascota: null })}>
        <AlertDialogContent className="bg-dark-card border-dark-color">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-dark-primary">¿Eliminar Mascota?</AlertDialogTitle>
            <AlertDialogDescription className="text-dark-secondary">
              ¿Estás seguro de que deseas eliminar a "{deleteDialog.mascota?.nombre}"?
              Esta acción eliminará el historial médico asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-color text-dark-secondary hover:bg-dark-hover">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminarMascota}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={loading}
            >
              Eliminar Mascota
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
