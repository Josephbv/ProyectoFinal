import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mascota } from '../hooks/useMascotas';
import { useClientes } from '../hooks/useClientes';
import { Dog, User, Calendar, Activity, Syringe, HeartPulse, ShieldCheck, ClipboardList, CheckCircle2 } from 'lucide-react';
import { Switch } from '../ui/switch';

interface MascotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mascota: Partial<Mascota>) => Promise<any>;
  mascota?: Mascota | null;
  loading?: boolean;
  readOnly?: boolean;
  initialClientId?: number;
}

export function MascotaModal({ isOpen, onClose, onSubmit, mascota, loading, readOnly = false, initialClientId }: MascotaModalProps) {
  const { clientes } = useClientes();
  const [formData, setFormData] = useState<Partial<Mascota>>({
    nombre: '',
    especie: '',
    raza: '',
    id_cliente: 0,
    edad: null,
    fecha_nacimiento: '',
    peso: null,
    vacunas: '',
    fecha_ultima_vacuna: '',
    fecha_desparasitacion: '',
    observaciones: '',
    foto: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tieneVacunas, setTieneVacunas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showResults && !(e.target as HTMLElement).closest('.client-search-container')) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showResults]);

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cedula && c.cedula.includes(searchTerm))
  ).slice(0, 5);

  const selectedCliente = clientes.find(c => c.id_cliente === formData.id_cliente);

  useEffect(() => {
    if (mascota) {
      setFormData({
        ...mascota,
        fecha_nacimiento: mascota.fecha_nacimiento ? new Date(mascota.fecha_nacimiento).toISOString().split('T')[0] : '',
        fecha_ultima_vacuna: mascota.fecha_ultima_vacuna ? new Date(mascota.fecha_ultima_vacuna).toISOString().split('T')[0] : '',
        fecha_desparasitacion: mascota.fecha_desparasitacion ? new Date(mascota.fecha_desparasitacion).toISOString().split('T')[0] : ''
      });
      if (mascota.id_cliente) {
        const c = clientes.find(cl => cl.id_cliente === mascota.id_cliente);
        if (c) setSearchTerm(c.nombre);
      }
    } else {
      setFormData({
        nombre: '',
        especie: '',
        raza: '',
        id_cliente: initialClientId || 0,
        edad: null,
        fecha_nacimiento: '',
        peso: null,
        vacunas: '',
        fecha_ultima_vacuna: '',
        fecha_desparasitacion: '',
        observaciones: '',
        foto: ''
      });
      if (initialClientId) {
        const c = clientes.find(cl => cl.id_cliente === initialClientId);
        if (c) setSearchTerm(c.nombre);
      } else {
        setSearchTerm('');
      }
    }
    setTieneVacunas(!!(mascota?.vacunas && mascota.vacunas.length > 0) || !!mascota?.fecha_ultima_vacuna);
    setErrors({});
  }, [mascota, isOpen, clientes, initialClientId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre?.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.especie?.trim()) newErrors.especie = 'La especie es requerida';
    if (!formData.id_cliente) newErrors.id_cliente = 'El cliente es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, addNew: boolean = false) => {
    e.preventDefault();
    if (!validateForm()) return;
    const result = await onSubmit(formData);
    if (result.success) {
      if (addNew) {
        // Limpiar campos de mascota pero mantener el cliente
        setFormData(prev => ({
          nombre: '',
          especie: '',
          raza: '',
          id_cliente: prev.id_cliente,
          id_mascota: undefined, // Asegurar que sea una creación si era una edición
          edad: null,
          fecha_nacimiento: '',
          peso: null,
          vacunas: '',
          fecha_ultima_vacuna: '',
          fecha_desparasitacion: '',
          observaciones: '',
          foto: ''
        }));
        setErrors({});
        // Opcional: mostrar un mini-toast interno o feedback
      } else {
        onClose();
      }
    }
  };

  const handleChange = (field: keyof Mascota, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color border-opacity-50">
        <DialogHeader className="border-b border-dark-color/30 pb-4">
          <DialogTitle className="text-xl font-bold text-dark-primary flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Dog className="w-5 h-5 text-indigo-400" />
            </div>
            {readOnly ? 'Detalles de Mascota' : mascota ? 'Editar Mascota' : 'Nueva Mascota'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            Información clínica y personal del paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2 uppercase tracking-wider">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                Información Básica
              </h3>

              <div className="space-y-2">
                <Label className="text-dark-primary">Nombre *</Label>
                <Input
                  value={formData.nombre ?? ''}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary"
                  readOnly={readOnly}
                />
                {errors.nombre && <p className="text-red-400 text-xs">{errors.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-dark-primary">Especie *</Label>
                  <Input
                    value={formData.especie ?? ''}
                    onChange={(e) => handleChange('especie', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary"
                    placeholder="Ej: Perro, Gato"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-dark-primary">Raza</Label>
                  <Input
                    value={formData.raza ?? ''}
                    onChange={(e) => handleChange('raza', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary"
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-2 relative client-search-container">
                <Label className="text-dark-primary flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" /> Dueño / Cliente *
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar por cédula o nombre..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-10"
                    readOnly={readOnly}
                  />
                  {showResults && searchTerm.length > 0 && !readOnly && (
                    <div className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-color rounded-md shadow-xl max-h-48 overflow-y-auto">
                      {filteredClientes.length > 0 ? (
                        filteredClientes.map(c => (
                          <div
                            key={c.id_cliente}
                            className="px-4 py-2 hover:bg-dark-hover cursor-pointer text-sm text-dark-primary border-b border-dark-color last:border-0"
                            onClick={() => {
                              handleChange('id_cliente', c.id_cliente);
                              setSearchTerm(c.nombre);
                              setShowResults(false);
                            }}
                          >
                            <div className="font-bold">{c.nombre}</div>
                            <div className="text-xs text-dark-secondary">Cédula: {c.cedula}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-dark-secondary italic">No se encontraron clientes</div>
                      )}
                    </div>
                  )}
                </div>
                {errors.id_cliente && <p className="text-red-400 text-xs">{errors.id_cliente}</p>}

                {/* Detalles del Cliente Seleccionado */}
                {selectedCliente && (
                  <div className="mt-2 p-3 bg-dark-hover/30 rounded-lg border border-dark-color/20 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-1 text-[11px] text-dark-secondary">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-dark-primary min-w-[60px]">Dirección:</span>
                        <span>{selectedCliente.direccion || 'No registrada'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-dark-primary min-w-[60px]">Teléfono:</span>
                        <span>{selectedCliente.telefono || 'No registrado'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información Clínica */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2 uppercase tracking-wider">
                <HeartPulse className="w-4 h-4 text-red-400" />
                Datos Clínicos
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-dark-primary">Edad (años)</Label>
                  <Input
                    type="number"
                    value={formData.edad ?? ''}
                    onChange={(e) => handleChange('edad', e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-dark-hover border-dark-color text-dark-primary"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-dark-primary">Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.peso ?? ''}
                    onChange={(e) => handleChange('peso', e.target.value ? parseFloat(e.target.value) : null)}
                    className="bg-dark-hover border-dark-color text-dark-primary"
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-dark-primary italic text-[11px] flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" /> Fecha de Nacimiento
                </Label>
                <Input
                  type="date"
                  value={formData.fecha_nacimiento ?? ''}
                  onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary"
                  readOnly={readOnly}
                />
              </div>

              <div className="space-y-4 p-4 bg-dark-hover/50 rounded-2xl border border-dark-color">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-dark-primary font-bold uppercase text-[10px] tracking-widest">¿Tiene Vacunas?</Label>
                    <p className="text-[10px] text-dark-secondary">Indica si el paciente cuenta con esquema de vacunación.</p>
                  </div>
                  <Switch
                    checked={tieneVacunas}
                    onCheckedChange={(checked) => {
                      setTieneVacunas(checked);
                      if (!checked) {
                        handleChange('vacunas', '');
                        handleChange('fecha_ultima_vacuna', '');
                      }
                    }}
                    disabled={readOnly}
                  />
                </div>

                {tieneVacunas && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label className="text-dark-primary text-[10px] uppercase font-black">¿Cuáles?</Label>
                      <Input
                        value={formData.vacunas ?? ''}
                        onChange={(e) => handleChange('vacunas', e.target.value)}
                        className="bg-dark-card border-dark-color text-dark-primary h-9"
                        placeholder="Ej: Triple Felina, Rabia..."
                        readOnly={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-dark-primary text-[10px] uppercase font-black flex items-center gap-1.5">
                        <Syringe className="w-3.5 h-3.5 text-emerald-400" /> Fecha Última Vacuna
                      </Label>
                      <Input
                        type="date"
                        value={formData.fecha_ultima_vacuna ?? ''}
                        onChange={(e) => handleChange('fecha_ultima_vacuna', e.target.value)}
                        className="bg-dark-card border-dark-color text-dark-primary h-9"
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-color">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-dark-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Fecha Desparasitación
                </Label>
                <Input
                  type="date"
                  value={formData.fecha_desparasitacion ?? ''}
                  onChange={(e) => handleChange('fecha_desparasitacion', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary"
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-dark-primary">Observaciones / Alergias</Label>
            <textarea
              value={formData.observaciones ?? ''}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              className="w-full min-h-[100px] p-3 bg-dark-hover border border-dark-color rounded-md text-sm text-dark-primary focus:border-dark-cta outline-none"
              readOnly={readOnly}
              placeholder="Notas importantes sobre el paciente..."
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
              >
                {loading ? 'Guardando...' : mascota ? 'Actualizar y Otro' : 'Registrar y Otro'}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-dark-color text-dark-secondary hover:bg-dark-hover"
              >
                Cerrar
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-dark-cta text-white hover:bg-blue-600 px-8"
                >
                  {loading ? 'Guardando...' : mascota ? 'Actualizar' : 'Registrar Mascota'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
