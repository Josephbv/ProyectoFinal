import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Shield, Lock, Check } from 'lucide-react';

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

const SYSTEM_ROLES = ['administrador', 'veterinario', 'cliente'];

export function RolModal({ isOpen, onClose, onSubmit, rol, loading, roles = [] }: RolModalProps) {
  const [nombre, setNombre] = useState('');
  const [modulos, setModulos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initialized = useRef(false);

  // Determinar si el rol que se está editando es un rol del sistema
  const isSystemRole = !!rol && SYSTEM_ROLES.includes((rol.nombre || '').toLowerCase().trim());

  // Solo inicializar cuando el modal abre por primera vez
  useEffect(() => {
    if (isOpen && !initialized.current) {
      setNombre(rol?.nombre || '');
      setModulos(rol?.modulos ? [...rol.modulos] : []);
      setErrors({});
      initialized.current = true;
    }
    if (!isOpen) {
      initialized.current = false;
    }
  }, [isOpen]);

  const toggleModulo = (modulo: string) => {
    setModulos(prev =>
      prev.includes(modulo)
        ? prev.filter(m => m !== modulo)
        : [...prev, modulo]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del rol es obligatorio';
    } else if (nombre.trim().length > 15) {
      newErrors.nombre = 'El nombre del rol no puede exceder los 15 caracteres.';
    } else if (!rol) {
      // Crear nuevo rol: validar nombres reservados y duplicados
      if (SYSTEM_ROLES.includes(nombre.toLowerCase().trim())) {
        newErrors.nombre = 'Este es un nombre reservado para el sistema.';
      } else {
        const existeRole = roles.some(r =>
          r.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
        );
        if (existeRole) newErrors.nombre = 'Ya existe otro rol con este nombre.';
      }
    } else if (!isSystemRole) {
      // Editar rol personalizado: validar que el nuevo nombre no sea reservado ni duplique otro
      if (SYSTEM_ROLES.includes(nombre.toLowerCase().trim())) {
        newErrors.nombre = 'Este es un nombre reservado para el sistema.';
      } else {
        const existeRole = roles.some(r =>
          r.id !== rol.id &&
          r.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
        );
        if (existeRole) newErrors.nombre = 'Ya existe otro rol con este nombre.';
      }
    }

    if (modulos.length === 0) {
      newErrors.modulos = 'Debe asignar por lo menos un (1) módulo al rol.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const result = await onSubmit({ nombre, modulos });
    if (result?.success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            {rol ? 'Editar Rol' : 'Nuevo Rol'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            {rol
              ? (isSystemRole
                  ? 'Los roles del sistema no pueden cambiar de nombre, solo sus módulos'
                  : 'Puedes editar el nombre y los módulos de este rol')
              : 'Define un nuevo rol con sus permisos correspondientes'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-dark-primary">Nombre del Rol *</Label>
            <Input
              id="nombre"
              placeholder="Ej. Recepcionista, Ayudante, etc..."
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors(prev => ({ ...prev, nombre: '' }));
              }}
              maxLength={15}
              disabled={isSystemRole}
              className={`bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta ${
                isSystemRole ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
            {errors.nombre && <p className="text-red-400 text-sm">{errors.nombre}</p>}
            {isSystemRole && (
              <p className="text-xs text-amber-400/80 italic flex items-center gap-1">
                🔒 El nombre de los roles del sistema (Administrador, Veterinario, Cliente) no puede modificarse.
              </p>
            )}
            {!rol && <p className="text-xs text-dark-secondary italic">Nota: No se pueden crear roles con los nombres reservados (Administrador, Cliente, Veterinario).</p>}
          </div>

          {/* Módulos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Módulos ({modulos.length})
            </h3>
            {errors.modulos && <p className="text-red-400 text-sm">{errors.modulos}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {modulosDisponibles.map((modulo) => {
                const isSelected = modulos.includes(modulo);
                return (
                  <button
                    key={modulo}
                    type="button"
                    onClick={() => toggleModulo(modulo)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all duration-150 ${isSelected
                      ? 'bg-blue-500/20 border-blue-500 text-dark-primary'
                      : 'bg-dark-hover border-dark-color text-dark-secondary hover:border-blue-400/40'
                      }`}
                  >
                    <span className="text-sm font-semibold">{modulo}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-dark-secondary'
                      }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
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
