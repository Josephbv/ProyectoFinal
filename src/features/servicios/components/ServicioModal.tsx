import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/components/dialog';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { Textarea } from '../../../shared/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/select';
import { Servicio } from '../hooks/useServicios';
import { Wrench, Clock, DollarSign } from 'lucide-react';

interface ServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (servicio: Omit<Servicio, 'id' | 'fechaCreacion' | 'ultimaActualizacion'>) => Promise<any>;
  servicio?: Servicio | null;
  servicios: Servicio[];  // Array de todos los servicios para validación
  loading?: boolean;
}

export function ServicioModal({ isOpen, onClose, onSubmit, servicio, servicios, loading }: ServicioModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'consulta' as 'consulta' | 'cirugia' | 'vacunacion' | 'laboratorio' | 'estetica' | 'emergencia' | 'domicilio' | 'especializada',
    descripcion: '',
    precio: 0,
    costo: 0,
    equipoNecesario: [] as string[],
    materialesIncluidos: [] as string[],
    estado: 'activo' as 'activo' | 'inactivo' | 'mantenimiento',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (servicio) {
      setFormData({
        nombre: servicio.nombre_servicio || servicio.nombre || '',
        categoria: (servicio.categoria as any) || 'consulta',
        descripcion: servicio.descripcion || '',
        precio: servicio.precio || 0,
        costo: servicio.costo || 0,
        equipoNecesario: servicio.equipoNecesario || [],
        materialesIncluidos: servicio.materialesIncluidos || [],
        estado: (servicio.estado as any) || 'activo',
      });
    } else {
      setFormData({
        nombre: '',
        categoria: 'consulta',
        descripcion: '',
        precio: 0,
        costo: 0,
        equipoNecesario: [],
        materialesIncluidos: [],
        estado: 'activo',
      });
    }
    setErrors({});
  }, [servicio, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else {
      // Validar nombre duplicado (ignorando mayúsculas/minúsculas y espacios extra)
      const nombreIngresado = formData.nombre.trim().toLowerCase();
      const esDuplicado = servicios.some(s => {
        const nombreExistente = (s.nombre_servicio || s.nombre || '').trim().toLowerCase();
        // Si estamos editando, ignoramos el servicio actual
        if (servicio && s.id === servicio.id) return false;
        return nombreExistente === nombreIngresado;
      });

      if (esDuplicado) {
        newErrors.nombre = 'Ya existe un servicio con este nombre';
      }
    }

    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (formData.precio <= 0) newErrors.precio = 'El precio debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Adaptar campos para el backend que usa nombre_servicio
    const apiData = {
      ...formData,
      nombre_servicio: formData.nombre
    };

    const result = await onSubmit(apiData as any);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            {servicio ? 'Actualiza la información del servicio' : 'Completa los datos del nuevo servicio veterinario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Información Básica
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-dark-primary">Nombre del Servicio *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                placeholder="Ej: Consulta General"
              />
              {errors.nombre && <p className="text-red-400 text-sm">{errors.nombre}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-dark-primary">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                placeholder="Describe el servicio en detalle..."
                rows={3}
              />
              {errors.descripcion && <p className="text-red-400 text-sm">{errors.descripcion}</p>}
            </div>
          </div>

          {/* Precios y Configuración */}
          <div className="space-y-4 pt-2 border-t border-dark-color border-opacity-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="precio" className="text-dark-primary flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Precio *
                </Label>
                <Input
                  id="precio"
                  type="number"
                  value={formData.precio}
                  onChange={(e) => handleChange('precio', Number(e.target.value))}
                  className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta h-11"
                  placeholder="0"
                />
                {errors.precio && <p className="text-red-400 text-sm">{errors.precio}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado" className="text-dark-primary">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => handleChange('estado', value)}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              {loading ? 'Guardando...' : servicio ? 'Actualizar' : 'Crear Servicio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
