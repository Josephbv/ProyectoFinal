import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, ShoppingCart, Calendar, Edit, Trash2, User, DollarSign, Stethoscope, Eye } from "lucide-react";
import { useVentas, Venta, VentaServicio } from "../hooks/useVentas";
import { VentaModal } from "../components/VentaModal";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";
import { useAgendamiento, Agendamiento } from "../../agendamiento/hooks/useAgendamiento";

interface VentasPageProps {
  onNewSale?: () => void;
  citaAPagar?: Agendamiento | null;
  onVentaCerrada?: () => void;
}

export function VentasPage({ onNewSale, citaAPagar, onVentaCerrada }: VentasPageProps) {
  const { ventas, loading, crearVenta, anularVenta } = useVentas();
  const { actualizarCita } = useAgendamiento();

  const [busqueda, setBusqueda] = useState("");
  const [ventaModal, setVentaModal] = useState({ isOpen: false, venta: null as Venta | null, readOnly: false });
  const [anularDialog, setAnularDialog] = useState({ isOpen: false, venta: null as Venta | null });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const ventasFiltradas = ventas.filter(venta => {
    const searchStr = busqueda.trim();
    if (!searchStr) return true;
    const paddedSearch = searchStr.padStart(5, '0');
    return venta.id_venta.toString().includes(searchStr) ||
      venta.id_venta.toString().padStart(5, '0').includes(paddedSearch);
  });

  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const ventasPaginadas = ventasFiltradas.slice(startIndex, endIndex);

  useEffect(() => {
    if (citaAPagar) {
      abrirVentaModal();
    }
  }, [citaAPagar]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  const handleCrearEditarVenta = async (ventaData: any) => {
    const result = await crearVenta(ventaData);

    if (result.success) {
      // Si la venta viene de una cita agendada, marcar la cita como completada
      if (citaAPagar) {
        // Enviamos el objeto completo con el nuevo estado para asegurar que el backend lo procese bien
        await actualizarCita(citaAPagar.id_agendamiento, { ...citaAPagar, estado: 'completada' });
      }

      toast.success("Venta registrada exitosamente");
      cerrarVentaModal();
      return { success: true };
    } else {
      toast.error(result.error || "Error al procesar venta");
      return { success: false };
    }
  };

  const handleAnularVenta = async () => {
    if (!anularDialog.venta) return;

    const result = await anularVenta(anularDialog.venta.id_venta);
    if (result.success) {
      toast.success("Venta anulada exitosamente");
      setAnularDialog({ isOpen: false, venta: null });
    } else {
      toast.error(result.error || "Error al anular venta");
    }
  };

  const abrirVentaModal = (venta?: Venta, readOnly: boolean = false) => {
    setVentaModal({ isOpen: true, venta: venta || null, readOnly });
  };

  const cerrarVentaModal = () => {
    setVentaModal({ isOpen: false, venta: null, readOnly: false });
    if (onVentaCerrada) onVentaCerrada();
  };

  const calcularTotalVentas = () => {
    return ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0);
  };

  const contarServicios = (venta_servicios?: VentaServicio[]) => {
    return venta_servicios?.length || 0;
  };

  return (
    <>
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-emerald-400" />
              Ventas y Facturación
            </h1>
            <p className="text-sm text-dark-secondary mt-1">Administra los ingresos de los servicios veterinarios</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar por ID o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => abrirVentaModal()}
              className="dark-button-primary gap-2 flex items-center"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              Nueva Venta
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {/* Dashboard removido por solicitud del usuario */}

        <div className="dark-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-dark-color hover:bg-dark-hover">
                  <TableHead className="text-dark-primary font-semibold w-24">ID Venta</TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Fecha</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[200px]">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" />Cliente</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center">
                    <div className="flex items-center justify-center gap-2"><Stethoscope className="w-4 h-4" />Servicios Totales</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2"><DollarSign className="w-4 h-4" />Total</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Estado</TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasPaginadas.map((venta) => (
                  <TableRow key={venta.id_venta} className="border-dark-color hover:bg-dark-table-hover transition-colors">
                    <TableCell className="font-mono text-xs text-dark-secondary">
                      #{venta.id_venta.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell className="text-dark-primary">
                      {venta.fecha ? venta.fecha.split('T')[0] : ''}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-dark-primary">{venta.cliente?.nombre || 'Desconocido'}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center bg-dark-hover text-dark-primary rounded-full w-8 h-8 text-xs font-bold">
                        {contarServicios(venta.venta_servicios)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-emerald-400">${(venta.total || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${venta.estado === 'anulada' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                        {venta.estado || 'aprobada'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => abrirVentaModal(venta, true)}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30"
                          disabled={loading}
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          onClick={() => setAnularDialog({ isOpen: true, venta })}
                          variant="outline"
                          size="sm"
                          className="p-2 h-9 w-9 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
                          disabled={loading || venta.estado === 'anulada'}
                          title="Anular Factura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {ventasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-dark-secondary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">
                  {busqueda ? 'No se encontraron ventas' : 'No hay ventas registradas'}
                </h3>
                <p className="text-dark-secondary mb-6">
                  {busqueda
                    ? 'Intenta con otras fechas o nombres'
                    : 'Comienza registrando tu primera venta/factura'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Paginación */}
          {ventasFiltradas.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-color">
              <div className="text-sm text-dark-secondary">
                Mostrando {startIndex + 1}-{Math.min(endIndex, ventasFiltradas.length)} de {ventasFiltradas.length} ventas
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

      <VentaModal
        isOpen={ventaModal.isOpen}
        onClose={cerrarVentaModal}
        onSubmit={handleCrearEditarVenta}
        venta={ventaModal.venta}
        citaPrevia={citaAPagar}
        loading={loading}
        readOnly={ventaModal.readOnly}
      />

      <ConfirmDeleteDialog
        isOpen={anularDialog.isOpen}
        onClose={() => setAnularDialog({ isOpen: false, venta: null })}
        onConfirm={handleAnularVenta}
        title="¿Anular Factura?"
        description={`¿Estas seguro de anular la factura #${anularDialog.venta?.id_venta.toString().padStart(5, '0')}? Esta acción no se puede deshacer.`}
        loading={loading}
        confirmText="SÍ, ANULAR AHORA"
        loadingText="ANULANDO..."
      />
    </>
  );
}
