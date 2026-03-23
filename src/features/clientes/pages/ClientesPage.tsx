import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { Users, Plus, Search, Mail, Phone, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Dog } from "lucide-react";
import { ClienteModal } from "../components/ClienteModal";
import { MascotaModal } from "../../mascotas/components/MascotaModal";
import { useClientes, Cliente } from "../hooks/useClientes";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";

export function ClientesPage() {
  const { clientes, loading, crearCliente, actualizarCliente, eliminarCliente } = useClientes();
  const { crearMascota } = useMascotas();
  const [busqueda, setBusqueda] = useState("");
  const [clienteModal, setClienteModal] = useState({ isOpen: false, cliente: null as Cliente | null, readOnly: false });
  const [petModal, setPetModal] = useState({ isOpen: false, initialClientId: 0 });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, cliente: null as Cliente | null });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const clientesFiltrados = clientes.filter(cliente => {
    const matchBusqueda = (cliente.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cliente.correo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cliente.cedula || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (cliente.telefono || '').includes(busqueda);
    return matchBusqueda;
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  const handleCrearCliente = async (clienteData: any) => {
    const resultado = await crearCliente({
      nombre: clienteData.nombre,
      tipo_documento: clienteData.tipo_documento,
      cedula: clienteData.cedula,
      correo: clienteData.correo,
      telefono: clienteData.telefono,
      direccion: clienteData.direccion,
    });
    if (resultado.success) {
      toast.success("Cliente creado exitosamente");
      cerrarClienteModal();
    } else {
      toast.error(resultado.error || "Error al crear cliente");
    }
    return resultado;
  };

  const handleActualizarCliente = async (clienteData: any) => {
    if (!clienteModal.cliente) return { success: false };
    const resultado = await actualizarCliente(clienteModal.cliente.id_cliente, {
      nombre: clienteData.nombre,
      tipo_documento: clienteData.tipo_documento,
      cedula: clienteData.cedula,
      correo: clienteData.correo,
      telefono: clienteData.telefono,
      direccion: clienteData.direccion,
    });
    if (resultado.success) {
      toast.success("Cliente actualizado exitosamente");
      cerrarClienteModal();
    } else {
      toast.error(resultado.error || "Error al actualizar cliente");
    }
    return resultado;
  };

  const handleEliminarCliente = async () => {
    if (!deleteDialog.cliente) return;
    const resultado = await eliminarCliente(deleteDialog.cliente.id_cliente);
    if (resultado.success) {
      toast.success("Cliente eliminado exitosamente");
    } else {
      toast.error(resultado.error || "Error al eliminar cliente");
    }
    setDeleteDialog({ isOpen: false, cliente: null });
  };

  const abrirClienteModal = (cliente?: Cliente, readOnly: boolean = false) => {
    setClienteModal({ isOpen: true, cliente: cliente || null, readOnly });
  };

  const cerrarClienteModal = () => {
    setClienteModal({ isOpen: false, cliente: null, readOnly: false });
  };

  const handleVerDetalle = (cliente: Cliente) => {
    abrirClienteModal(cliente, true);
  };

  const getInitials = (nombre: string) => {
    return nombre?.substring(0, 2).toUpperCase() || 'CL';
  };

  const getAvatarColor = (nombre: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600'
    ];
    const index = (nombre?.length || 0) % colors.length;
    return colors[index];
  };

  return (
    <>
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Gestión de Clientes</h1>
            <p className="text-sm text-dark-secondary mt-1">Directorio de Clientes</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar por cédula o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
              />
            </div>

            <button
              onClick={() => abrirClienteModal()}
              className="dark-button-primary gap-2 flex items-center"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Nuevo Cliente
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
                  <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Cliente
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documento
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Correo
                    </div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-40">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {clientesPaginados.map((cliente) => (
                  <TableRow key={cliente.id_cliente} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${getAvatarColor(cliente.nombre || '')} rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg`}>
                          {getInitials(cliente.nombre || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-dark-primary">{cliente.nombre}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-dark-primary">{cliente.cedula || '---'}</span>
                        <span className="text-[10px] text-dark-secondary italic">{cliente.tipo_documento}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-dark-primary">{cliente.telefono || 'Sin teléfono'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-dark-primary">{cliente.correo || 'Sin email'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => handleVerDetalle(cliente)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                          disabled={loading}
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => abrirClienteModal(cliente)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-amber-500/20 border-amber-500 text-amber-400 hover:bg-amber-500/30"
                          disabled={loading}
                          title="Editar cliente"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteDialog({ isOpen: true, cliente })}
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
              Mostrando {startIndex + 1}-{Math.min(endIndex, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-dark-secondary">Página {currentPage} de {totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={() => goToPage(1)} disabled={currentPage === 1 || loading} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                <Button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                <Button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                <Button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ClienteModal
        isOpen={clienteModal.isOpen}
        onClose={cerrarClienteModal}
        onSubmit={clienteModal.cliente ? handleActualizarCliente : handleCrearCliente}
        cliente={clienteModal.cliente}
        loading={loading}
        readOnly={clienteModal.readOnly}
      />

      <MascotaModal
        isOpen={petModal.isOpen}
        onClose={() => setPetModal({ isOpen: false, initialClientId: 0 })}
        initialClientId={petModal.initialClientId}
        onSubmit={async (data) => {
          const res = await crearMascota(data);
          if (res.success) toast.success("Mascota registrada exitosamente");
          return res;
        }}
        loading={loading}
      />

      <ConfirmDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, cliente: null })}
        onConfirm={handleEliminarCliente}
        title="¿Eliminar Cliente?"
        description={`¿Estás seguro de eliminar a ${deleteDialog.cliente?.nombre}? Se borrará toda su información y mascotas asociadas.`}
        loading={loading}
      />
    </>
  );
}
