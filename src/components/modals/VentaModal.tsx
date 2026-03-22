import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ShoppingCart, Calendar, User, DollarSign, Stethoscope, Trash2 } from 'lucide-react';
import { Venta, VentaServicio } from '../hooks/useVentas';
import { useClientes } from '../hooks/useClientes';
import { useServicios } from '../hooks/useServicios';
import { Agendamiento } from '../hooks/useAgendamiento';

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

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    id_cliente: '',
    total: 0,
    venta_servicios: [] as { id_servicio: number; cantidad: number; precio_unitario: number }[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (venta) {
      const serviciosCargados = (venta.venta_servicios || []).map(vs => {
        const servDoc = servicios.find(s => s.id_servicio === vs.id_servicio);
        return {
          id_servicio: vs.id_servicio,
          cantidad: vs.cantidad || 1,
          precio_unitario: servDoc?.precio || 0
        };
      });

      setFormData({
        fecha: venta.fecha ? new Date(venta.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        id_cliente: venta.id_cliente ? venta.id_cliente.toString() : '',
        total: venta.total || 0,
        venta_servicios: serviciosCargados
      });
    } else {
      setFormData(prev => ({
        ...prev,
        fecha: new Date().toISOString().split('T')[0],
        id_cliente: prev.id_cliente || '', // Preservar selección si ya existe
        venta_servicios: prev.venta_servicios.length > 0 ? prev.venta_servicios : []
      }));
    }
    setErrors({});
  }, [venta, isOpen]); // Quitado 'servicios' para evitar resets innecesarios

  // Resetear formulario al abrir para nueva venta o pre-cargar de cita
  useEffect(() => {
    if (isOpen && !venta) {
      if (citaPrevia) {
        // Mapear los servicios de la cita al formato de la venta
        const serviciosCargar = (citaPrevia.agendamiento_servicios || []).map(as => {
          const sInfo = servicios.find(s => s.id_servicio === as.id_servicio);
          return {
            id_servicio: as.id_servicio,
            cantidad: 1,
            precio_unitario: sInfo?.precio || 0
          };
        });

        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          id_cliente: citaPrevia.id_cliente?.toString() || '',
          total: serviciosCargar.reduce((acc, s) => acc + s.precio_unitario, 0),
          venta_servicios: serviciosCargar
        });
      } else {
        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          id_cliente: '',
          total: 0,
          venta_servicios: []
        });
      }
    }
  }, [isOpen, venta, citaPrevia, servicios]);
  useEffect(() => {
    const nuevoTotal = formData.venta_servicios.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
    setFormData(prev => ({ ...prev, total: nuevoTotal }));
  }, [formData.venta_servicios]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fecha) newErrors.fecha = 'La fecha es requerida';
    if (!formData.id_cliente) newErrors.id_cliente = 'Debes seleccionar un cliente';
    if (formData.venta_servicios.length === 0) newErrors.servicios = 'Debe agregar al menos un servicio a la venta';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const apiData: any = {
      fecha: formData.fecha,
      id_cliente: parseInt(formData.id_cliente),
      total: formData.total,
      servicios: formData.venta_servicios.map(vs => ({
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
                    {clientes.map(c => (
                      <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.id_cliente && <p className="text-red-400 text-xs">{errors.id_cliente}</p>}
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
                      {servicios.map(s => (
                        <SelectItem key={s.id_servicio} value={s.id_servicio.toString()} disabled={formData.venta_servicios.some(vs => vs.id_servicio === s.id_servicio)}>
                          {s.nombre_servicio} - ${s.precio.toLocaleString()}
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
                  {formData.venta_servicios.map(item => {
                    const s_info = servicios.find(s => s.id_servicio === item.id_servicio);
                    return (
                      <div key={item.id_servicio} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-dark-hover/50 border border-dark-color gap-3">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-dark-primary">{s_info?.nombre_servicio || 'Servicio Desconocido'}</span>
                          <div className="text-xs text-dark-secondary">${item.precio_unitario.toLocaleString()} c/u</div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-dark-bg rounded-lg border border-dark-color p-1">
                            <Button
                              type="button" variant="ghost" size="sm"
                              onClick={() => actualizarCantidad(item.id_servicio, item.cantidad - 1)}
                              className="h-6 w-6 p-0 text-dark-secondary hover:text-white"
                              disabled={readOnly}
                            >-</Button>
                            <span className="text-sm text-dark-primary w-6 text-center font-medium">{item.cantidad}</span>
                            <Button
                              type="button" variant="ghost" size="sm"
                              onClick={() => actualizarCantidad(item.id_servicio, item.cantidad + 1)}
                              className="h-6 w-6 p-0 text-dark-secondary hover:text-white"
                              disabled={readOnly}
                            >+</Button>
                          </div>

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
              )}
            </div>
          </div>

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
