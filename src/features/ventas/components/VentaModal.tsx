import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/select';
import { ShoppingCart, Calendar, User, DollarSign, Stethoscope, Trash2, AlertTriangle } from 'lucide-react';
import { Venta, VentaServicio } from '../hooks/useVentas';
import { useClientes } from '../../clientes/hooks/useClientes';
import { useServicios } from '../../servicios/hooks/useServicios';
import { useMascotas } from '../../mascotas/hooks/useMascotas';
import { Agendamiento } from '../../agendamiento/hooks/useAgendamiento';

interface VentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (venta: Partial<Venta>) => Promise<any>;
  venta?: Venta | null;
  citaPrevia?: Agendamiento | null;
  loading?: boolean;
  readOnly?: boolean;
}

export function VentaModal({ isOpen, onClose, onSubmit, venta, citaPrevia, loading, readOnly = false }: VentaModalProps) {
  const { clientes } = useClientes();
  const { servicios } = useServicios();
  const { mascotas } = useMascotas();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    id_cliente: '',
    id_mascota: '',
    total: 0,
    venta_servicios: [] as { id_servicio: number; cantidad: number; precio_unitario: number }[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para controlar si ya inicializamos el modal al abrirlo
  const [initialized, setInitialized] = useState(false);

  // Reiniciar estado de inicialización cuando el modal cierra
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        id_cliente: '',
        id_mascota: '',
        total: 0,
        venta_servicios: []
      });
    }
  }, [isOpen]);

  // Inicializar o cargar datos una sola vez al abrir o cambiar de fuente
  useEffect(() => {
    if (!isOpen || initialized) return;

    // Si venimos de Agendamiento, esperar a que Clientes y Servicios estén cargados
    const listready = clientes.length > 0 && servicios.length > 0;

    if (venta) {
      // Cargando venta existente para vista de detalles/reporte
      const serviciosCargados = (venta.venta_servicios || []).map(vs => {
        // Backend puede devolver precio en PascalCase (Precio) o camelCase (precio)
        const precioServicio =
          vs.servicio?.Precio ??
          vs.servicio?.precio ??
          servicios.find(s => s.id_servicio === vs.id_servicio)?.precio ??
          (servicios.find(s => s.id_servicio === vs.id_servicio) as any)?.Precio ??
          0;
        return {
          id_servicio: vs.id_servicio,
          cantidad: vs.cantidad || 1,
          precio_unitario: precioServicio
        };
      });

      setFormData({
        fecha: venta.fecha ? new Date(venta.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        id_cliente: venta.id_cliente ? venta.id_cliente.toString() : '',
        id_mascota: venta.id_mascota ? venta.id_mascota.toString() : (
          mascotas.find(m => Number(m.id_cliente) === Number(venta.id_cliente))?.id_mascota?.toString() || ''
        ),
        total: venta.total || 0,
        venta_servicios: serviciosCargados
      });
      setInitialized(true);
    } else if (citaPrevia) {
      // Si las listas no están listas, esperamos (no marcamos como initialized)
      if (!listready) return;

      const serviciosCargaBase = citaPrevia.agendamiento_servicios || (citaPrevia as any).agendamientoServicios || (citaPrevia as any).idServicios || [];

      const serviciosCargar = serviciosCargaBase.map((as: any) => {
        const idServ = as.id_servicio || as.idServicio || as.IdServicio;
        const sInfo = servicios.find(s => s.id_servicio === idServ);
        return {
          id_servicio: idServ,
          cantidad: 1,
          precio_unitario: sInfo?.precio || 0
        };
      });

      const clientID = citaPrevia.id_cliente?.toString() || '';
      console.log('[VentaModal] Cargando cliente de cita:', clientID);

      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        id_cliente: clientID,
        id_mascota: citaPrevia.id_mascota?.toString() || '',
        total: serviciosCargar.reduce((acc: number, s: any) => acc + s.precio_unitario, 0),
        venta_servicios: serviciosCargar
      });
      setInitialized(true);
    } else {
      // Nueva venta manual
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        id_cliente: '',
        id_mascota: '',
        total: 0,
        venta_servicios: []
      });
      setInitialized(true);
    }
    setErrors({});
  }, [isOpen, venta, citaPrevia, servicios, clientes, initialized]);

  // Si a pesar de todo los servicios llegaron después de inicializar
  useEffect(() => {
    if (isOpen && initialized && servicios.length > 0) {
      const necesitaPrecios = formData.venta_servicios.some(s => s.precio_unitario === 0);
      if (necesitaPrecios) {
        setFormData(prev => ({
          ...prev,
          venta_servicios: prev.venta_servicios.map(ps => {
            if (ps.precio_unitario > 0) return ps;
            const sInfo = servicios.find(s => s.id_servicio === ps.id_servicio);
            const precio = sInfo?.precio ?? (sInfo as any)?.Precio ?? 0;
            return { ...ps, precio_unitario: precio };
          })
        }));
      }
    }
  }, [servicios, isOpen, initialized]);




  useEffect(() => {
    const nuevoTotal = formData.venta_servicios.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
    setFormData(prev => ({ ...prev, total: nuevoTotal }));
  }, [formData.venta_servicios]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_cliente) {
      newErrors.id_cliente = 'Debes seleccionar un cliente para el cobro.';
    }

    if (formData.venta_servicios.length === 0) {
      newErrors.servicios = 'El carrito está vacío. Añade al menos un servicio.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedClient = clientes.find(c => c.id_cliente === parseInt(formData.id_cliente));

    const apiData: any = {
      fecha: formData.fecha,
      id_cliente: parseInt(formData.id_cliente),
      id_mascota: formData.id_mascota ? parseInt(formData.id_mascota) : null,
      total: formData.total,
      cliente: selectedClient ? { id_cliente: selectedClient.id_cliente, nombre: selectedClient.nombre, cedula: selectedClient.cedula } : undefined,
      venta_servicios: formData.venta_servicios.map(vs => ({
        id_servicio: vs.id_servicio,
        cantidad: vs.cantidad
      }))
    };

    if (venta) {
      apiData.id_venta = venta.id_venta;
    }

    const result = await onSubmit(apiData);
    if (result.success) onClose();
  };

  const handleChange = (field: string, value: any) => {
    // Al cambiar de cliente, limpiar la mascota seleccionada
    if (field === 'id_cliente') {
      setFormData(prev => ({ ...prev, id_cliente: value, id_mascota: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const agregarServicio = (id_servicio_str: string) => {
    const id_servicio = parseInt(id_servicio_str);
    const servicioInfo = servicios.find(s => s.id_servicio === id_servicio);

    if (servicioInfo && !formData.venta_servicios.find(s => s.id_servicio === id_servicio)) {
      setFormData(prev => ({
        ...prev,
        venta_servicios: [
          ...prev.venta_servicios,
          { id_servicio, cantidad: 1, precio_unitario: servicioInfo.precio }
        ]
      }));
      if (errors.servicios) setErrors(prev => ({ ...prev, servicios: '' }));
    }
  };

  const quitarServicio = (id_servicio: number) => {
    setFormData(prev => ({
      ...prev,
      venta_servicios: prev.venta_servicios.filter(s => s.id_servicio !== id_servicio)
    }));
  };

  const actualizarCantidad = (id_servicio: number, cantidad: number) => {
    if (cantidad < 1) return;
    setFormData(prev => ({
      ...prev,
      venta_servicios: prev.venta_servicios.map(s =>
        s.id_servicio === id_servicio ? { ...s, cantidad } : s
      )
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-dark-card border-dark-color border-opacity-50 max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="border-b border-dark-color p-6 pb-4">
          <DialogTitle className="text-xl font-bold text-dark-primary flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
            </div>
            {readOnly ? 'Detalles de Venta' : 'Nueva Venta'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            {readOnly ? 'Detalles de la transacción registrada.' : 'Registra una nueva venta. Recuerda que las ventas no pueden ser editadas una vez confirmadas, solo anuladas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="space-y-2">
                <Label className="text-dark-primary flex items-center gap-1.5"><User className="w-4 h-4 text-blue-400" />Cliente *</Label>
                <Select value={formData.id_cliente} onValueChange={(val: string) => handleChange('id_cliente', val)} disabled={readOnly || !!citaPrevia}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary h-10">
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    {clientes.map((c, idx) => (
                      <SelectItem key={`${c.id_cliente || idx}`} value={String(c.id_cliente || '')}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.id_cliente && <p className="text-red-400 text-xs">{errors.id_cliente}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-dark-primary flex items-center gap-1.5">
                  <span className="text-base">🐾</span> Mascota del Cliente
                </Label>
                {readOnly ? (() => {
                  const mascotaId = formData.id_mascota;
                  const clienteId = formData.id_cliente ? parseInt(formData.id_cliente) : null;

                  // Nivel 1: buscar por id_mascota exacto en la lista local
                  const mascotaLocal = mascotaId && mascotaId !== 'none'
                    ? mascotas.find(m => m.id_mascota?.toString() === mascotaId)
                    : null;

                  // Nivel 2: objeto mascota anidado que devuelve el backend
                  const mascotaVenta = (venta as any)?.mascota;

                  // Nivel 3: si no hay id_mascota pero el cliente tiene exactamente 1 mascota, inferirla
                  const mascotasPorCliente = clienteId
                    ? mascotas.filter(m => Number(m.id_cliente) === clienteId)
                    : [];
                  const mascotaInferida = !mascotaLocal && !mascotaVenta?.nombre && mascotasPorCliente.length === 1
                    ? mascotasPorCliente[0]
                    : null;

                  const mascota = mascotaLocal || (mascotaVenta?.nombre ? mascotaVenta : null) || mascotaInferida;

                  const emoji = mascota?.especie?.toLowerCase().includes('canino') || mascota?.especie?.toLowerCase().includes('perro') ? '🐕'
                    : mascota?.especie?.toLowerCase().includes('felino') || mascota?.especie?.toLowerCase().includes('gato') ? '🐈' : '🐾';
                  return (
                    <div className="bg-dark-hover border border-dark-color text-dark-primary h-10 px-3 flex items-center rounded-md gap-2">
                      {mascota ? (
                        <>
                          <span>{emoji}</span>
                          <span className="font-semibold">{mascota.nombre}</span>
                        </>
                      ) : (
                        <span className="text-dark-secondary text-xs italic">Sin mascota registrada</span>
                      )}
                    </div>
                  );
                })() : citaPrevia && formData.id_mascota ? (() => {
                  // Cuando viene de cita previa: mostrar la mascota como texto (ya está fijada)
                  const mascota = mascotas.find(m => m.id_mascota?.toString() === formData.id_mascota);
                  const emoji = mascota?.especie?.toLowerCase().includes('canino') || mascota?.especie?.toLowerCase().includes('perro') ? '🐕'
                    : mascota?.especie?.toLowerCase().includes('felino') || mascota?.especie?.toLowerCase().includes('gato') ? '🐈' : '🐾';
                  return (
                    <div className="bg-dark-hover border border-dark-color text-dark-primary h-10 px-3 flex items-center rounded-md gap-2">
                      {mascota ? (
                        <>
                          <span>{emoji}</span>
                          <span className="font-semibold">{mascota.nombre}</span>
                          <span className="text-dark-secondary text-xs italic ml-1">({mascota.especie})</span>
                        </>
                      ) : (
                        <span className="text-dark-secondary text-xs italic">Cargando mascota...</span>
                      )}
                    </div>
                  );
                })() : (
                  <Select
                    value={formData.id_mascota || ''}
                    onValueChange={(val: string) => handleChange('id_mascota', val)}
                    disabled={!formData.id_cliente}
                  >
                    <SelectTrigger className={`bg-dark-hover border-dark-color text-dark-primary h-10 ${!formData.id_cliente ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder={formData.id_cliente ? 'Seleccionar mascota...' : 'Primero selecciona un cliente'} />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-color">
                      <SelectItem value="none">Sin mascota / No aplica</SelectItem>
                      {mascotas
                        .filter(m => m.id_cliente === parseInt(formData.id_cliente))
                        .map((m, idx) => (
                          <SelectItem key={`${m.id_mascota || idx}`} value={String(m.id_mascota || '')}>
                            <div className="flex items-center gap-2">
                              <span>{m.especie?.toLowerCase().includes('perro') || m.especie?.toLowerCase().includes('canino') ? '🐕' : m.especie?.toLowerCase().includes('gato') || m.especie?.toLowerCase().includes('felino') ? '🐈' : '🐾'}</span>
                              <span className="font-semibold">{m.nombre}</span>
                              {(m.especie || m.raza) && (
                                <span className="text-dark-secondary text-xs italic">{[m.especie, m.raza].filter(Boolean).join(' · ')}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      {formData.id_cliente && mascotas.filter(m => m.id_cliente === parseInt(formData.id_cliente)).length === 0 && (
                        <div className="px-3 py-2 text-xs text-dark-secondary italic">Este cliente no tiene mascotas registradas</div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label className="text-dark-primary flex items-center gap-1.5"><Calendar className="w-4 h-4 text-pink-400" />Fecha *</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleChange('fecha', e.target.value)}
                  className="bg-dark-hover border-dark-color h-10"
                  readOnly={readOnly}
                />
                {errors.fecha && <p className="text-red-400 text-xs">{errors.fecha}</p>}
              </div>
            </div>

            {/* Selector de Servicios */}
            <div className="space-y-4 pt-4 border-t border-dark-color">
              <Label className="text-dark-primary flex items-center gap-1.5 text-base">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                {readOnly ? 'Servicios Facturados' : 'Servicios a Facturar'}
              </Label>

              {!readOnly && (
                <>
                  <Select onValueChange={agregarServicio}>
                    <SelectTrigger className="bg-dark-hover border-emerald-500/30 text-dark-primary h-12">
                      <SelectValue placeholder="Agregar un servicio a la venta..." />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-color">
                      {servicios
                        .filter(s => s.estado === 'activo')
                        .map((s, idx) => (
                          <SelectItem key={`${s.id_servicio || idx}`} value={String(s.id_servicio || '')} disabled={formData.venta_servicios.some(vs => vs.id_servicio === s.id_servicio)}>
                            {s.nombre_servicio} - ${s.precio ? s.precio.toLocaleString() : '0'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.servicios && <p className="text-red-400 text-sm font-semibold">{errors.servicios}</p>}
                </>
              )}

              {/* Lista de Servicios en la Venta */}
              {formData.venta_servicios.length > 0 && (
                <div className="space-y-3 mt-4">
                  {formData.venta_servicios.map((item, idx) => {
                    const s_info = servicios.find(s => s.id_servicio === item.id_servicio);
                    return (
                      <div key={`${item.id_servicio}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-dark-hover/50 border border-dark-color gap-3">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-dark-primary">{s_info?.nombre_servicio || 'Servicio Desconocido'}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-dark-secondary">${item.precio_unitario.toLocaleString()} c/u</span>
                            {s_info?.duracion && (
                              <span className="text-[10px] bg-dark-bg px-1.5 py-0.5 rounded border border-dark-color text-dark-secondary">
                                {s_info.duracion} min
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {readOnly ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-dark-card border border-dark-color rounded-lg">
                              <span className="text-xs text-dark-secondary">Cant:</span>
                              <span className="text-sm font-bold text-dark-primary">{item.cantidad}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-dark-bg rounded-lg border border-dark-color p-1">
                              <Button
                                type="button" variant="ghost" size="sm"
                                onClick={() => actualizarCantidad(item.id_servicio, item.cantidad - 1)}
                                className="h-6 w-6 p-0 text-dark-secondary hover:text-white"
                              >-</Button>
                              <span className="text-sm text-dark-primary w-6 text-center font-medium">{item.cantidad}</span>
                              <Button
                                type="button" variant="ghost" size="sm"
                                onClick={() => actualizarCantidad(item.id_servicio, item.cantidad + 1)}
                                className="h-6 w-6 p-0 text-dark-secondary hover:text-white"
                              >+</Button>
                            </div>
                          )}

                          <div className="w-24 text-right">
                            <span className="text-emerald-400 font-bold">${(item.cantidad * item.precio_unitario).toLocaleString()}</span>
                          </div>

                          {!readOnly && (
                            <Button
                              type="button" variant="ghost" size="sm"
                              onClick={() => quitarServicio(item.id_servicio)}
                              className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
              }
            </div>
          </div>

          {/* Motivo de Anulación - visible solo en detalle de venta anulada */}
          {readOnly && venta?.estado === 'anulada' && (() => {
            const motivo = venta.motivo_anulacion || localStorage.getItem(`motivo_anulacion_${venta.id_venta}`);
            if (!motivo) return null;
            return (
              <div className="mx-6 mb-2 flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/25">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Motivo de Anulación</p>
                  <p className="text-sm text-dark-primary">{motivo}</p>
                </div>
              </div>
            );
          })()}

          {/* Totales - Fijo al fondo */}
          <div className="bg-dark-bg border-t border-dark-color p-6 py-4 flex justify-between items-center">
            <span className="text-dark-secondary font-medium uppercase tracking-wider text-xs">Total de Venta</span>
            <span className="text-2xl font-black text-emerald-400 flex items-center">
              <DollarSign className="w-5 h-5 mr-1 opacity-70" />
              {formData.total.toLocaleString()}
            </span>
          </div>

          <DialogFooter className="gap-3 border-t border-dark-color p-6 pt-4 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="dark-button-secondary"
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={loading}
                className="dark-button-primary min-w-[160px]"
              >
                {loading ? 'Procesando...' : (venta ? 'Guardar Cambios' : 'Confirmar Venta')}
              </button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
