import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/select';
import { Calendar, Clock, User, Stethoscope, ListPlus, Trash2 } from 'lucide-react';
import { Agendamiento, AgendamientoServicio } from '../hooks/useAgendamiento';
import { useEmpleados } from '../../empleados/hooks/useEmpleados';
import { useClientes } from '../../clientes/hooks/useClientes';
import { useServicios } from '../../servicios/hooks/useServicios';
import { useHorario } from '../../empleados/hooks/useHorario';
import { toast } from 'sonner';

interface CitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cita: Partial<Agendamiento>) => Promise<any>;
  cita?: Agendamiento | null;
  loading?: boolean;
  readOnly?: boolean;
}

export function CitaModal({ isOpen, onClose, onSubmit, cita, loading, readOnly = false }: CitaModalProps) {
  const { empleados } = useEmpleados();
  const { clientes } = useClientes();
  const { servicios } = useServicios();
  const { horarios } = useHorario();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    id_cliente: '',
    id_empleado: '',
    serviciosSeleccionados: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatTimeForInput = (timeStr: string | null) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) {
        // Si no es una fecha válida, intentar ver si es un string de tipo HH:mm
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
          return timeStr.substring(0, 5);
        }
        return '';
      }
      return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (cita) {
      setFormData({
        fecha: formatDateForInput(cita.fecha),
        hora: formatTimeForInput(cita.hora),
        id_cliente: cita.id_cliente.toString(),
        id_empleado: cita.id_empleado.toString(),
        serviciosSeleccionados: cita.agendamiento_servicios ? cita.agendamiento_servicios.map(s => s.id_servicio) : []
      });
    } else {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        hora: '09:00',
        id_cliente: '',
        id_empleado: '',
        serviciosSeleccionados: []
      });
    }
    setErrors({});
  }, [cita, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_cliente) newErrors.id_cliente = 'Selecciona un cliente';
    if (!formData.id_empleado) newErrors.id_empleado = 'Selecciona un empleado';
    if (!formData.fecha) newErrors.fecha = 'La fecha es requerida';
    if (!formData.hora) newErrors.hora = 'La hora es requerida';
    if (formData.serviciosSeleccionados.length === 0) newErrors.servicios = 'Debes seleccionar al menos un servicio';

    // Validación de día laboral
    if (formData.id_empleado && formData.fecha) {
      const fechaCita = new Date(formData.fecha + 'T00:00:00');
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const nombreDiaCita = diasSemana[fechaCita.getDay()];

      const horariosEmpleado = horarios.filter(h => h.id_empleado === parseInt(formData.id_empleado));

      if (horariosEmpleado.length > 0) {
        const trabajaEseDia = horariosEmpleado.some(h => h.dia_semana === nombreDiaCita && h.disponible !== false);

        if (!trabajaEseDia) {
          newErrors.fecha = `El veterinario no labora los días ${nombreDiaCita}`;
          toast.error(`${nombreDiaCita} es día de descanso para este empleado`);
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Convertir a formato de Agendamiento
    const agendamientoData: Partial<Agendamiento> = {
      fecha: formData.fecha,
      hora: formData.hora,
      id_cliente: parseInt(formData.id_cliente),
      id_empleado: parseInt(formData.id_empleado),
      agendamiento_servicios: formData.serviciosSeleccionados.map(id_servicio => ({
        id_servicio
      })) as AgendamientoServicio[]
    };

    if (cita) {
      agendamientoData.id_agendamiento = cita.id_agendamiento;
    }

    const result = await onSubmit(agendamientoData);
    if (result.success) onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const agregarServicio = (id_servicio: string) => {
    const id = parseInt(id_servicio);
    if (id && !formData.serviciosSeleccionados.includes(id)) {
      setFormData(prev => ({
        ...prev,
        serviciosSeleccionados: [...prev.serviciosSeleccionados, id]
      }));
      if (errors.servicios) setErrors(prev => ({ ...prev, servicios: '' }));
    }
  };

  const quitarServicio = (id_servicio: number) => {
    setFormData(prev => ({
      ...prev,
      serviciosSeleccionados: prev.serviciosSeleccionados.filter(id => id !== id_servicio)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-dark-card border-dark-color border-opacity-50">
        <DialogHeader className="border-b border-dark-color pb-4">
          <DialogTitle className="text-xl font-bold text-dark-primary flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            {readOnly ? 'Detalles de la Cita' : cita ? 'Agendamiento: Editar Cita' : 'Agendamiento: Nueva Cita'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            {readOnly ? 'Información detallada de la cita programada.' : 'Programa y gestiona las citas asignándolas a un empleado específico.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label className="text-dark-primary flex items-center gap-1.5"><User className="w-4 h-4 text-indigo-400" />Cliente *</Label>
              <Select value={formData.id_cliente} onValueChange={(val: string) => handleChange('id_cliente', val)} disabled={readOnly}>
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

            {/* Empleado */}
            <div className="space-y-2">
              <Label className="text-dark-primary flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-blue-400" />Empleado Asignado *</Label>
              <Select value={formData.id_empleado} onValueChange={(val: string) => handleChange('id_empleado', val)} disabled={readOnly}>
                <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary h-10">
                  <SelectValue placeholder="Asignar empleado..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-color">
                  {empleados.map(e => (
                    <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>
                      {e.nombre} ({e.cargo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_empleado && <p className="text-red-400 text-xs">{errors.id_empleado}</p>}
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label className="text-dark-primary flex items-center gap-1.5"><Calendar className="w-4 h-4 text-pink-400" />Fecha *</Label>
              <Input type="date" value={formData.fecha} onChange={(e) => handleChange('fecha', e.target.value)} className="bg-dark-hover border-dark-color h-10" readOnly={readOnly} />
              {errors.fecha && <p className="text-red-400 text-xs">{errors.fecha}</p>}
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label className="text-dark-primary flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400" />Hora *</Label>
              <Input type="time" value={formData.hora} onChange={(e) => handleChange('hora', e.target.value)} className="bg-dark-hover border-dark-color h-10" readOnly={readOnly} />
              {errors.hora && <p className="text-red-400 text-xs">{errors.hora}</p>}
            </div>
          </div>

          {/* Servicios */}
          <div className="space-y-4 pt-4 border-t border-dark-color">
            <Label className="text-dark-primary flex items-center gap-1.5"><ListPlus className="w-4 h-4 text-emerald-400" />
              {readOnly ? 'Servicios Programados' : 'Servicios a Realizar *'}
            </Label>

            {!readOnly && (
              <div className="flex gap-2">
                <Select onValueChange={agregarServicio}>
                  <SelectTrigger className={`bg-dark-hover border-dark-color text-dark-primary flex-1 ${errors.servicios ? 'border-red-500/50' : ''}`}>
                    <SelectValue placeholder="Agregar un servicio..." />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    {servicios.map(s => (
                      <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>
                        {s.nombre_servicio} - ${s.precio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {errors.servicios && <p className="text-red-400 text-xs font-medium animate-pulse">{errors.servicios}</p>}

            {formData.serviciosSeleccionados.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.serviciosSeleccionados.map(id_servicio => {
                  const servicio = servicios.find(s => s.id_servicio === id_servicio);
                  if (!servicio) return null;
                  return (
                    <div key={id_servicio} className="flex items-center justify-between p-2 rounded-lg bg-dark-hover border border-dark-color">
                      <span className="text-sm text-dark-primary">{servicio.nombre_servicio}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-emerald-400 font-semibold">${servicio.precio}</span>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => quitarServicio(id_servicio)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-dark-color pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="text-dark-secondary hover:bg-dark-hover">
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6">
                {loading ? 'Procesando...' : (cita ? 'Guardar Cambios' : 'Agendar Cita')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
