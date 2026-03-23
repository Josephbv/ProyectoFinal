import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Switch } from '../../../shared/components/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/select';
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
  roles?: Rol[];
}

const modulosDisponibles = [
  'Dashboard', 'Ventas', 'Clientes', 'Agendamiento',
  'Mascotas', 'Historial Mascotas', 'Horario', 'Servicios',
  'Empleados', 'Roles'
];

export function RolModal({ isOpen, onClose, onSubmit, rol, loading, roles = [] }: RolModalProps) {
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

    if (!formData.nombre) {
      newErrors.nombre = 'El nombre del rol es obligatorio';
    } else {
      const coreRoles = ['administrador', 'cliente', 'veterinario'];
      if (coreRoles.includes(formData.nombre.toLowerCase().trim())) {
        newErrors.nombre = 'Este es un nombre reservado para el sistema.';
      } else if (roles) {
        const existeRole = roles.some(r => r.nombre.toLowerCase().trim() === formData.nombre.toLowerCase().trim() && r.id !== rol?.id);
        if (existeRole) {
          newErrors.nombre = 'Ya existe otro rol con este nombre.';
        }
      }
    }

    if (formData.modulos.length === 0) {
      newErrors.modulos = 'Debe asignar por lo menos un (1) módulo al rol.';
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

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

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
              <Label htmlFor="nombre" className="text-dark-primary">Nombre del Rol *</Label>
              <Input
                id="nombre"
                placeholder="Ej. Recepcionista, Ayudante, etc..."
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                disabled={!!rol}
                className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
              />
              {errors.nombre && <p className="text-red-400 text-sm">{errors.nombre}</p>}
              {!rol && <p className="text-xs text-dark-secondary italic">Nota: No se pueden crear roles con los nombres reservados (Administrador, Cliente, Veterinario).</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Módulos ({formData.modulos.length})
              </h3>
            </div>
            {errors.modulos && <p className="text-red-400 text-sm">{errors.modulos}</p>}
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
