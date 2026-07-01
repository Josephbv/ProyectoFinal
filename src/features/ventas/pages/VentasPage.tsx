import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, ShoppingCart, Calendar, Trash2, User, DollarSign, Stethoscope, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Tag, Fingerprint, AlertTriangle, X, FileText } from "lucide-react";
import { useVentas, Venta, VentaServicio } from "../hooks/useVentas";
import { VentaModal } from "../components/VentaModal";
import { ConfirmDeleteDialog } from "../../../shared/components/ConfirmDeleteDialog";
import { useAgendamiento, Agendamiento } from "../../agendamiento/hooks/useAgendamiento";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { useServicios } from "../../servicios/hooks/useServicios";
import { Dog, Briefcase } from "lucide-react";
import { cleanCedula } from "../../../shared/components/utils";

interface VentasPageProps {
  onNewSale?: () => void;
  citaAPagar?: Agendamiento | null;
  onVentaCerrada?: () => void;
}

export function VentasPage({ onNewSale, citaAPagar, onVentaCerrada }: VentasPageProps) {
  const { ventas, loading, crearVenta, anularVenta, eliminarVenta } = useVentas();
  const { actualizarCita, citas } = useAgendamiento();
  const { mascotas } = useMascotas();
  const { servicios } = useServicios();
  const { user } = useEmailAuth();

  const [busqueda, setBusqueda] = useState("");
  const [ventaModal, setVentaModal] = useState({ isOpen: false, venta: null as Venta | null, readOnly: false });
  const [anularDialog, setAnularDialog] = useState({ isOpen: false, venta: null as Venta | null, motivo: '' });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, venta: null as Venta | null });

  const roleName = typeof user?.rol === 'string' ? user.rol : (user?.rol as any)?.nombre_rol || '';
  const isClienteRole = roleName.toLowerCase().includes('cliente');
  const isVetRole = roleName.toLowerCase().includes('veterinario');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const ventasFiltradas = ventas.filter(venta => {
    // Si es cliente, solo ve sus ventas
    if (isClienteRole) {
      if (venta.id_cliente !== user?.id_cliente) return false;
    }

    const searchLow = busqueda.toLowerCase().trim();
    if (!searchLow) return true;

    return (
      venta.id_venta?.toString().includes(searchLow) ||
      (venta.cliente?.nombre || '').toLowerCase().includes(searchLow) ||
      (venta.cliente?.cedula || '').toLowerCase().includes(searchLow)
    );
  }).sort((a, b) => new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime());

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
        // Marcar en localStorage de inmediato para feedback visual instantáneo
        localStorage.setItem(`pagado_${citaAPagar.id_agendamiento}`, 'true');
        // Actualizar el estado en el backend
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
    if (!anularDialog.motivo.trim()) {
      toast.warning('Debes ingresar el motivo de anulación');
      return;
    }

    const result = await anularVenta(anularDialog.venta.id_venta, anularDialog.motivo.trim());
    if (result.success) {
      toast.success("Venta anulada exitosamente");
      setAnularDialog({ isOpen: false, venta: null, motivo: '' });
    } else {
      toast.error(result.error || "Error al anular venta");
    }
  };

  const handleEliminarVenta = async () => {
    if (!deleteDialog.venta) return;

    const result = await eliminarVenta(deleteDialog.venta.id_venta);
    if (result.success) {
      toast.success("Venta eliminada exitosamente");
      setDeleteDialog({ isOpen: false, venta: null });
    } else {
      toast.error(result.error || "Error al eliminar venta");
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

  const exportarVentasPDF = () => {
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.");
        return;
      }

      const fechaGeneracion = new Date().toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calcular totales
      const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0);
      const totalAprobadas = ventasFiltradas.filter(v => v.estado !== 'anulada').length;
      const totalAnuladas = ventasFiltradas.filter(v => v.estado === 'anulada').length;

      const filasHtml = ventasFiltradas.map(venta => {
        const idMascota = venta.id_mascota || (venta as any).IdMascota ||
          citas.find(c => c.id_agendamiento === (venta as any).id_agendamiento)?.id_mascota;
        const mascota = idMascota ? mascotas.find(m => m.id_mascota === idMascota) : null;
        
        const serviciosNombres = (venta.venta_servicios || [])
          .map(vs => {
            const sInfo = servicios.find(s => s.id_servicio === vs.id_servicio);
            return vs.servicio?.nombre_servicio || sInfo?.nombre_servicio || 'Servicio';
          })
          .join(", ");

        const formattedTotal = (venta.total || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

        return `
          <tr>
            <td>${venta.id_venta}</td>
            <td>${venta.fecha ? venta.fecha.split('T')[0] : ''}</td>
            <td style="font-weight: 600;">${venta.cliente?.nombre || 'Cliente desconocido'}</td>
            <td>${cleanCedula(venta.cliente?.cedula) || '—'}</td>
            <td>${mascota ? mascota.nombre : 'Sin mascota'}</td>
            <td style="font-size: 11px; max-width: 200px; word-wrap: break-word;">${serviciosNombres || '—'}</td>
            <td style="font-weight: bold; text-align: right;">${formattedTotal}</td>
            <td style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: ${venta.estado === 'anulada' ? '#ef4444' : '#10b981'};">${venta.estado || 'aprobada'}</td>
          </tr>
        `;
      }).join('');

      const formattedTotalIngresos = totalIngresos.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Ventas - KaiVet</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
              body {
                font-family: 'Outfit', sans-serif;
                color: #1e293b;
                padding: 40px;
                margin: 0;
                background-color: #ffffff;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .logo-container {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .logo-icon {
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 18px;
              }
              .logo-text {
                font-size: 22px;
                font-weight: 700;
                color: #0f172a;
              }
              .logo-sub {
                color: #3b82f6;
              }
              .report-info {
                text-align: right;
              }
              .title {
                font-size: 24px;
                font-weight: 700;
                color: #0f172a;
                margin: 0;
                margin-top: 10px;
              }
              .date {
                font-size: 12px;
                color: #64748b;
                margin-top: 5px;
              }
              .kpi-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
              }
              .kpi-card {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 15px 20px;
              }
              .kpi-title {
                font-size: 11px;
                text-transform: uppercase;
                color: #64748b;
                font-weight: 600;
                margin-bottom: 5px;
                letter-spacing: 0.5px;
              }
              .kpi-value {
                font-size: 20px;
                font-weight: 700;
                color: #0f172a;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th {
                background-color: #f1f5f9;
                color: #475569;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                text-align: left;
                padding: 12px;
                border-bottom: 2px solid #e2e8f0;
              }
              td {
                padding: 12px;
                font-size: 13px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
              }
              tr:nth-child(even) td {
                background-color: #f8fafc;
              }
              .footer {
                text-align: center;
                font-size: 11px;
                color: #94a3b8;
                margin-top: 60px;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
              }
              @page {
                size: letter;
                margin: 20mm;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <div class="logo-icon">🐾</div>
                <div class="logo-text">KaiVet<span class="logo-sub"> Manager</span></div>
              </div>
              <div class="report-info">
                <div class="title">Reporte de Ventas</div>
                <div class="date">Generado el ${fechaGeneracion}</div>
              </div>
            </div>
            
            <div class="kpi-grid">
              <div class="kpi-card" style="border-left: 4px solid #3b82f6;">
                <div class="kpi-title">Ingresos Totales</div>
                <div class="kpi-value">${formattedTotalIngresos}</div>
              </div>
              <div class="kpi-card" style="border-left: 4px solid #10b981;">
                <div class="kpi-title">Ventas Aprobadas</div>
                <div class="kpi-value">${totalAprobadas}</div>
              </div>
              <div class="kpi-card" style="border-left: 4px solid #ef4444;">
                <div class="kpi-title">Ventas Anuladas</div>
                <div class="kpi-value">${totalAnuladas}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">ID</th>
                  <th style="width: 12%;">Fecha</th>
                  <th style="width: 18%;">Cliente</th>
                  <th style="width: 12%;">Doc. Cliente</th>
                  <th style="width: 12%;">Mascota</th>
                  <th style="width: 20%;">Servicios</th>
                  <th style="width: 10%; text-align: right;">Total</th>
                  <th style="width: 8%;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${filasHtml}
              </tbody>
            </table>

            <div class="footer">
              Este es un reporte oficial emitido por la plataforma KaiVet Manager. &copy; ${new Date().getFullYear()} KaiVet. Todos los derechos reservados.
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("Reporte de ventas listo para imprimir / guardar como PDF");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar reporte");
    }
  };

  return (
    <>
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-emerald-400" />
              Ventas
            </h1>
            <p className="text-sm text-dark-secondary mt-1">Administra los ingresos de los servicios veterinarios</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!isClienteRole && (
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
            )}

            {!isClienteRole && !isVetRole && (
              <button
                onClick={exportarVentasPDF}
                className="dark-button-secondary font-bold gap-2 flex items-center"
                disabled={loading || ventasFiltradas.length === 0}
              >
                <FileText className="w-4 h-4" />
                Exportar Reporte
              </button>
            )}

            {!isClienteRole && !isVetRole && (
              <button
                onClick={() => abrirVentaModal()}
                className="dark-button-primary font-bold gap-2 flex items-center"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {/* Dashboard removido por solicitud del usuario */}

        <div className="dark-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-500/10 border-dark-color hover:bg-blue-500/15 transition-colors">

                  <TableHead className="text-dark-primary font-semibold min-w-[100px]">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" />Fecha</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[150px]">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />Cliente</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[120px]">
                    <div className="flex items-center gap-2"><Dog className="w-4 h-4 text-emerald-400" />Mascota</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold min-w-[180px]">
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400" />Procedimientos</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-2"><DollarSign className="w-4 h-4 text-blue-400" />Total Cobrado</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-24">
                    <div className="flex items-center justify-center gap-2"><Tag className="w-3.5 h-3.5 text-blue-400" />Estado</div>
                  </TableHead>
                  <TableHead className="text-dark-primary font-semibold text-center w-28">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasPaginadas.map((venta) => (
                  <TableRow key={venta.id_venta} className="border-dark-color hover:bg-dark-table-hover transition-colors">

                    <TableCell className="text-dark-primary">
                      {venta.fecha ? venta.fecha.split('T')[0] : ''}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(venta.cliente?.nombre || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-dark-primary text-sm">{venta.cliente?.nombre || 'Cliente desconocido'}</div>
                          <div className="text-[10px] text-dark-primary font-mono">{cleanCedula(venta.cliente?.cedula) || '—'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const idMascota = venta.id_mascota || (venta as any).IdMascota ||
                          citas.find(c => c.id_agendamiento === (venta as any).id_agendamiento)?.id_mascota;
                        let mascota = idMascota ? mascotas.find(m => m.id_mascota === idMascota) : null;
                        
                        // Fallback: Si la venta no tiene mascota asignada directamente, busca la del cliente
                        if (!mascota && venta.id_cliente) {
                          mascota = mascotas.find(m => Number(m.id_cliente) === Number(venta.id_cliente));
                        }

                        return mascota ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="text-sm font-bold text-emerald-400 block">{mascota.nombre}</span>
                              <span className="text-[10px] text-dark-secondary">{mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-dark-secondary italic opacity-60">Sin mascota</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 max-w-[280px]">
                        {venta.venta_servicios && venta.venta_servicios.length > 0 ? (
                          venta.venta_servicios.map((vs, idx) => {
                            const sInfo = servicios.find(s => s.id_servicio === vs.id_servicio);
                            const nombre = vs.servicio?.nombre_servicio || sInfo?.nombre_servicio || 'Servicio';
                            return (
                              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-dark-hover/50 border border-dark-color/50 hover:border-blue-500/20 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-dark-primary truncate leading-tight">{nombre}</p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-dark-secondary italic opacity-60">Consumo general</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-dark-primary text-base">${(venta.total || 0).toLocaleString()}</span>
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
                    : 'Comienza registrando tu primera venta'
                  }
                </p>
              </div>
            )}
          </div>

                    {/* Paginación */}
          {ventasFiltradas.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 px-4 pb-4 border-t border-dark-color/40">
              <div className="text-sm text-dark-secondary">
                Mostrando {startIndex + 1}-{Math.min(endIndex, ventasFiltradas.length)} de {ventasFiltradas.length} ventas
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                <Button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsLeft className="w-3 h-3" /></Button>
                <Button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronLeft className="w-3 h-3" /></Button>
                <Button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronRight className="w-3 h-3" /></Button>
                <Button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading || totalPages === 0} variant="outline" size="sm" className="p-2 h-8 w-8 border-dark-color text-dark-secondary hover:bg-dark-hover"><ChevronsRight className="w-3 h-3" /></Button>
              </div>
              )}
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

      {/* Diálogo de Anulación con Motivo */}
      {anularDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setAnularDialog({ isOpen: false, venta: null, motivo: '' })} />
          <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 relative">
                <button
                  onClick={() => setAnularDialog({ isOpen: false, venta: null, motivo: '' })}
                  className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                    <div className="relative w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Anular Venta</h3>
                    <p className="text-orange-100 text-xs font-medium">
                      Venta #{anularDialog.venta?.id_venta?.toString().padStart(5, '0')} · Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    La venta quedará marcada como <strong>ANULADA</strong> y no podrá ser modificada. El motivo quedará registrado en el sistema.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Motivo de anulación <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs font-semibold ${anularDialog.motivo.trim().length >= 10 ? 'text-green-500' : 'text-gray-400'}`}>
                      {anularDialog.motivo.trim().length}/10 mín.
                    </span>
                  </div>
                  <textarea
                    value={anularDialog.motivo}
                    onChange={e => setAnularDialog(prev => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Ej: Error en el precio, cliente solicitó cancelación..."
                    rows={3}
                    autoFocus
                    className="w-full bg-gray-50 border-2 border-gray-200 focus:border-orange-400 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setAnularDialog({ isOpen: false, venta: null, motivo: '' })}
                    disabled={loading}
                    className="flex-1 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAnularVenta}
                    disabled={loading || anularDialog.motivo.trim().length < 10}
                    className="flex-1 h-11 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Anulando...</>
                      : <><AlertTriangle className="w-4 h-4" />Anular Venta</>
                    }
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
