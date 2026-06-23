import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../shared/components/alert-dialog";
import { toast } from "sonner";
import { Dog, Plus, Search, Eye, Edit, Trash2, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Hash, Info, Fingerprint, FileText } from "lucide-react";
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
  }).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }));

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

  const exportarMascotasPDF = () => {
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

      const filasHtml = mascotasFiltradas.map(m => `
        <tr>
          <td>${m.id_mascota}</td>
          <td style="font-weight: 600;">${m.nombre || ''}</td>
          <td>${m.especie || '—'}</td>
          <td>${m.raza || '—'}</td>
          <td>${m.sexo || '—'}</td>
          <td>${m.edad || 0} meses</td>
          <td>${getClienteNombre(m.id_cliente)}</td>
          <td>${getClienteCedula(m.id_cliente)}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Pacientes - KaiVet</title>
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
              .summary {
                margin-bottom: 25px;
                font-size: 14px;
                color: #475569;
                background-color: #f8fafc;
                padding: 12px 20px;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
                display: inline-block;
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
                <div class="title">Reporte de Pacientes</div>
                <div class="date">Generado el ${fechaGeneracion}</div>
              </div>
            </div>
            
            <div class="summary">
              <strong>Total de registros:</strong> ${mascotasFiltradas.length} pacientes / mascotas registradas bajo los criterios de búsqueda actuales.
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">ID</th>
                  <th style="width: 18%;">Nombre</th>
                  <th style="width: 12%;">Especie</th>
                  <th style="width: 12%;">Raza</th>
                  <th style="width: 10%;">Sexo</th>
                  <th style="width: 12%;">Edad</th>
                  <th style="width: 16%;">Propietario</th>
                  <th style="width: 10%;">Doc. Propietario</th>
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
      toast.success("Listado de mascotas listo para imprimir / guardar como PDF");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar reporte");
    }
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
                placeholder="Buscar mascota..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-dark-hover border border-dark-color rounded-lg text-dark-primary placeholder-dark-secondary focus:border-dark-cta focus:outline-none"
              />
            </div>

            {!isVetRole && (
              <button
                onClick={exportarMascotasPDF}
                className="dark-button-secondary font-bold gap-2 flex items-center"
                disabled={loading || mascotasFiltradas.length === 0}
              >
                <FileText className="w-4 h-4" />
                Exportar Reporte
              </button>
            )}

            {!isVetRole && (
              <button
                onClick={onNewMascota}
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
                  <TableHead className="text-dark-primary font-semibold min-w-[80px]">
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-blue-400" />Sexo</div>
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
                        {mascota.sexo && mascota.sexo !== '---' ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${mascota.sexo === 'Macho'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            : 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                            }`}>
                            {mascota.sexo === 'Macho' ? '♂' : '♀'}
                            {mascota.sexo}
                          </span>
                        ) : (
                          <button
                            onClick={() => onEditMascota(mascota)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer`}
                            title="Haz clic para asignar sexo"
                          >
                            ⚠ Sin asignar
                          </button>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-dark-primary font-medium">
                            {getClienteNombre(mascota.id_cliente)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-dark-primary font-mono">
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
                            <>
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
                            </>
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
