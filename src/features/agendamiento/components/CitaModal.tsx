import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Label } from '../../../shared/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/select';
import { Calendar, Clock, User, Stethoscope, ListPlus, Trash2, Dog, CheckCircle2 } from 'lucide-react';
import { useAgendamiento, Agendamiento, AgendamientoServicio } from '../hooks/useAgendamiento';
import { useEmpleados } from '../../empleados/hooks/useEmpleados';
import { useClientes } from '../../clientes/hooks/useClientes';
import { useMascotas } from '../../mascotas/hooks/useMascotas';
import { useServicios } from '../../servicios/hooks/useServicios';
import { useHorario } from '../../empleados/hooks/useHorario';
import { formatTo12h } from '../../../shared/utils/formatTime';
import { toast } from 'sonner';
import { useEmailAuth } from '../../auth/hooks/useEmailAuth';
import { useUsuarios } from '../../configuracion/hooks/useUsuarios';

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
  // Solo agregar el slot si hay suficiente tiempo para al menos un intervalo
  while (totalMin + intervaloMin <= finMin) {
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
  const { mascotas } = useMascotas();
  const { servicios } = useServicios();
  const { horarios } = useHorario();
  const { citas } = useAgendamiento();
  const { user } = useEmailAuth();
  const { usuarios } = useUsuarios();

  const roleName = typeof user?.rol === 'string' ? user.rol : (user?.rol as any)?.nombre_rol || '';
  const isClienteRole = roleName.toLowerCase().includes('cliente');
  const isVetRole = roleName.toLowerCase().includes('veterinario');

  const [formData, setFormData] = useState({
    fecha: new Date().toLocaleDateString('sv-SE'),
    hora: '',
    id_cliente: isClienteRole && user?.id_cliente ? user.id_cliente.toString() : '',
    id_mascota: '',
    id_empleado: isVetRole && user?.id_empleado ? user.id_empleado.toString() : '',
    serviciosSeleccionados: [] as { id_servicio: number, realizado: boolean }[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cita) {
      setFormData({
        fecha: cita.fecha ? cita.fecha.split('T')[0] : new Date().toLocaleDateString('sv-SE'),
        hora: extraerHHmm(cita.hora),
        id_cliente: cita.id_cliente?.toString() || '',
        id_mascota: cita.id_mascota?.toString() || '',
        id_empleado: cita.id_empleado?.toString() || '',
        serviciosSeleccionados: cita.agendamiento_servicios
          ? cita.agendamiento_servicios.map(s => ({
            id_servicio: s.id_servicio,
            realizado: s.realizado !== false // por defecto verdadero si viene del backend o undefined
          }))
          : []
      });
    } else {
      setFormData({
        fecha: new Date().toLocaleDateString('sv-SE'),
        hora: '',
        id_cliente: isClienteRole && user?.id_cliente ? user.id_cliente.toString() : '',
        id_mascota: '',
        id_empleado: isVetRole && user?.id_empleado ? user.id_empleado.toString() : '',
        serviciosSeleccionados: []
      });
    }
    setErrors({});
  }, [cita, isOpen, isClienteRole, user?.id_cliente]);

  // ─── Calcular slots disponibles considerando DURACIÓN ─────────────────────
  const slotsDisponibles = useMemo(() => {
    if (!formData.id_empleado || !formData.fecha) return [];

    const fechaCita = new Date(formData.fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombreDia = diasSemana[fechaCita.getDay()];

    const horarioDia = horarios.find(
      h => Number(h.id_empleado) === Number(formData.id_empleado) && h.dia_semana === nombreDia && h.disponible !== false
    );
    if (!horarioDia) return [];

    const inicioStr = extraerHHmm(horarioDia.hora_inicio);
    const finStr = extraerHHmm(horarioDia.hora_fin);
    if (!inicioStr || !finStr) return [];

    let slotsBase = generarSlots(inicioStr, finStr);

    // 1. Minutos ocupados por citas existentes (30 mins x cada servicio)
    const minutosOcupados = new Set<number>();
    citas.forEach(c => {
      if (Number(c.id_empleado) !== Number(formData.id_empleado)) return;
      if (!c.fecha || c.estado === 'cancelada') return;
      if (cita && c.id_agendamiento === cita.id_agendamiento) return; // ignoramos la propia cita en edición

      const fCita = c.fecha.split('T')[0];
      if (fCita !== formData.fecha) return;

      const [h, m] = extraerHHmm(c.hora).split(':').map(Number);
      const startMin = h * 60 + m;

      // Sumar duración real de todos los servicios de la cita
      const duracion = c.agendamiento_servicios?.reduce((acc, as) => {
        const s = servicios.find(srv => srv.id_servicio === as.id_servicio);
        return acc + (s?.duracion || 30);
      }, 0) || 30;

      for (let i = 0; i < duracion; i += 30) {
        minutosOcupados.add(startMin + i);
      }
    });

    // 2. Filtrar slots hoy (pasados)
    const hoy = new Date().toISOString().split('T')[0];
    if (formData.fecha === hoy) {
      const ahora = new Date();
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      slotsBase = slotsBase.filter(s => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m > minutosAhora;
      });
    }

    // 3. Filtrar slots ya ocupados (el punto de inicio está ocupado)
    let slotsLibres = slotsBase.filter(s => {
      const [h, m] = s.split(':').map(Number);
      return !minutosOcupados.has(h * 60 + m);
    });

    // 4. VALIDACIÓN: Mostrar slots que tengan al menos 30 min (el mínimo)
    // No filtramos por la duración total aquí para que las horas no "desaparezcan".
    // La validación de duración total se hace al seleccionar o al agregar servicios.
    const duracionMinima = 30;

    return slotsLibres.filter(s => {
      const [h, m] = s.split(':').map(Number);
      const inicioProbable = h * 60 + m;

      for (let offset = 0; offset < duracionMinima; offset += 30) {
        const minCheck = inicioProbable + offset;
        const hCheck = Math.floor(minCheck / 60);
        const mCheck = minCheck % 60;
        const timeStr = `${hCheck.toString().padStart(2, '0')}:${mCheck.toString().padStart(2, '0')}`;

        if (minutosOcupados.has(minCheck) || !slotsBase.includes(timeStr)) {
          return false;
        }
      }
      return true;
    });
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
    if (!formData.id_cliente) {
      newErrors.id_cliente = 'Debes seleccionar un cliente responsable.';
    } else {
      const cliId = parseInt(formData.id_cliente);
      const c = clientes.find(cli => cli.id_cliente === cliId);
      if (c) {
        const usuarioVinculado = usuarios.find(u =>
          (u.id_cliente && u.id_cliente === c.id_cliente) ||
          (u.correo && c.correo && u.correo.toLowerCase().trim() === c.correo.toLowerCase().trim()) ||
          (u.cedula && c.cedula && u.cedula.trim() === c.cedula.trim())
        );
        const esInactivo = usuarioVinculado && usuarioVinculado.estado && usuarioVinculado.estado !== 'activo';
        if (esInactivo && (!cita || cita.id_cliente !== cliId)) {
          newErrors.id_cliente = 'El cliente seleccionado tiene su cuenta inactiva y no se le pueden agendar nuevas citas.';
        }
      }
    }

    if (!formData.id_mascota) newErrors.id_mascota = 'Debes seleccionar la mascota.';

    if (!formData.id_empleado) {
      newErrors.id_empleado = 'Debes asignar un profesional veterinario.';
    } else {
      const empId = parseInt(formData.id_empleado);
      const e = empleados.find(emp => Number(emp.id_empleado) === Number(empId));
      if (e) {
        const usuarioVinculado = usuarios.find(u =>
          (u.id_empleado && Number(u.id_empleado) === Number(e.id_empleado)) ||
          (u.correo && e.correo && u.correo.toLowerCase().trim() === e.correo.toLowerCase().trim()) ||
          (u.cedula && e.cedula && u.cedula.trim() === e.cedula.trim())
        );
        const esInactivo = usuarioVinculado && usuarioVinculado.estado && usuarioVinculado.estado !== 'activo';
        if (esInactivo && (!cita || cita.id_empleado !== empId)) {
          newErrors.id_empleado = 'El empleado seleccionado tiene su cuenta inactiva y no puede recibir nuevas citas.';
        }
      }
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha de la cita es obligatoria.';
    } else if (!cita) {
      // Solo para citas nuevas: no permitir fechas pasadas
      const selected = new Date(formData.fecha + 'T12:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        newErrors.fecha = 'No puedes agendar una cita en una fecha que ya pasó.';
      }
    }

    if (!formData.hora) newErrors.hora = 'Debes seleccionar una hora válida de la lista.';
    if (formData.serviciosSeleccionados.length === 0) newErrors.servicios = 'Selecciona al menos un servicio para agendar la cita.';

    // Validación de disponibilidad del profesional
    if (formData.id_empleado && formData.fecha && slotsDisponibles.length === 0) {
      newErrors.hora = 'El profesional no tiene disponibilidad en la fecha seleccionada. Prueba otro día.';
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
      id_mascota: parseInt(formData.id_mascota),
      id_empleado: parseInt(formData.id_empleado),
      agendamiento_servicios: formData.serviciosSeleccionados.map(s => ({
        id_servicio: s.id_servicio,
        realizado: s.realizado
      })) as AgendamientoServicio[]
    };

    if (cita) agendamientoData.id_agendamiento = cita.id_agendamiento;

    const result = await onSubmit(agendamientoData);
    if (result.success) onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  /**
   * Calcula cuántos minutos libres hay a partir de un slot dado,
   * considerando TANTO la hora de cierre del empleado COMO la próxima cita existente.
   * Devuelve el número máximo de servicios permitidos (30 min c/u).
   */
  const obtenerMaxServiciosEnSlot = (horaSlot: string): number => {
    if (!formData.id_empleado || !formData.fecha) return 99;

    const [hS, mS] = horaSlot.split(':').map(Number);
    const inicioMin = hS * 60 + mS;

    // 1. Límite por horario de cierre del empleado
    const fechaCita = new Date(formData.fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombreDia = diasSemana[fechaCita.getDay()];
    const horarioDia = horarios.find(
      h => Number(h.id_empleado) === Number(formData.id_empleado) && h.dia_semana === nombreDia
    );
    let limiteMin = horarioDia ? (() => {
      const [hF, mF] = extraerHHmm(horarioDia.hora_fin).split(':').map(Number);
      return hF * 60 + mF;
    })() : inicioMin + 9999;

    // 2. Límite por la PRÓXIMA CITA del mismo empleado ese día
    const citasDelEmpleadoEseDia = citas.filter(c => {
      if (Number(c.id_empleado) !== Number(formData.id_empleado)) return false;
      if (!c.fecha || c.estado === 'cancelada') return false;
      if (cita && c.id_agendamiento === cita.id_agendamiento) return false; // ignorar la propia
      const fCita = c.fecha.split('T')[0];
      return fCita === formData.fecha;
    });

    // Encontrar la cita más cercana que empieza DESPUÉS del slot seleccionado
    let proximaCitaMin = Infinity;
    citasDelEmpleadoEseDia.forEach(c => {
      const horaC = extraerHHmm(c.hora);
      if (!horaC) return;
      const [hC, mC] = horaC.split(':').map(Number);
      const startC = hC * 60 + mC;
      if (startC > inicioMin && startC < proximaCitaMin) {
        proximaCitaMin = startC;
      }
    });

    // 3. Usar el límite más restrictivo
    const limiteEfectivo = Math.min(limiteMin, proximaCitaMin === Infinity ? limiteMin : proximaCitaMin);
    const minutosLibres = limiteEfectivo - inicioMin;
    return Math.max(0, minutosLibres);
  };

  const agregarServicio = (id_servicio: string) => {
    const id = parseInt(id_servicio);
    if (!id || formData.serviciosSeleccionados.some(s => s.id_servicio === id)) return;

    const servicioAgregado = servicios.find(s => s.id_servicio === id);

    // VALIDACIÓN INTELIGENTE: ¿Cabe este nuevo servicio considerando la próxima cita?
    if (formData.hora && formData.id_empleado && formData.fecha) {
      const minDisponibles = obtenerMaxServiciosEnSlot(formData.hora);
      const nuevaDuracionTotal = formData.serviciosSeleccionados.reduce((acc, item) => {
        const s = servicios.find(srv => srv.id_servicio === item.id_servicio);
        return acc + (s?.duracion || 30);
      }, 0) + (servicioAgregado?.duracion || 30);

      if (nuevaDuracionTotal > minDisponibles) {
        toast.error("Tiempo insuficiente", {
          description: `No hay tiempo suficiente en este horario para agregar "${servicioAgregado?.nombre_servicio}".`,
        });
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      serviciosSeleccionados: [...prev.serviciosSeleccionados, { id_servicio: id, realizado: true }]
    }));
    if (errors.servicios) setErrors(prev => ({ ...prev, servicios: '' }));
  };

  const toggleRealizado = (id_servicio: number) => {
    setFormData(prev => ({
      ...prev,
      serviciosSeleccionados: prev.serviciosSeleccionados.map(s =>
        s.id_servicio === id_servicio ? { ...s, realizado: !s.realizado } : s
      )
    }));
  };

  const quitarServicio = (id_servicio: number) => {
    setFormData(prev => ({
      ...prev,
      serviciosSeleccionados: prev.serviciosSeleccionados.filter(s => s.id_servicio !== id_servicio)
    }));
  };

  /** Verifica si una hora específica tiene espacio para N servicios (usa gap detection) */
  const verificarEspacioParaServicios = (horaSlot: string, duracionTotal: number) => {
    if (!formData.id_empleado || !formData.fecha) return true;
    const minDisponibles = obtenerMaxServiciosEnSlot(horaSlot);
    return duracionTotal <= minDisponibles;
  };

  const seleccionarHora = (slot: string) => {
    const duracionTotal = formData.serviciosSeleccionados.reduce((acc, item) => {
      const s = servicios.find(srv => srv.id_servicio === item.id_servicio);
      return acc + (s?.duracion || 30);
    }, 0) || 30;

    if (!verificarEspacioParaServicios(slot, duracionTotal)) {
      const minDisponibles = obtenerMaxServiciosEnSlot(slot);
      toast.warning("Horario insuficiente", {
        description: `Este horario solo permite ${minDisponibles} minutos de atención. Por favor, selecciona menos servicios o una hora anterior.`,
      });
      return;
    }
    handleChange('hora', slot);
  };

  // ─── Mensaje descriptivo de slots ─────────────────────────────────────────
  const mensajeSlots = useMemo(() => {
    if (!formData.id_empleado || !formData.fecha) return 'Selecciona un empleado y una fecha para ver las horas disponibles.';
    const fechaCita = new Date(formData.fecha + 'T00:00:00');
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombreDia = diasSemana[fechaCita.getDay()];
    const horarioDia = horarios.find(
      h => Number(h.id_empleado) === Number(formData.id_empleado) && h.dia_semana === nombreDia && h.disponible !== false
    );
    if (!horarioDia) return `El profesional no atiende los días ${nombreDia}.`;
    if (slotsDisponibles.length === 0) return 'No quedan horas disponibles para este día (horas pasadas u ocupadas).';
    return null;
  }, [formData.id_empleado, formData.fecha, horarios, slotsDisponibles]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-dark-card border-dark-color border-opacity-50 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
              <Select value={formData.id_cliente} onValueChange={(val: string) => handleChange('id_cliente', val)} disabled={readOnly || isClienteRole}>
                <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary h-10">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-color">
                  {clientes
                    .filter(c => {
                      const usuarioVinculado = usuarios.find(u =>
                        (u.id_cliente && u.id_cliente === c.id_cliente) ||
                        (u.correo && c.correo && u.correo.toLowerCase().trim() === c.correo.toLowerCase().trim()) ||
                        (u.cedula && c.cedula && u.cedula.trim() === c.cedula.trim())
                      );
                      const esInactivo = usuarioVinculado && usuarioVinculado.estado && usuarioVinculado.estado !== 'activo';
                      const esSeleccionado = formData.id_cliente === String(c.id_cliente);

                      return (!esInactivo || esSeleccionado) && (!isClienteRole || c.id_cliente === user?.id_cliente);
                    })
                    .map((c, idx) => (
                      <SelectItem key={c.id_cliente || `client-${idx}`} value={String(c.id_cliente || '')}>{c.nombre}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.id_cliente && <p className="text-red-400 text-xs">{errors.id_cliente}</p>}
            </div>

            {/* Mascota */}
            <div className="space-y-2">
              <Label className="text-dark-primary flex items-center gap-1.5">
                <Dog className="w-4 h-4 text-emerald-400" />
                Mascota *
              </Label>
              {readOnly ? (
                <p className="text-sm text-dark-primary font-semibold">
                  {formData.id_mascota 
                    ? mascotas.find(m => m.id_mascota === parseInt(formData.id_mascota))?.nombre || 'Desconocida' 
                    : 'Sin mascota asignada'}
                </p>
              ) : (
                <>
                  <Select
                    value={formData.id_mascota}
                    onValueChange={(val: string) => handleChange('id_mascota', val)}
                    disabled={!formData.id_cliente}
                  >
                    <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary h-10">
                      <SelectValue placeholder={formData.id_cliente ? "Seleccionar mascota..." : "Primero elige un cliente"} />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-color">
                      {mascotas
                        .filter(m => Number(m.id_cliente) === Number(formData.id_cliente))
                        .map((m, idx) => (
                          <SelectItem key={m.id_mascota || `pet-${idx}`} value={String(m.id_mascota || '')}>
                            {m.nombre} ({m.raza || m.especie})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.id_mascota && <p className="text-red-400 text-xs">{errors.id_mascota}</p>}
                  {!formData.id_mascota && formData.id_cliente && mascotas.filter(m => Number(m.id_cliente) === Number(formData.id_cliente)).length === 0 && (
                    <p className="text-amber-400/80 text-[10px] italic">Este cliente no tiene mascotas registradas.</p>
                  )}
                </>
              )}
            </div>

            {/* Empleado */}
            <div className="space-y-2">
              <Label className="text-dark-primary flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-blue-400" />Empleado Asignado *</Label>
              <Select value={formData.id_empleado} onValueChange={(val: string) => { handleChange('id_empleado', val); handleChange('hora', ''); }} disabled={readOnly}>
                <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary h-10">
                  <SelectValue placeholder="Asignar empleado..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-color">
                  {empleados
                    .filter(e => {
                      // Verificar si el empleado está inactivo
                      const usuarioVinculado = usuarios.find(u =>
                        (u.id_empleado && Number(u.id_empleado) === Number(e.id_empleado)) ||
                        (u.correo && e.correo && u.correo.toLowerCase().trim() === e.correo.toLowerCase().trim()) ||
                        (u.cedula && e.cedula && u.cedula.trim() === e.cedula.trim())
                      );
                      const esInactivo = usuarioVinculado && usuarioVinculado.estado && usuarioVinculado.estado !== 'activo';
                      
                      // Permitir si no está inactivo, O si es el empleado actualmente seleccionado en la cita
                      const esSeleccionado = Number(formData.id_empleado) === Number(e.id_empleado);

                      return (
                        (!esInactivo || esSeleccionado) &&
                        horarios.some(h => Number(h.id_empleado) === Number(e.id_empleado)) &&
                        (e.cargo || '').toLowerCase() !== 'administrador'
                      );
                    })
                    .map((e, idx) => (
                      <SelectItem key={e.id_empleado || `emp-${idx}`} value={String(e.id_empleado || '')}>{e.nombre} ({e.cargo})</SelectItem>
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
                    onClick={() => seleccionarHora(slot)}
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
                    {servicios
                      .filter(s => s.estado === 'activo')
                      .map((s, idx) => (
                        <SelectItem key={`${s.id_servicio || idx}`} value={(s.id_servicio || '').toString()}>
                          {s.nombre_servicio} - ${s.precio} (⏱️ {s.duracion} min)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              );
            })()}

            {errors.servicios && <p className="text-red-400 text-xs font-medium">{errors.servicios}</p>}

            {formData.serviciosSeleccionados.length > 0 && (
              <div className="space-y-2">
                <div className="max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-dark-color space-y-2">
                  {formData.serviciosSeleccionados.map((item, idx) => {
                    const servicio = servicios.find(s => s.id_servicio === item.id_servicio);
                    if (!servicio) return null;
                    const isPaid = cita && (cita.estado === 'completada' || localStorage.getItem(`pagado_${cita.id_agendamiento}`) === 'true');

                    return (
                      <div key={`${item.id_servicio}-${idx}`} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${item.realizado ? 'bg-dark-hover border-dark-color' : 'bg-red-500/5 border-red-500/20 opacity-70'}`}>
                        <div className="flex items-center gap-3">
                          {!readOnly && !isPaid && (
                            <button
                              type="button"
                              onClick={() => toggleRealizado(item.id_servicio)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.realizado ? 'bg-blue-600 border-blue-500 text-white' : 'border-dark-color bg-dark-bg'}`}
                            >
                              {item.realizado && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                          )}
                          <div className="flex flex-col">
                            <span className={`text-sm ${item.realizado ? 'text-dark-primary' : 'text-dark-secondary line-through'}`}>{servicio.nombre_servicio}</span>
                            <span className="text-[10px] text-blue-400/80 flex items-center gap-1"><Clock className="w-3 h-3" /> {servicio.duracion} min</span>
                            {!item.realizado && <span className="text-[9px] text-red-400 font-bold uppercase tracking-tighter">No realizado</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-semibold ${item.realizado ? 'text-emerald-400' : 'text-dark-secondary'}`}>
                            ${servicio.precio.toLocaleString()}
                          </span>
                          {!readOnly && !isPaid && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => quitarServicio(item.id_servicio)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TOTAL SECTION */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-blue-500/5 border border-dashed border-blue-500/30">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-dark-secondary">Tiempo Total</span>
                      <span className="text-sm font-black text-blue-400">
                        {(() => {
                          const mins = formData.serviciosSeleccionados.reduce((acc, item) => {
                            const s = servicios.find(srv => srv.id_servicio === item.id_servicio);
                            return acc + (s?.duracion || 0);
                          }, 0);
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          return h > 0 ? `${h}h ${m}min` : `${m} min`;
                        })()}
                      </span>
                    </div>
                    <Clock className="w-4 h-4 text-blue-500/50" />
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-dashed border-emerald-500/30">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-dark-secondary">Total Realizado</span>
                      <span className="text-sm font-black text-emerald-400">
                        ${formData.serviciosSeleccionados.reduce((acc, item) => {
                          if (!item.realizado) return acc;
                          const s = servicios.find(srv => srv.id_servicio === item.id_servicio);
                          return acc + (Number(s?.precio) || 0);
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
                  </div>
                </div>
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
    </Dialog >
  );
}
