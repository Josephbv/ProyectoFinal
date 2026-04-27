import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { Dog, Plus, Search, Eye, Edit, Trash2, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Hash, Info, Fingerprint } from "lucide-react";
import { useMascotas, Mascota } from "../hooks/useMascotas";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";

interface MascotasPageProps {
  onNewMascota: () => void;
  onEditMascota: (mascota: Mascota) => void;
  onViewMascota: (mascota: Mascota) => void;
}

export function MascotasPage({ onNewMascota, onEditMascota, onViewMascota }: MascotasPageProps) {
  const { mascotas, loading, eliminarMascota } = useMascotas();
  const { clientes } = useClientes();
  const { user } = useEmailAuth();
  const [busqueda, setBusqueda] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, mascota: null as Mascota | null });

  const roleName = typeof user?.rol === 'string' ? user.rol : (user?.rol as any)?.nombre_rol || '';
  const isClienteRole = roleName.toLowerCase().includes('cliente');
  const isVetRole = roleName.toLowerCase().includes('veterinario');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getClienteNombre = (id_cliente: number) => {
    const cliente = clientes.find(c => c.id_cliente === id_cliente);
    return cliente ? cliente.nombre : 'Cliente Desconocido';
  };

  const getClienteCedula = (id_cliente: number) => {
    const cliente = clientes.find(c => c.id_cliente === id_cliente);
    return cliente ? cliente.cedula : '---';
  };

  const mascotasFiltradas = mascotas.filter(mascota => {
    // Si es cliente, solo ve sus mascotas
    if (isClienteRole) {
      if (mascota.id_cliente !== user?.id_cliente) return false;
    }

    const searchLow = busqueda.toLowerCase().trim();
    if (!searchLow) return true;

    const mascotaNombre = (mascota.nombre || '').toLowerCase();
    const cliente = clientes.find(c => c.id_cliente === mascota.id_cliente);
    const clienteNombre = (cliente?.nombre || '').toLowerCase();
    const clienteCedula = (cliente?.cedula || '').toLowerCase();

    return (
      mascotaNombre.includes(searchLow) ||
      clienteNombre.includes(searchLow) ||
      clienteCedula.includes(searchLow)
    );
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

  const getEspecieIcon = (especie: string) => {
    const especieLower = (especie || '').toLowerCase();
    return <Dog className="w-5 h-5 text-indigo-400" />;
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
            {!isClienteRole && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
                <input
                  type="text"
                  placeholder="Buscar por ID de mascota..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10 pr-4 py-2 w-72 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
                />
              </div>
            )}

            {!isClienteRole && !isVetRole && (
              <button
                onClick={onNewMascota}
                className="dark-button-primary gap-2 flex items-center"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Nueva Mascota
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="dark-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">

                  <TableHead className="text-dark-primary font-semibold min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Dog className="w-4 h-4 text-blue-400" />
                      Mascota
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-blue-400" />Especie / Raza</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      Dueño / Cliente
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-blue-400" />
                      Doc. Dueño
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-28">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {mascotasPaginadas.length > 0 ? (
                  mascotasPaginadas.map((mascota, index) => (
                    <TableRow key={`${mascota.id_mascota}-${index}`} className="border-dark-color hover:bg-dark-table-hover transition-colors">

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
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-dark-primary">{mascota.especie || 'N/A'}</span>
                          <span className="text-[10px] text-dark-secondary italic">{mascota.raza || 'Sin raza'}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-dark-primary font-medium">
                            {getClienteNombre(mascota.id_cliente)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-dark-secondary">
                          {getClienteCedula(mascota.id_cliente)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            onClick={() => onViewMascota(mascota)}
                            variant="outline"
                            size="sm"
                            className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                            disabled={loading}
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!isVetRole && (
                            <Button
                              onClick={() => onEditMascota(mascota)}
                              variant="outline"
                              size="sm"
                              className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                              disabled={loading}
                              title="Editar mascota"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {!isClienteRole && !isVetRole && (
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
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-dark-secondary italic">
                      No se encontraron mascotas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color">
            <div className="text-sm text-dark-secondary">
              Mostrando {startIndex + 1}-{Math.min(endIndex, mascotasFiltradas.length)} de {mascotasFiltradas.length} mascotas
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-dark-secondary">Página {currentPage} de {totalPages || 1}</span>
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

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, mascota: null })}
        onConfirm={handleEliminarMascota}
        title="¿Eliminar Mascota?"
        description={`¿Estás seguro de eliminar a ${deleteDialog.mascota?.nombre}? Se perderá su historial médico permanentemente.`}
        loading={loading}
      />
    </>
  );
}
