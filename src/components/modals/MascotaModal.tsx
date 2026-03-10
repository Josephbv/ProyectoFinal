import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
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
import { useClientes } from '../hooks/useClientes';

interface MascotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Mascota>, resetAfter?: boolean) => Promise<void>;
  mascota?: Mascota | null;
  readOnly?: boolean;
  loading?: boolean;
}

export const MascotaModal: React.FC<MascotaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mascota,
  readOnly = false,
  loading: externalLoading
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
      setFormData({
        nombre: '', especie: '', raza: '', id_cliente: 0,
        edad: null, fecha_nacimiento: '', peso: null, vacunas: '',
        fecha_ultima_vacuna: '', fecha_desparasitacion: '', observaciones: '', foto: ''
      });
      setSearchTerm('');
      setListaVacunas([]);
      setTieneVacunas(false);
    }
  }, [mascota, isOpen]);

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
          {/* Sección 1: Datos Principales en 3 Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna 1: Identificación */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-dark-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                Identificación
              </h3>

              <div className="space-y-1">
                <Label className="text-[11px] text-dark-secondary font-bold">Nombre *</Label>
                <Input
                  value={formData.nombre ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nombre', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                  readOnly={readOnly}
                />
                {errors.nombre && <p className="text-red-400 text-[10px]">{errors.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-dark-secondary font-bold">Especie *</Label>
                  <Input
                    value={formData.especie ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('especie', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                    placeholder="Ej: Perro"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-dark-secondary font-bold">Raza</Label>
                  <Input
                    value={formData.raza ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('raza', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>

            {/* Columna 2: Info Clínica */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-dark-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                Info Clínica
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-dark-secondary font-bold">Edad</Label>
                  <Input
                    type="number"
                    value={formData.edad ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('edad', e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-dark-secondary font-bold">Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.peso ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('peso', e.target.value ? parseFloat(e.target.value) : null)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-dark-secondary font-bold flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-pink-400" /> Nacimiento
                </Label>
                <Input
                  type="date"
                  value={formData.fecha_nacimiento ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('fecha_nacimiento', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                  readOnly={readOnly}
                />
              </div>
            </div>

            {/* Columna 3: Dueño/Responsable */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-dark-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Responsable
              </h3>

              <div className="space-y-1 relative client-search-container">
                <Label className="text-[11px] text-dark-secondary font-bold">Dueño / Cliente *</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                    readOnly={readOnly}
                  />
                  {showResults && searchTerm.length > 0 && !readOnly && (
                    <div className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-color rounded-md shadow-xl max-h-40 overflow-y-auto">
                      {filteredClientes.length > 0 ? (
                        filteredClientes.map(c => (
                          <div
                            key={c.id_cliente}
                            className="px-3 py-1.5 hover:bg-dark-hover cursor-pointer text-xs text-dark-primary border-b border-dark-color last:border-0"
                            onClick={() => {
                              handleChange('id_cliente', c.id_cliente);
                              setSearchTerm(c.nombre);
                              setShowResults(false);
                            }}
                          >
                            <div className="font-bold">{c.nombre}</div>
                            <div className="text-[10px] text-dark-secondary">{c.cedula}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-[10px] text-dark-secondary italic text-center">Sin resultados</div>
                      )}
                    </div>
                  )}
                </div>
                {errors.id_cliente && <p className="text-red-400 text-[10px]">{errors.id_cliente}</p>}
              </div>

              {selectedCliente && (
                <div className="p-2 bg-dark-hover/30 rounded-lg border border-dark-color/20 flex flex-col gap-0.5">
                  <div className="text-[10px] flex items-center justify-between">
                    <span className="text-dark-secondary font-medium">Tlf:</span>
                    <span className="text-dark-primary font-bold">{selectedCliente.telefono || 'N/A'}</span>
                  </div>
                  <div className="text-[10px] flex flex-col">
                    <span className="text-dark-secondary font-medium">Dir:</span>
                    <span className="text-dark-primary truncate" title={selectedCliente.direccion || undefined}>{selectedCliente.direccion || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección 2: Vacunas y Notas en 2 Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 border-t border-dark-color/30">
            {/* Gestión de Vacunas (Ocupa 3 columnas) */}
            <div className="md:col-span-3 space-y-3">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Syringe className="w-3.5 h-3.5" />
                Esquema de Vacunación
              </h3>

              <div className="p-3 bg-dark-hover/40 rounded-xl border border-dark-color">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex flex-col">
                    <Label className="text-[11px] text-dark-primary font-bold">PLAN DE VACUNACIÓN</Label>
                    <span className="text-[9px] text-dark-secondary">Seguimiento de dosis aplicadas</span>
                  </div>
                  {!readOnly && (
                    <Switch
                      checked={tieneVacunas}
                      onCheckedChange={(checked: boolean) => {
                        setTieneVacunas(checked);
                        if (!checked) {
                          handleChange('vacunas', '');
                          handleChange('fecha_ultima_vacuna', '');
                        }
                      }}
                    />
                  )}
                </div>

                {tieneVacunas && !readOnly && (
                  <div className="flex flex-col sm:flex-row gap-2 bg-dark-card/50 p-2 rounded-lg border border-dark-color/50 animate-in fade-in zoom-in-95 duration-200">
                    <Input
                      placeholder="Nombre de vacuna"
                      value={currentVacuna.nombre}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentVacuna(prev => ({ ...prev, nombre: e.target.value }))}
                      className="bg-dark-hover border-dark-color text-dark-primary h-8 text-xs flex-1"
                    />
                    <Input
                      type="date"
                      value={currentVacuna.fecha}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentVacuna(prev => ({ ...prev, fecha: e.target.value }))}
                      className="bg-dark-hover border-dark-color text-dark-primary h-8 text-xs w-full sm:w-32"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (currentVacuna.nombre.trim()) {
                          setListaVacunas(prev => [...prev, currentVacuna]);
                          setCurrentVacuna({ nombre: '', fecha: new Date().toISOString().split('T')[0] });
                        }
                      }}
                      className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 h-8 px-3 text-[10px] font-bold"
                    >
                      <Plus className="w-3 h-3 mr-1" /> AGREGAR
                    </Button>
                  </div>
                )}

                {!tieneVacunas && (
                  <div className="h-16 flex items-center justify-center border border-dashed border-dark-color/50 rounded-lg">
                    <span className="text-[10px] text-dark-secondary italic">Sin vacunas registradas</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notas y Desparasitación (Ocupa 2 columnas) */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <ClipboardList className="w-3.5 h-3.5" />
                Otros Seguimientos
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-dark-secondary font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-purple-400" /> Desparasitación
                  </Label>
                  <Input
                    type="date"
                    value={formData.fecha_desparasitacion ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('fecha_desparasitacion', e.target.value)}
                    className="bg-dark-hover border-dark-color text-dark-primary h-8 text-sm"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-dark-secondary font-bold">Observaciones / Alergias</Label>
                  <textarea
                    value={formData.observaciones ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('observaciones', e.target.value)}
                    className="w-full min-h-[58px] p-2 bg-dark-hover border border-dark-color rounded-md text-xs text-dark-primary focus:border-dark-cta outline-none resize-none"
                    readOnly={readOnly}
                    placeholder="Notas importantes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Historial de Vacunación - Full Width Grid */}
          {tieneVacunas && listaVacunas.length > 0 && (
            <div className="py-6 border-t border-dark-color/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h3 className="text-[10px] font-black text-dark-secondary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Historial de Vacunación
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                {listaVacunas.map((v, index) => (
                  <div key={index} className="flex flex-col p-2 bg-dark-hover/30 border border-dark-color/20 rounded-lg group hover:border-emerald-500/40 transition-all relative">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-dark-primary truncate leading-tight" title={v.nombre}>{v.nombre}</span>
                        <span className="text-[9px] text-dark-secondary flex items-center gap-1 mt-1 font-medium">
                          <Calendar className="w-2.5 h-2.5 text-emerald-500/50" /> {v.fecha}
                        </span>
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setListaVacunas(prev => prev.filter((_, i) => i !== index))}
                          className="p-1 text-dark-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-dark-color/30 pt-6">
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isLoading}
                className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
              >
                {isLoading ? 'Guardando...' : mascota ? 'Actualizar y Otro' : 'Registrar y Otro'}
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
                  disabled={isLoading}
                  className="bg-dark-cta text-white hover:bg-blue-600 px-8"
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
