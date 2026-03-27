import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Cliente, useClientes } from '../hooks/useClientes';
import { User, Phone, Mail, Dog, MapPin, FileText } from 'lucide-react';
import { useMascotas } from '../../mascotas/hooks/useMascotas';

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
      newErrors.nombre = 'El nombre es obligatorio';
    } else {
      // Verificar nombre duplicado (ignorar el cliente actual en edición)
      const nombreDuplicado = clientes.some(
        c => c.nombre.toLowerCase().trim() === formData.nombre.toLowerCase().trim()
          && c.id_cliente !== cliente?.id_cliente
      );
      if (nombreDuplicado) newErrors.nombre = 'Ya existe un cliente con ese nombre.';
    }

    if (!formData.tipo_documento) newErrors.tipo_documento = 'El tipo de documento es obligatorio';
    if (!formData.cedula.trim()) newErrors.cedula = 'El documento es obligatorio';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria';

    if (!formData.correo.trim()) {
      newErrors.correo = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      newErrors.correo = 'El email no es válido';
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
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="NIT">NIT</option>
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
                  className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.cedula ? 'border-red-500' : ''} ${cliente ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="Número de documento"
                  readOnly={readOnly || !!cliente}
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
                  className={`pl-10 bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${errors.correo ? 'border-red-500' : ''} ${cliente ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="ejemplo@correo.com"
                  readOnly={readOnly || !!cliente}
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

            {readOnly && (
              <div className="pt-4 border-t border-dark-color space-y-4">
                <h3 className="text-sm font-bold text-dark-primary flex items-center gap-2">
                  <Dog className="w-4 h-4 text-indigo-400" />
                  Mascotas asociadas
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {clienteMascotas.length > 0 ? (
                    clienteMascotas.map(m => (
                      <div key={m.id_mascota} className="flex items-center justify-between p-3 bg-dark-hover/30 rounded-xl border border-dark-color">
                        <div className="flex items-center gap-3">
                          <Dog className="w-4 h-4 text-indigo-400 opacity-70" />
                          <div>
                            <p className="text-xs font-bold text-dark-primary">{m.nombre}</p>
                            <p className="text-[10px] text-dark-secondary italic">{m.especie} {m.raza ? `· ${m.raza}` : ''}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed border-dark-color rounded-xl">
                      <p className="text-[10px] text-dark-secondary">No hay mascotas registradas</p>
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
