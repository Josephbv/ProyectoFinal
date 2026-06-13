import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Cliente, useClientes } from '../hooks/useClientes';
import { User, Phone, Mail, Dog, MapPin, FileText } from 'lucide-react';
import { useMascotas } from '../../mascotas/hooks/useMascotas';
import { esEmailValido, soloLetras, esTelefonoValido, esCedulaValida, esNombreCompletoValido } from '../../../shared/utils/validators';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cliente: Omit<Cliente, 'id_cliente' | 'mascotas'>) => Promise<any>;
  cliente?: Cliente | null;
  loading?: boolean;
  readOnly?: boolean;
}

export function ClienteModal({ isOpen, onClose, onSubmit, cliente, loading, readOnly = false }: ClienteModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_documento: 'Cédula de Ciudadanía',
    cedula: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  const { mascotas: todasLasMascotas } = useMascotas();
  const { clientes } = useClientes();
  const clienteMascotas = todasLasMascotas.filter(m => m.id_cliente === cliente?.id_cliente);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        tipo_documento: cliente.tipo_documento || 'Cédula de Ciudadanía',
        cedula: cliente.cedula || '',
        telefono: cliente.telefono || '',
        correo: cliente.correo || '',
        direccion: cliente.direccion || ''
      });
    } else {
      setFormData({
        nombre: '',
        tipo_documento: 'Cédula de Ciudadanía',
        cedula: '',
        telefono: '',
        correo: '',
        direccion: ''
      });
    }
    setErrors({});
  }, [cliente, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
    } else if (!esNombreCompletoValido(formData.nombre)) {
      newErrors.nombre = 'Debes ingresar tu nombre y apellido completos (solo letras y espacios).';
    } else {
      const nombreDuplicado = clientes.some(
        c => c.nombre.toLowerCase().trim() === formData.nombre.toLowerCase().trim()
          && c.id_cliente !== cliente?.id_cliente
      );
      if (nombreDuplicado) newErrors.nombre = 'Ya existe un cliente con este nombre exacto.';
    }

    if (!formData.tipo_documento) newErrors.tipo_documento = 'Selecciona un tipo de documento.';

    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La identificación es obligatoria.';
    } else if (!esCedulaValida(formData.cedula)) {
      newErrors.cedula = 'Identificación no válida (Debe tener entre 6 y 15 dígitos numéricos sin más de 3 números repetidos continuamente).';
    } else {
      const cedulaDuplicada = clientes.some(
        c => c.cedula === formData.cedula.trim() && c.id_cliente !== cliente?.id_cliente
      );
      if (cedulaDuplicada) newErrors.cedula = 'Este documento ya está registrado en otro cliente.';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio.';
    } else if (!esTelefonoValido(formData.telefono)) {
      newErrors.telefono = 'Teléfono inválido (Debe empezar con 3 y tener exactamente 10 dígitos).';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es obligatoria.';
    } else {
      const addressPrefixRegex = /^(calle|carrera|cra|cl|avenida|av|diagonal|dg|transversal|transv|tv|autopista|circular|via|vía)\b/i;
      if (!addressPrefixRegex.test(formData.direccion.trim())) {
        newErrors.direccion = 'La dirección debe comenzar con una vía válida (Ej: Calle, Carrera, Avenida, Diagonal, Transversal, etc.).';
      }
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo electrónico es obligatorio.';
    } else if (!esEmailValido(formData.correo)) {
      newErrors.correo = 'El correo no tiene un formato válido (ej: usuario@correo.com).';
    } else {
      const correoDuplicado = clientes.some(
        c => c.correo?.toLowerCase().trim() === formData.correo.toLowerCase().trim() && c.id_cliente !== cliente?.id_cliente
      );
      if (correoDuplicado) newErrors.correo = 'Este correo ya está en uso por otro cliente.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await onSubmit(formData);
    if (result.success) {
      onClose();
    } else if (result.error) {
      // Mostrar el mensaje de error del backend (ej: cédula o correo duplicado)
      const msg: string = result.error || '';
      if (msg.toLowerCase().includes('documento') || msg.toLowerCase().includes('cédula') || msg.toLowerCase().includes('cedula')) {
        setErrors(prev => ({ ...prev, cedula: msg }));
      } else if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email') || msg.toLowerCase().includes('mail')) {
        setErrors(prev => ({ ...prev, correo: msg }));
      }
      // Siempre mostrar un toast con el mensaje
      toast.error(msg);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            {readOnly ? 'Detalles del Cliente' : cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            {readOnly ? 'Información completa del cliente' : 'Los campos marcados con * son obligatorios'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-dark-primary flex items-center gap-1">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.nombre ? 'border-red-500' : ''}`}
                placeholder="Nombre completo"
                readOnly={readOnly}
              />
              {errors.nombre && <p className="text-red-400 text-xs">{errors.nombre}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo Documento */}
              <div className="space-y-2">
                <Label htmlFor="tipo_documento" className="text-dark-primary flex items-center gap-1">
                  Tipo Doc. <span className="text-red-500">*</span>
                </Label>
                <select
                  id="tipo_documento"
                  value={formData.tipo_documento}
                  onChange={(e) => handleChange('tipo_documento', e.target.value)}
                  disabled={readOnly || !!cliente}
                  className={`w-full h-10 px-3 py-2 bg-dark-hover border border-dark-color rounded-md text-sm text-dark-primary focus:border-dark-cta outline-none appearance-none ${cliente ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <option value="Cédula de Ciudadanía">C.C.</option>
                  <option value="Cédula de Extranjería">C.E.</option>
                </select>
                {errors.tipo_documento && <p className="text-red-400 text-xs">{errors.tipo_documento}</p>}
              </div>

              {/* Documento */}
              <div className="space-y-2">
                <Label htmlFor="cedula" className="text-dark-primary flex items-center gap-1">
                  Documento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => handleChange('cedula', e.target.value)}
                  className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.cedula ? 'border-red-500' : ''}`}
                  placeholder="Número de documento"
                  readOnly={readOnly}
                />
                {errors.cedula && <p className="text-red-400 text-xs">{errors.cedula}</p>}
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-dark-primary flex items-center gap-1">
                Teléfono <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-secondary" />
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className={`pl-10 bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.telefono ? 'border-red-500' : ''}`}
                  placeholder="300-123-4567"
                  readOnly={readOnly}
                />
              </div>
              {errors.telefono && <p className="text-red-400 text-xs">{errors.telefono}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="correo" className="text-dark-primary flex items-center gap-1">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-secondary" />
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleChange('correo', e.target.value)}
                  className={`pl-10 bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.correo ? 'border-red-500' : ''}`}
                  placeholder="ejemplo@correo.com"
                  readOnly={readOnly}
                />
              </div>
              {errors.correo && <p className="text-red-400 text-xs">{errors.correo}</p>}
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion" className="text-dark-primary flex items-center gap-1">
                Dirección <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-secondary" />
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  className={`pl-10 bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.direccion ? 'border-red-500' : ''}`}
                  placeholder="Calle 123 # 45 - 67"
                  readOnly={readOnly}
                />
              </div>
              {errors.direccion && <p className="text-red-400 text-xs">{errors.direccion}</p>}
            </div>

            {/* Sección Espejo: Pacientes Vinculados */}
            {cliente && (
              <div className="space-y-4 pt-6 mt-2 border-t border-dark-color/50 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <h3 className="text-xs font-black text-dark-primary uppercase tracking-[0.2em]">Pacientes Vinculados</h3>
                    </div>
                    <p className="text-[10px] text-dark-secondary opacity-60">Sincronización automática con base de datos clínica</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase">
                    {clienteMascotas.length} {clienteMascotas.length === 1 ? 'Mascota' : 'Mascotas'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {clienteMascotas.length > 0 ? (
                    clienteMascotas.map((m, index) => (
                      <div
                        key={m.id_mascota}
                        className="group relative flex items-center justify-between p-4 bg-dark-hover/30 border border-dark-color/40 rounded-2xl hover:bg-dark-hover/60 hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02] cursor-default"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-2xl group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all">
                            {m.especie?.toLowerCase().includes('perro') ? '🐕' : m.especie?.toLowerCase().includes('gato') ? '🐈' : '🐾'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-dark-primary group-hover:text-blue-400 transition-colors uppercase tracking-tight">{m.nombre}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-dark-secondary bg-dark-bg px-2 py-0.5 rounded-md border border-dark-color/50">{m.especie}</span>
                              <span className="text-[10px] text-dark-secondary italic">{m.raza || 'Raza no definida'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-black text-dark-secondary opacity-40 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">ID: #{m.id_mascota.toString().padStart(4, '0')}</span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            Activo
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-dark-color/30 rounded-[2rem] bg-dark-hover/10">
                      <div className="p-3 bg-dark-hover rounded-full mb-3">
                        <Dog className="w-6 h-6 text-dark-secondary opacity-20" />
                      </div>
                      <p className="text-[11px] font-bold text-dark-secondary uppercase tracking-widest opacity-40">Sin mascotas registradas</p>
                      <p className="text-[9px] text-dark-secondary/60 mt-1">El historial clínico aparecerá aquí automáticamente</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <DialogFooter className="gap-2 pt-4">
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
                {loading ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear Cliente'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
