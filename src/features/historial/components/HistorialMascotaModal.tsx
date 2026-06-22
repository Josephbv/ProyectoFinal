import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Textarea } from '../../../shared/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/select';
import { HistorialMascota } from '../hooks/useHistorialMascotas';
import { FileText, Heart, Stethoscope, Thermometer, Activity, User, Search, Calendar, Clock, XCircle, CheckCircle } from 'lucide-react';
import { useClientes } from '../../clientes/hooks/useClientes';
import { useMascotas } from '../../mascotas/hooks/useMascotas';
import { toast } from 'sonner';
import { useUsuarios } from '../../configuracion/hooks/useUsuarios';
import { useEmpleados } from '../../empleados/hooks/useEmpleados';

interface HistorialMascotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entrada: Omit<HistorialMascota, 'id'>) => Promise<any>;
  entrada?: HistorialMascota | null;
  loading?: boolean;
}

export function HistorialMascotaModal({ isOpen, onClose, onSubmit, entrada, loading }: HistorialMascotaModalProps) {
  const { clientes } = useClientes();
  const { mascotas } = useMascotas();
  const { usuarios } = useUsuarios();
  const { empleados } = useEmpleados();

  // Combinar doctores de Usuarios y de Empleados
  const doctores = [
    ...usuarios
      .filter((u: any) => {
        const roleName = u.roles?.nombre_rol?.toLowerCase() || u.rol?.nombre_rol?.toLowerCase();
        return roleName === 'veterinario' || roleName === 'administrador' || roleName === 'admin';
      })
      .map((u: any) => ({ id: `user-${u.id_usuario}`, nombre: `Dr. ${u.nombre_usuario}` })),
    ...empleados
      .filter((e: any) => e.cargo?.toLowerCase() === 'veterinario')
      .map((e: any) => ({ id: `emp-${e.id_empleado}`, nombre: `Dr. ${e.nombre}` }))
  ].filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.nombre === v.nombre) === i); // Deduplicar por nombre

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPetId, setSelectedPetId] = useState<string>('');

  const [formData, setFormData] = useState({
    mascotaId: '',
    nombreMascota: '',
    clienteId: '',
    nombreCliente: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    tipoVisita: [] as string[],
    veterinario: '',
    diagnostico: '',
    estado: 'normal' as 'normal' | 'preocupante' | 'critico'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos si es edición
  useEffect(() => {
    if (entrada) {
      setFormData({
        mascotaId: entrada.id_mascota?.toString() || '',
        nombreMascota: entrada.nombreMascota,
        clienteId: (entrada as any).id_cliente?.toString() || '',
        nombreCliente: entrada.nombreCliente,
        fecha: entrada.fecha,
        hora: entrada.hora || new Date().toTimeString().slice(0, 5),
        tipoVisita: Array.isArray(entrada.tipoVisita) ? entrada.tipoVisita : (entrada.tipoVisita ? [entrada.tipoVisita] : []),
        veterinario: entrada.veterinario,
        diagnostico: entrada.diagnostico || (entrada as any).motivoConsulta || '',
        estado: entrada.estado as any
      });
      setSelectedClientId((entrada as any).id_cliente?.toString() || '');
      setSelectedPetId(entrada.id_mascota?.toString() || '');
    } else {
      resetForm();
    }
    setErrors({});
  }, [entrada, isOpen]);

  const resetForm = () => {
    setFormData({
      mascotaId: '',
      nombreMascota: '',
      clienteId: '',
      nombreCliente: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      tipoVisita: [],
      veterinario: '',
      diagnostico: '',
      estado: 'normal'
    });
    setSelectedClientId('');
    setSelectedPetId('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Si estamos editando, los IDs ya vienen bloqueados y pre-cargados en entrada
    const currentPetId = selectedPetId || (entrada?.id_mascota?.toString());
    const currentClientId = selectedClientId || ((entrada as any)?.id_cliente?.toString());

    if (!currentPetId) newErrors.mascotaId = 'Debes seleccionar una mascota';
    if (!currentClientId) newErrors.clienteId = 'Debes seleccionar un cliente';
    if (!formData.veterinario.trim()) newErrors.veterinario = 'El veterinario es requerido';
    if (formData.tipoVisita.length === 0) newErrors.tipoVisita = 'Selecciona al menos un tipo de visita';

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const currentPetId = selectedPetId || (entrada?.id_mascota?.toString());
      const petId = parseInt(currentPetId || '');

      if (isNaN(petId)) {
        toast.error('ID de mascota inválido');
        return;
      }

      const payload = {
        ...formData,
        id_mascota: petId
      };

      const result = await onSubmit(payload as any);

      if (result.success) {
        onClose();
      } else {
        toast.error(result.error || "Error al guardar el historial");
      }
    } catch (err: any) {
      toast.error('Error inesperado: ' + (err.message || 'Desconocido'));
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleTipoVisita = (tipo: string) => {
    setFormData(prev => {
      const current = prev.tipoVisita;
      const updated = current.includes(tipo)
        ? current.filter(t => t !== tipo)
        : [...current, tipo];
      return { ...prev, tipoVisita: updated };
    });
    if (errors.tipoVisita) {
      setErrors(prev => ({ ...prev, tipoVisita: '' }));
    }
  };

  const selectedClient = clientes.find((c: any) => c.id_cliente?.toString() === selectedClientId);
  const clientPets = mascotas.filter((m: any) => m.id_cliente?.toString() === selectedClientId);

  const visitTypes = [
    { id: 'consulta', label: 'Consulta', color: 'blue' },
    { id: 'vacunacion', label: 'Vacunación', color: 'green' },
    { id: 'cirugia', label: 'Cirugía', color: 'purple' },
    { id: 'emergencia', label: 'Emergencia', color: 'red' },
    { id: 'control', label: 'Control', color: 'yellow' },
    { id: 'desparasitacion', label: 'Desparasitación', color: 'orange' },
    { id: 'estetica', label: 'Estética', color: 'pink' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color border-opacity-50 shadow-2xl p-0 font-sans">
        <div className="p-6 space-y-6">
          <DialogHeader className="border-b border-dark-color pb-4">
            <DialogTitle className="text-2xl font-bold text-dark-primary flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              {entrada ? 'Editar Historial' : 'Nueva Entrada Médica'}
            </DialogTitle>
            <DialogDescription className="text-dark-secondary italic">
              Completa la información clínica de la mascota para el historial permanente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* SECCIÓN 1: CLIENTE Y MASCOTA */}
            <div className="p-5 bg-dark-bg/40 border border-dark-color rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-dark-secondary mb-1">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Identificación del Paciente</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Selección de Dueño */}
                <div className="space-y-2">
                  <Label className="text-xs text-dark-primary font-semibold">1. Dueño (Cliente)</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={(val: string) => {
                      setSelectedClientId(val);
                      setSelectedPetId('');
                    }}
                    disabled={!!entrada}
                  >
                    <SelectTrigger className={`bg-dark-card border-dark-color text-dark-primary h-11 shadow-lg ${entrada ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder="Busca por nombre o cédula..." />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-color max-h-60">
                      {clientes.length === 0 ? (
                        <div className="p-4 text-center text-xs text-dark-secondary italic">No hay clientes cargados</div>
                      ) : clientes.map((c: any) => (
                        <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>
                          {c.nombre} {c.cedula ? `(${c.cedula})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {entrada && <p className="text-[10px] text-dark-secondary italic pl-1">El cliente no se puede cambiar en edición</p>}
                </div>

                {/* Selección de Mascota */}
                <div className="space-y-2">
                  <Label className="text-xs text-dark-primary font-semibold">2. Mascota</Label>
                  <div className="min-h-[44px] flex items-center">
                    {!selectedClientId ? (
                      <p className="text-[10px] text-dark-secondary italic bg-dark-hover/50 w-full py-3 px-4 rounded-lg border border-dashed border-dark-color">
                        Primero selecciona un dueño a la izquierda
                      </p>
                    ) : clientPets.length === 0 ? (
                      <p className="text-[10px] text-red-400 italic bg-red-400/5 w-full py-3 px-4 rounded-lg border border-dashed border-red-400/30">
                        Este cliente no tiene mascotas registradas
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {clientPets.filter((p: any) => !entrada || p.id_mascota.toString() === selectedPetId).map((pet: any) => (
                          <button
                            key={pet.id_mascota}
                            type="button"
                            disabled={!!entrada}
                            onClick={() => {
                              setSelectedPetId(pet.id_mascota.toString());
                              handleChange('nombreMascota', pet.nombre);
                            }}
                            className={`px-4 py-2 rounded-xl border text-xs transition-all duration-200 ${selectedPetId === pet.id_mascota.toString()
                              ? 'bg-pink-500 border-pink-500 text-white font-bold shadow-md transform scale-105'
                              : 'bg-dark-card border-dark-color text-dark-secondary hover:border-pink-500/50 hover:bg-dark-hover'
                              } ${entrada ? 'cursor-not-allowed opacity-100' : ''}`}
                          >
                            {pet.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {entrada && <p className="text-[10px] text-dark-secondary italic pl-1">La mascota no se puede cambiar en edición</p>}
                </div>
              </div>

              {(errors.clienteId || errors.mascotaId) && (
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-2">
                  <p className="text-red-400 text-[10px] font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Falta información del cliente o mascota
                  </p>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: DATOS DE LA VISITA Y VETERINARIO */}
            <div className="p-5 bg-dark-bg/40 rounded-2xl border border-dark-color space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-dark-secondary font-bold uppercase flex items-center gap-1.5 pl-1">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    Fecha
                  </Label>
                  <Input type="date" value={formData.fecha} onChange={(e) => handleChange('fecha', e.target.value)} className="bg-dark-card border-dark-color h-10 shadow-inner" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-dark-secondary font-bold uppercase flex items-center gap-1.5 pl-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    Hora
                  </Label>
                  <Input type="time" value={formData.hora} onChange={(e) => handleChange('hora', e.target.value)} className="bg-dark-card border-dark-color h-10 shadow-inner" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-dark-secondary font-bold uppercase flex items-center gap-1.5 pl-1">
                    <Stethoscope className="w-3 h-3 text-blue-400" />
                    Veterinario
                  </Label>
                  <Select value={formData.veterinario} onValueChange={(val: string) => handleChange('veterinario', val)}>
                    <SelectTrigger className="bg-dark-card border-dark-color text-dark-primary h-10">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-color">
                      {doctores.map((d: any) => (
                        <SelectItem key={d.id} value={d.nombre} className="text-xs">
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-dark-secondary font-bold uppercase pl-1">Tipo de Visita (Puedes marcar varias)</Label>
                  {errors.tipoVisita && <p className="text-red-400 text-[10px]">{errors.tipoVisita}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {visitTypes.map((type: any) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleTipoVisita(type.id)}
                      className={`px-3 py-2 rounded-full border text-xs transition-all flex items-center gap-2 ${formData.tipoVisita.includes(type.id)
                        ? `bg-${type.color}-500/20 border-${type.color}-500 text-${type.color}-400 font-bold shadow-sm`
                        : 'bg-dark-card border-dark-color text-dark-secondary hover:bg-dark-hover'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${formData.tipoVisita.includes(type.id) ? `bg-${type.color}-400` : 'bg-dark-secondary opacity-50'}`} />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DIAGNÓSTICO MÉDICO */}
            <div className="p-1 space-y-4">
              <div className="flex items-center gap-2 text-dark-secondary mb-1">
                <Stethoscope className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Diagnóstico de la Visita</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-dark-secondary uppercase font-bold tracking-wider pl-1">Diagnóstico Médico y Evolución</Label>
                  <span className="text-[10px] font-bold text-dark-secondary bg-dark-hover px-2 py-0.5 rounded-full border border-dark-color">
                    {(formData.diagnostico || '').length}/100
                  </span>
                </div>
                <Textarea
                  placeholder="Escribe el diagnóstico clínico detallado, evolución y tratamiento..."
                  value={formData.diagnostico}
                  onChange={(e) => handleChange('diagnostico', e.target.value.slice(0, 100))}
                  maxLength={100}
                  className="bg-dark-card border-dark-color min-h-[200px] text-sm focus:ring-1 focus:ring-blue-500/30 text-dark-primary p-4 rounded-xl leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 border-t border-dark-color pt-6 pb-2">
              <Button type="button" variant="ghost" onClick={onClose} className="text-dark-secondary hover:bg-dark-hover px-6">Cancelar</Button>
              <Button
                type="submit"
                disabled={loading}
                className="dark-button-primary px-10 shadow-lg shadow-blue-500/10"
              >
                {loading ? 'Guardando...' : (entrada ? 'Actualizar Registro' : 'Confirmar Registro')}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlusIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
  );
}
