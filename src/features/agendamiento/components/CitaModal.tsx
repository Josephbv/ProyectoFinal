import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Label } from '../../../shared/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/select';
import { Calendar, Clock, User, Stethoscope, ListPlus, Trash2 } from 'lucide-react';
import { Agendamiento, AgendamientoServicio, useAgendamiento } from '../hooks/useAgendamiento';
import { useEmpleados } from '../../empleados/hooks/useEmpleados';
import { useClientes } from '../../clientes/hooks/useClientes';
import { useServicios } from '../../servicios/hooks/useServicios';
import { useHorario } from '../../empleados/hooks/useHorario';
import { formatTo12h } from '../../../shared/utils/formatTime';
import { toast } from 'sonner';

interface CitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cita: Partial<Agendamiento>) => Promise<any>;
  cita?: Agendamiento | null;
  loading?: boolean;
  readOnly?: boolean;
}

/** Genera slots de 30 minutos entre horaInicio y horaFin (formato "HH:mm") */
function generarSlots(horaInicio: string, horaFin: string, intervaloMin = 30): string[] {
  const slots: string[] = [];
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  let totalMin = hI * 60 + mI;
  const finMin = hF * 60 + mF;
  while (totalMin <= finMin) {
    const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const m = (totalMin % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    totalMin += intervaloMin;
  }
  return slots;
}

/** Extrae "HH:mm" de cualquier representación de hora que venga del backend */
function extraerHHmm(horaStr: string | null | undefined): string {
  if (!horaStr) return '';
  if (/^\d{2}:\d{2}/.test(horaStr)) return horaStr.substring(0, 5);
  try {
    const d = new Date(horaStr);
    if (!isNaN(d.getTime())) {
      return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    }
  } catch { /* noop */ }
  return '';
}

export function CitaModal({ isOpen, onClose, onSubmit, cita, loading, readOnly = false }: CitaModalProps) {
  const { empleados } = useEmpleados();
  const { clientes } = useClientes();
  const { servicios } = useServicios();
  const { horarios } = useHorario();
  const { citas } = useAgendamiento();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '',
    id_cliente: '',
    id_empleado: '',
    serviciosSeleccionados: [] as number[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cita) {
      setFormData({
        fecha: cita.fecha ? cita.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
        hora: extraerHHmm(cita.hora),
        id_cliente: cita.id_cliente.toString(),
        id_empleado: cita.id_empleado.toString(),
        serviciosSeleccionados: cita.agendamiento_servicios ? cita.agendamiento_servicios.map(s => s.id_servicio) : []
      });
    } else {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        hora: '',
        id_cliente: '',
        id_empleado: '',
        serviciosSeleccionados: []
      });
    }
    setErrors({});
  }, [cita, isOpen]);

  // ─── Calcular slots disponibles ────────────────────────────────────────────
  const slotsDisponibles = useMemo(() => {
    if (!formData.id_empleado || !formData.fecha) return [];

    const fechaCita = new Date(formData.fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombreDia = diasSemana[fechaCita.getDay()];

    // Horario del empleado para ese día
    const horarioDia = horarios.find(
      h => h.id_empleado === parseInt(formData.id_empleado) && h.dia_semana === nombreDia && h.disponible !== false
    );
    if (!horarioDia) return []; // no trabaja ese día

    const inicioStr = extraerHHmm(horarioDia.hora_inicio);
    const finStr = extraerHHmm(horarioDia.hora_fin);
    if (!inicioStr || !finStr) return [];

    let slots = generarSlots(inicioStr, finStr);

    // Si es hoy, eliminar horas que ya pasaron (hora local actual)
    const hoy = new Date().toISOString().split('T')[0];
    if (formData.fecha === hoy) {
      const ahora = new Date();
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      slots = slots.filter(s => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m > minutosAhora;
      });
    }

    // Eliminar slots ya ocupados por otras citas del empleado en esa fecha
    // (excepto la cita que estamos editando)
    const citasOcupadas = citas.filter(c => {
      if (c.id_empleado !== parseInt(formData.id_empleado)) return false;
      if (!c.fecha) return false;
      const fCita = c.fecha.split('T')[0];
      if (fCita !== formData.fecha) return false;
      if (c.estado === 'cancelada') return false;
      if (cita && c.id_agendamiento === cita.id_agendamiento) return false; // edición
      return true;
    });
    const horasOcupadas = new Set(citasOcupadas.map(c => extraerHHmm(c.hora)));
    slots = slots.filter(s => !horasOcupadas.has(s));

    return slots;
  }, [formData.id_empleado, formData.fecha, horarios, citas, cita]);

  // Si el slot seleccionado ya no es válido, limpiarlo
  useEffect(() => {
    if (formData.hora && slotsDisponibles.length > 0 && !slotsDisponibles.includes(formData.hora)) {
      setFormData(prev => ({ ...prev, hora: '' }));
    }
  }, [slotsDisponibles]);

  // ─── Validación ────────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.id_cliente) newErrors.id_cliente = 'Selecciona un cliente';
    if (!formData.id_empleado) newErrors.id_empleado = 'Selecciona un empleado';
    if (!formData.fecha) newErrors.fecha = 'La fecha es requerida';
    if (!formData.hora) newErrors.hora = 'Selecciona una hora disponible';
    if (formData.serviciosSeleccionados.length === 0) newErrors.servicios = 'Debes seleccionar al menos un servicio';

    // Validación de día laboral (feedback inmediato si no hay slots)
    if (formData.id_empleado && formData.fecha && slotsDisponibles.length === 0) {
      newErrors.hora = 'No hay horas disponibles para este profesional en la fecha seleccionada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const agendamientoData: Partial<Agendamiento> = {
      fecha: formData.fecha,
      hora: formData.hora,
      id_cliente: parseInt(formData.id_cliente),
      id_empleado: parseInt(formData.id_empleado),
      agendamiento_servicios: formData.serviciosSeleccionados.map(id_servicio => ({ id_servicio })) as AgendamientoServicio[]
    };

    if (cita) agendamientoData.id_agendamiento = cita.id_agendamiento;

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
      setFormData(prev => ({ ...prev, serviciosSeleccionados: [...prev.serviciosSeleccionados, id] }));
      if (errors.servicios) setErrors(prev => ({ ...prev, servicios: '' }));
    }
  };

  const quitarServicio = (id_servicio: number) => {
    setFormData(prev => ({
      ...prev,
      serviciosSeleccionados: prev.serviciosSeleccionados.filter(id => id !== id_servicio)
    }));
  };

  // ─── Mensaje descriptivo de slots ─────────────────────────────────────────
  const mensajeSlots = useMemo(() => {
    if (!formData.id_empleado || !formData.fecha) return 'Selecciona un empleado y una fecha para ver las horas disponibles.';
    const fechaCita = new Date(formData.fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombreDia = diasSemana[fechaCita.getDay()];
    const horarioDia = horarios.find(
      h => h.id_empleado === parseInt(formData.id_empleado) && h.dia_semana === nombreDia && h.disponible !== false
    );
    if (!horarioDia) return `El profesional no atiende los días ${nombreDia}.`;
    if (slotsDisponibles.length === 0) return 'No quedan horas disponibles para este día (horas pasadas u ocupadas).';
    return null;
  }, [formData.id_empleado, formData.fecha, horarios, slotsDisponibles]);

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

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">

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
                    <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_cliente && <p className="text-red-400 text-xs">{errors.id_cliente}</p>}
            </div>

            {/* Empleado */}
            <div className="space-y-2">
              <Label className="text-dark-primary flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-blue-400" />Empleado Asignado *</Label>
              <Select value={formData.id_empleado} onValueChange={(val: string) => { handleChange('id_empleado', val); handleChange('hora', ''); }} disabled={readOnly}>
                <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary h-10">
                  <SelectValue placeholder="Asignar empleado..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-color">
                  {empleados.map(e => (
                    <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>{e.nombre} ({e.cargo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.id_empleado && <p className="text-red-400 text-xs">{errors.id_empleado}</p>}
            </div>

            {/* Fecha */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-dark-primary flex items-center gap-1.5"><Calendar className="w-4 h-4 text-pink-400" />Fecha *</Label>
              <input
                type="date"
                value={formData.fecha}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => { handleChange('fecha', e.target.value); handleChange('hora', ''); }}
                disabled={readOnly}
                className="w-full h-10 rounded-md border border-dark-color bg-dark-hover px-3 text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
              />
              {errors.fecha && <p className="text-red-400 text-xs">{errors.fecha}</p>}
            </div>
          </div>

          {/* Selector de hora en franjas */}
          <div className="space-y-2">
            <Label className="text-dark-primary flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Hora disponible *
            </Label>

            {readOnly ? (
              <p className="text-sm text-dark-primary font-semibold">{formData.hora ? formatTo12h(formData.hora) : 'Sin hora'}</p>
            ) : mensajeSlots ? (
              <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">{mensajeSlots}</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {slotsDisponibles.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { handleChange('hora', slot); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
                      ${formData.hora === slot
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-dark-hover border-dark-color text-dark-secondary hover:border-blue-400/50 hover:text-dark-primary'
                      }`}
                  >
                    {formatTo12h(slot)}
                  </button>
                ))}
              </div>
            )}
            {errors.hora && <p className="text-red-400 text-xs">{errors.hora}</p>}
          </div>

          {/* Servicios */}
          <div className="space-y-4 pt-2">
            <Label className="text-dark-primary flex items-center gap-1.5"><ListPlus className="w-4 h-4 text-emerald-400" />
              {readOnly ? 'Servicios Programados' : 'Servicios a Realizar *'}
            </Label>

            {(() => {
              const isPaid = cita && (cita.estado === 'completada' || localStorage.getItem(`pagado_${cita.id_agendamiento}`) === 'true');

              if (readOnly) return null;

              if (isPaid) {
                return (
                  <p className="text-[10px] text-amber-400/80 bg-amber-400/5 px-2 py-1 rounded border border-amber-400/10 italic">
                    Cita pagada: No se pueden agregar o quitar servicios.
                  </p>
                );
              }

              return (
                <Select onValueChange={agregarServicio}>
                  <SelectTrigger className={`bg-dark-hover border-dark-color text-dark-primary ${errors.servicios ? 'border-red-500/50' : ''}`}>
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
              );
            })()}

            {errors.servicios && <p className="text-red-400 text-xs font-medium">{errors.servicios}</p>}

            {formData.serviciosSeleccionados.length > 0 && (
              <div className="space-y-2">
                {formData.serviciosSeleccionados.map(id_servicio => {
                  const servicio = servicios.find(s => s.id_servicio === id_servicio);
                  if (!servicio) return null;
                  const isPaid = cita && (cita.estado === 'completada' || localStorage.getItem(`pagado_${cita.id_agendamiento}`) === 'true');

                  return (
                    <div key={id_servicio} className="flex items-center justify-between p-2 rounded-lg bg-dark-hover border border-dark-color">
                      <span className="text-sm text-dark-primary">{servicio.nombre_servicio}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-emerald-400 font-semibold">${servicio.precio}</span>
                        {!readOnly && !isPaid && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => quitarServicio(id_servicio)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10">
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
              <Button type="submit" disabled={loading || !formData.hora} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6">
                {loading ? 'Procesando...' : (cita ? 'Guardar Cambios' : 'Agendar Cita')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
