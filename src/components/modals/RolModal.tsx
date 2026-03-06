import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Shield, Lock } from 'lucide-react';

interface Rol {
  id: string;
  nombre: string;
  modulos: string[];
}

interface RolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rol: Omit<Rol, 'id'>) => Promise<any>;
  rol?: Rol | null;
  loading?: boolean;
}

const rolesDisponibles = [
  { value: 'Administrador', label: 'Administrador', description: 'Acceso completo al sistema' },
  { value: 'Cliente', label: 'Cliente', description: 'Acceso limitado a información personal' },
  { value: 'Veterinario', label: 'Veterinario', description: 'Operaciones diarias y asistencia médica' }
];

const modulosDisponibles = [
  'Dashboard', 'Ventas', 'Clientes', 'Agendamiento',
  'Mascotas', 'Historial Mascotas', 'Horario', 'Servicios',
  'Empleados', 'Roles'
];

const defaultModulosPorRol: Record<string, string[]> = {
  'Administrador': [...modulosDisponibles],
  'Veterinario': ['Dashboard', 'Ventas', 'Clientes', 'Agendamiento', 'Mascotas', 'Historial Mascotas', 'Horario', 'Servicios'],
  'Cliente': ['Dashboard', 'Agendamiento', 'Mascotas', 'Historial Mascotas']
};

export function RolModal({ isOpen, onClose, onSubmit, rol, loading }: RolModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    modulos: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rol) {
      setFormData({
        nombre: rol.nombre,
        modulos: rol.modulos || []
      });
    } else {
      setFormData({
        nombre: '',
        modulos: []
      });
    }
    setErrors({});
  }, [rol, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre) newErrors.nombre = 'Debe seleccionar un tipo de rol';

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

  const handleChange = (field: string, value: any) => {
    if (field === 'nombre' && !rol) {
      // Auto-asignar módulos predeterminados al crear nuevo rol
      setFormData(prev => ({
        ...prev,
        [field]: value,
        modulos: defaultModulosPorRol[value] || []
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleModuloToggle = (modulo: string) => {
    setFormData(prev => ({
      ...prev,
      modulos: prev.modulos.includes(modulo)
        ? prev.modulos.filter(m => m !== modulo)
        : [...prev.modulos, modulo]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            {rol ? 'Editar Rol' : 'Nuevo Rol'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            {rol ? 'Actualiza la información del rol' : 'Define un nuevo rol con sus permisos correspondientes'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-dark-primary">Tipo de Rol *</Label>
              <Select
                value={formData.nombre}
                onValueChange={(value: string) => handleChange('nombre', value)}
                disabled={!!rol} // Deshabilitar edición en modo editar
              >
                <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta">
                  <SelectValue placeholder="Seleccionar tipo de rol..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-color">
                  {rolesDisponibles.map((rolOption) => (
                    <SelectItem key={rolOption.value} value={rolOption.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{rolOption.label}</span>
                        <span className="text-sm text-dark-secondary">{rolOption.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nombre && <p className="text-red-400 text-sm">{errors.nombre}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Módulos ({formData.modulos.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modulosDisponibles.map((modulo) => (
                <div key={modulo} className="flex items-center space-x-3 p-3 bg-dark-hover rounded-lg border border-dark-color">
                  <Switch
                    checked={formData.modulos.includes(modulo)}
                    onCheckedChange={() => handleModuloToggle(modulo)}
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-wider w-20 ${formData.modulos.includes(modulo) ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                    {formData.modulos.includes(modulo) ? 'Habilitado' : 'Inactivo'}
                  </span>
                  <Label className="text-dark-primary text-sm font-medium flex-1">
                    {modulo}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-dark-color text-dark-secondary hover:bg-dark-hover"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-dark-cta text-white hover:bg-blue-600"
            >
              {loading ? 'Guardando...' : rol ? 'Actualizar' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
