import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../shared/components/dialog";
import { Button } from "../../../shared/components/button";
import { Input } from "../../../shared/components/input";
import { Label } from "../../../shared/components/label";
import { Switch } from "../../../shared/components/switch";
import {
  Dog,
  Syringe,
  Calendar,
  Trash2,
  Plus,
  ClipboardList,
  HeartPulse,
  User,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Mascota } from '../hooks/useMascotas';
import { useClientes } from '../../clientes/hooks/useClientes';

interface MascotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Mascota>, resetAfter?: boolean) => Promise<any>;
  mascota?: Mascota | null;
  readOnly?: boolean;
  loading?: boolean;
  initialClientId?: number;
}

export const MascotaModal: React.FC<MascotaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mascota,
  readOnly = false,
  loading: externalLoading,
  initialClientId
}) => {
  const { clientes } = useClientes();
  const [loading, setLoading] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [tieneVacunas, setTieneVacunas] = useState(false);
  const [listaVacunas, setListaVacunas] = useState<Array<{ nombre: string, fecha: string }>>([]);
  const [currentVacuna, setCurrentVacuna] = useState({ nombre: '', fecha: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (mascota) {
      setFormData(mascota);
      setSearchTerm(mascota.cliente?.nombre || '');

      // Parsear vacunas JSON
      if (mascota.vacunas) {
        try {
          const parsed = JSON.parse(mascota.vacunas);
          if (Array.isArray(parsed)) {
            setListaVacunas(parsed);
            setTieneVacunas(parsed.length > 0);
          } else {
            setListaVacunas([]);
            setTieneVacunas(false);
          }
        } catch (e) {
          // Retrocompatibilidad con strings simples
          if (mascota.vacunas.trim()) {
            setListaVacunas([{ nombre: mascota.vacunas, fecha: mascota.fecha_ultima_vacuna || '' }]);
            setTieneVacunas(true);
          } else {
            setListaVacunas([]);
            setTieneVacunas(false);
          }
        }
      } else {
        setListaVacunas([]);
        setTieneVacunas(false);
      }
    } else {
      let defaultSearchTerm = '';
      if (initialClientId && clientes && clientes.length > 0) {
        const c = clientes.find((cli) => cli.id_cliente === initialClientId);
        if (c) defaultSearchTerm = c.nombre;
      }

      setFormData({
        nombre: '', especie: '', raza: '', id_cliente: initialClientId || 0,
        edad: null, fecha_nacimiento: '', peso: null, vacunas: '',
        fecha_ultima_vacuna: '', fecha_desparasitacion: '', observaciones: '', foto: ''
      });
      setSearchTerm(defaultSearchTerm);
      setListaVacunas([]);
      setTieneVacunas(false);
    }
  }, [mascota, isOpen, initialClientId, clientes]);

  const isLoading = externalLoading || loading;

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cedula?.includes(searchTerm)
  );

  const selectedCliente = clientes.find(c => c.id_cliente === formData.id_cliente);

  const handleSubmit = async (e: React.FormEvent, resetAfter = false) => {
    e.preventDefault();
    if (!formData.nombre || !formData.id_cliente) {
      setErrors({
        nombre: !formData.nombre ? 'El nombre es requerido' : '',
        id_cliente: !formData.id_cliente ? 'El cliente es requerido' : ''
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        vacunas: JSON.stringify(listaVacunas),
        fecha_ultima_vacuna: listaVacunas.length > 0 ? listaVacunas[listaVacunas.length - 1].fecha : null
      };
      await onSubmit(dataToSend, resetAfter);
      if (resetAfter) {
        setFormData(prev => ({
          nombre: '',
          especie: '',
          raza: '',
          id_cliente: prev.id_cliente,
          id_mascota: undefined,
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
        setListaVacunas([]);
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Mascota, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color border-opacity-50">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Identificación y Responsable */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2 uppercase tracking-wider">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  Identificación
                </h3>

                <div className="space-y-2">
                  <Label className="text-dark-primary font-medium">Nombre de la Mascota *</Label>
                  <Input
                    value={formData.nombre ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nombre', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-10"
                    readOnly={readOnly}
                  />
                  {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-dark-primary font-medium">Especie *</Label>
                    <Input
                      value={formData.especie ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('especie', e.target.value)}
                      className="bg-dark-hover border-dark-color text-dark-primary h-10"
                      placeholder="Ej: Perro, Gato..."
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-dark-primary font-medium">Raza</Label>
                    <Input
                      value={formData.raza ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('raza', e.target.value)}
                      className="bg-dark-hover border-dark-color text-dark-primary h-10"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-indigo-400" />
                  Responsable
                </h3>

                <div className="space-y-2 relative client-search-container">
                  <Label className="text-dark-primary font-medium">Dueño / Cliente *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Buscar por cédula o nombre..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSearchTerm(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      className="bg-dark-hover border-dark-color text-dark-primary h-10"
                      readOnly={readOnly}
                    />
                    {showResults && searchTerm.length > 0 && !readOnly && (
                      <div className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-color rounded-md shadow-2xl max-h-48 overflow-y-auto">
                        {filteredClientes.length > 0 ? (
                          filteredClientes.map(c => (
                            <div
                              key={c.id_cliente}
                              className="px-4 py-2 hover:bg-dark-hover cursor-pointer text-sm text-dark-primary border-b border-dark-color/30 last:border-0"
                              onClick={() => {
                                handleChange('id_cliente', c.id_cliente);
                                setSearchTerm(c.nombre);
                                setShowResults(false);
                              }}
                            >
                              <div className="font-bold">{c.nombre}</div>
                              <div className="text-xs text-dark-secondary italic">Cédula: {c.cedula}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-dark-secondary italic text-center">No se encontraron clientes</div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.id_cliente && <p className="text-red-400 text-xs mt-1">{errors.id_cliente}</p>}
                </div>

                {selectedCliente && (
                  <div className="p-3 bg-dark-hover/40 rounded-xl border border-dark-color/30 flex flex-col gap-2 shadow-inner">
                    <div className="text-xs flex items-center gap-2">
                      <span className="text-dark-secondary font-bold min-w-[60px]">Dirección:</span>
                      <span className="text-dark-primary">{selectedCliente.direccion || 'No registrada'}</span>
                    </div>
                    <div className="text-xs flex items-center gap-2">
                      <span className="text-dark-secondary font-bold min-w-[60px]">Teléfono:</span>
                      <span className="text-dark-primary">{selectedCliente.telefono || 'No registrado'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Datos Clínica y Seguimientos */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2 uppercase tracking-wider">
                  <HeartPulse className="w-4 h-4 text-red-400" />
                  Información Clínica
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-dark-primary font-medium">Edad (años)</Label>
                    <Input
                      type="number"
                      value={formData.edad ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('edad', e.target.value ? parseInt(e.target.value) : null)}
                      className="bg-dark-hover border-dark-color text-dark-primary h-10"
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-dark-primary font-medium">Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.peso ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('peso', e.target.value ? parseFloat(e.target.value) : null)}
                      className="bg-dark-hover border-dark-color text-dark-primary h-10"
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-primary font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-pink-400" /> Fecha de Nacimiento
                  </Label>
                  <Input
                    type="date"
                    value={formData.fecha_nacimiento ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('fecha_nacimiento', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-10"
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Seguimientos
                </h3>

                <div className="space-y-2">
                  <Label className="text-dark-primary font-medium">Última Desparasitación</Label>
                  <Input
                    type="date"
                    value={formData.fecha_desparasitacion ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('fecha_desparasitacion', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-10"
                    readOnly={readOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-dark-primary font-medium">Observaciones / Alergias</Label>
                  <textarea
                    value={formData.observaciones ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('observaciones', e.target.value)}
                    className="w-full min-h-[90px] p-3 bg-dark-hover border border-dark-color rounded-xl text-sm text-dark-primary focus:border-dark-cta outline-none resize-none"
                    readOnly={readOnly}
                    placeholder="Notas importantes sobre el paciente..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección Inferior: Vacunación (Ancho Completo) */}
          <div className="pt-8 border-t border-dark-color/30">
            <div className="flex items-center gap-2 mb-6">
              <Syringe className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-dark-primary uppercase tracking-widest">Esquema de Vacunación</h3>
            </div>

            <div className="p-6 bg-dark-hover/20 rounded-2xl border border-dark-color border-opacity-40 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <Label className="text-dark-primary font-bold text-base">PLAN DE VACUNACIÓN</Label>
                  <p className="text-xs text-dark-secondary italic">Activa para gestionar el historial de dosis aplicadas.</p>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-3 bg-white dark:bg-dark-card p-1.5 px-3 rounded-full border border-blue-200 dark:border-blue-900 shadow-sm">
                    <span className={`text-[9px] font-black tracking-tighter ${tieneVacunas ? 'text-blue-600' : 'text-gray-400'}`}>
                      {tieneVacunas ? 'ACTIVADO' : 'DESACTIVADO'}
                    </span>
                    <Switch
                      checked={tieneVacunas}
                      className="bg-gray-300 data-[state=checked]:bg-blue-600 border-2 border-white shadow-md scale-125"
                      onCheckedChange={(checked: boolean) => {
                        setTieneVacunas(checked);
                        if (!checked) {
                          handleChange('vacunas', '');
                          handleChange('fecha_ultima_vacuna', '');
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {tieneVacunas && !readOnly && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300 items-end">
                  <div className="md:col-span-5 space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-blue-700/70 ml-1">Nombre de la Vacuna</Label>
                    <Input
                      placeholder="Ej: Triple Felina, Rabia..."
                      value={currentVacuna.nombre}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentVacuna(prev => ({ ...prev, nombre: e.target.value }))}
                      className="bg-white dark:bg-dark-hover border-blue-200 dark:border-dark-color text-dark-primary h-10 text-sm shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-blue-700/70 flex items-center gap-1.5 ml-1">
                      <Calendar className="w-3 h-3" /> Fecha
                    </Label>
                    <Input
                      type="date"
                      value={currentVacuna.fecha}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentVacuna(prev => ({ ...prev, fecha: e.target.value }))}
                      className="bg-white dark:bg-dark-hover border-blue-200 dark:border-dark-color text-dark-primary h-10 text-sm shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Button
                      type="button"
                      onClick={() => {
                        if (currentVacuna.nombre.trim()) {
                          setListaVacunas(prev => [...prev, currentVacuna]);
                          setCurrentVacuna({ nombre: '', fecha: new Date().toISOString().split('T')[0] });
                        }
                      }}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 h-10 font-bold text-[10px] tracking-wide flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                      <Plus className="w-4 h-4" /> AGREGAR DOSIS
                    </Button>
                  </div>
                </div>
              )}

              {!tieneVacunas && (
                <div className="py-10 flex flex-col items-center justify-center border border-dashed border-dark-color/50 rounded-2xl opacity-60">
                  <Syringe className="w-10 h-10 text-dark-secondary mb-3" />
                  <p className="text-sm text-dark-secondary italic">Activa el interruptor para agregar vacunas al paciente.</p>
                </div>
              )}
            </div>
          </div>

          {/* Historial de Vacunación - Full Width Grid */}
          {tieneVacunas && listaVacunas.length > 0 && (
            <div className="py-8 border-t border-dark-color/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h3 className="text-xs font-black text-dark-secondary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Historial de Registro
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                {listaVacunas.map((v, index) => (
                  <div key={index} className="flex flex-col p-3 bg-dark-hover/30 border border-dark-color/20 rounded-xl group hover:border-emerald-500/40 transition-all relative">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-dark-primary truncate leading-tight" title={v.nombre}>{v.nombre}</span>
                        <span className="text-[10px] text-dark-secondary flex items-center gap-1.5 mt-2 font-medium">
                          <Calendar className="w-3 h-3 text-emerald-500/50" /> {v.fecha}
                        </span>
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setListaVacunas(prev => prev.filter((_, i) => i !== index))}
                          className="p-1.5 text-dark-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-3 border-t border-dark-color/30 pt-8">
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isLoading}
                className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 h-11"
              >
                {isLoading ? 'Guardando...' : mascota ? 'Actualizar y Seguir' : 'Registrar y Seguir'}
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-dark-color text-dark-secondary hover:bg-dark-hover h-11 px-6"
              >
                Cerrar
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-dark-cta text-white hover:bg-blue-600 h-11 px-10 font-bold"
                >
                  {isLoading ? 'Guardando...' : mascota ? 'Actualizar' : 'Registrar Mascota'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
