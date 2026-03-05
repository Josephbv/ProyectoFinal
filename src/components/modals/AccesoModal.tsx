import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Shield, Lock, User, Clock, AlertTriangle } from 'lucide-react';

interface PermisoAcceso {
  id: string;
  usuario: string;
  rol: string;
  recurso: string;
  accion: 'crear' | 'leer' | 'actualizar' | 'eliminar' | 'administrar';
  condiciones: string;
  fechaInicio: string;
  fechaFin?: string;
  horaInicio?: string;
  horaFin?: string;
  diasSemana: string[];
  estado: 'activo' | 'inactivo' | 'suspendido' | 'expirado';
  nivelAcceso: 'basico' | 'intermedio' | 'avanzado' | 'administrador';
  ipPermitidas: string[];
  notificaciones: boolean;
  razonCreacion: string;
}

interface AccesoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (acceso: Omit<PermisoAcceso, 'id'>) => Promise<any>;
  acceso?: PermisoAcceso | null;
  loading?: boolean;
}

export function AccesoModal({ isOpen, onClose, onSubmit, acceso, loading }: AccesoModalProps) {
  const [formData, setFormData] = useState({
    usuario: '',
    rol: 'usuario',
    recurso: '',
    accion: 'leer' as 'crear' | 'leer' | 'actualizar' | 'eliminar' | 'administrar',
    condiciones: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    diasSemana: [] as string[],
    estado: 'activo' as 'activo' | 'inactivo' | 'suspendido' | 'expirado',
    nivelAcceso: 'basico' as 'basico' | 'intermedio' | 'avanzado' | 'administrador',
    ipPermitidas: [] as string[],
    notificaciones: true,
    razonCreacion: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ipInput, setIpInput] = useState('');

  const usuarios = [
    'Dr. Carlos Mendoza', 'Dra. Ana Herrera', 'Dr. Luis Vargas',
    'María González', 'Carmen López', 'Pedro Silva', 'Ana Martínez'
  ];

  const recursos = [
    'Dashboard', 'Clientes', 'Mascotas', 'Historial Médico', 'Agendamiento',
    'Ventas', 'Inventario', 'Reportes', 'Configuración', 'Usuarios',
    'Roles', 'Auditoría', 'Respaldos'
  ];

  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  useEffect(() => {
    if (acceso) {
      setFormData({
        usuario: acceso.usuario,
        rol: acceso.rol,
        recurso: acceso.recurso,
        accion: acceso.accion,
        condiciones: acceso.condiciones,
        fechaInicio: acceso.fechaInicio,
        fechaFin: acceso.fechaFin || '',
        horaInicio: acceso.horaInicio || '',
        horaFin: acceso.horaFin || '',
        diasSemana: acceso.diasSemana,
        estado: acceso.estado,
        nivelAcceso: acceso.nivelAcceso,
        ipPermitidas: acceso.ipPermitidas,
        notificaciones: acceso.notificaciones,
        razonCreacion: acceso.razonCreacion
      });
    } else {
      setFormData({
        usuario: '',
        rol: 'usuario',
        recurso: '',
        accion: 'leer',
        condiciones: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        horaInicio: '',
        horaFin: '',
        diasSemana: [],
        estado: 'activo',
        nivelAcceso: 'basico',
        ipPermitidas: [],
        notificaciones: true,
        razonCreacion: ''
      });
    }
    setErrors({});
    setIpInput('');
  }, [acceso, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.usuario.trim()) newErrors.usuario = 'El usuario es requerido';
    if (!formData.recurso.trim()) newErrors.recurso = 'El recurso es requerido';
    if (!formData.razonCreacion.trim()) newErrors.razonCreacion = 'La razón de creación es requerida';

    if (formData.fechaFin && formData.fechaFin <= formData.fechaInicio) {
      newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (formData.horaInicio && formData.horaFin && formData.horaInicio >= formData.horaFin) {
      newErrors.horaFin = 'La hora de fin debe ser posterior a la hora de inicio';
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

  const toggleDiaSemana = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter(d => d !== dia)
        : [...prev.diasSemana, dia]
    }));
  };

  const addIP = () => {
    if (ipInput.trim() && !formData.ipPermitidas.includes(ipInput.trim())) {
      setFormData(prev => ({
        ...prev,
        ipPermitidas: [...prev.ipPermitidas, ipInput.trim()]
      }));
      setIpInput('');
    }
  };

  const removeIP = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ipPermitidas: prev.ipPermitidas.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            {acceso ? 'Editar Permiso de Acceso' : 'Nuevo Permiso de Acceso'}
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            {acceso ? 'Actualiza los permisos de acceso del usuario' : 'Define los permisos de acceso para el usuario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
              <User className="w-4 h-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-dark-primary">Usuario *</Label>
                <Select value={formData.usuario} onValueChange={(value) => handleChange('usuario', value)}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta">
                    <SelectValue placeholder="Selecciona usuario" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario} value={usuario}>{usuario}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.usuario && <p className="text-red-400 text-sm">{errors.usuario}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol" className="text-dark-primary">Rol</Label>
                <Select value={formData.rol} onValueChange={(value) => handleChange('rol', value)}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="veterinario">Veterinario</SelectItem>
                    <SelectItem value="asistente">Asistente</SelectItem>
                    <SelectItem value="recepcionista">Recepcionista</SelectItem>
                    <SelectItem value="usuario">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nivelAcceso" className="text-dark-primary">Nivel de Acceso</Label>
                <Select value={formData.nivelAcceso} onValueChange={(value) => handleChange('nivelAcceso', value)}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Permisos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Permisos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurso" className="text-dark-primary">Recurso *</Label>
                <Select value={formData.recurso} onValueChange={(value) => handleChange('recurso', value)}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta">
                    <SelectValue placeholder="Selecciona recurso" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    {recursos.map((recurso) => (
                      <SelectItem key={recurso} value={recurso}>{recurso}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.recurso && <p className="text-red-400 text-sm">{errors.recurso}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accion" className="text-dark-primary">Acción</Label>
                <Select value={formData.accion} onValueChange={(value) => handleChange('accion', value)}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="leer">Leer</SelectItem>
                    <SelectItem value="crear">Crear</SelectItem>
                    <SelectItem value="actualizar">Actualizar</SelectItem>
                    <SelectItem value="eliminar">Eliminar</SelectItem>
                    <SelectItem value="administrar">Administrar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condiciones" className="text-dark-primary">Condiciones Especiales</Label>
              <Textarea
                id="condiciones"
                value={formData.condiciones}
                onChange={(e) => handleChange('condiciones', e.target.value)}
                className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                placeholder="Ej: Solo registros propios, solo horario laboral..."
                rows={2}
              />
            </div>
          </div>

          {/* Restricciones Temporales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Restricciones Temporales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-dark-primary">Fecha de Inicio *</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleChange('fechaInicio', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaFin" className="text-dark-primary">Fecha de Fin (Opcional)</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => handleChange('fechaFin', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                />
                {errors.fechaFin && <p className="text-red-400 text-sm">{errors.fechaFin}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horaInicio" className="text-dark-primary">Hora de Inicio</Label>
                <Input
                  id="horaInicio"
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => handleChange('horaInicio', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaFin" className="text-dark-primary">Hora de Fin</Label>
                <Input
                  id="horaFin"
                  type="time"
                  value={formData.horaFin}
                  onChange={(e) => handleChange('horaFin', e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                />
                {errors.horaFin && <p className="text-red-400 text-sm">{errors.horaFin}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-dark-primary">Días de la Semana</Label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {diasSemana.map((dia) => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDiaSemana(dia)}
                    className={`p-2 text-sm rounded-lg border transition-colors ${formData.diasSemana.includes(dia)
                        ? 'bg-dark-cta text-white border-dark-cta'
                        : 'bg-dark-hover text-dark-secondary border-dark-color hover:bg-dark-table-hover'
                      }`}
                  >
                    {dia.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Configuración Adicional */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-dark-primary">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => handleChange('estado', value)}>
                  <SelectTrigger className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-card border-dark-color">
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  checked={formData.notificaciones}
                  onCheckedChange={(checked) => handleChange('notificaciones', checked)}
                />
                <span className={`text-[10px] font-bold uppercase tracking-wider w-12 ${formData.notificaciones ? 'text-[#22c55e]' : 'text-[#64748b]'}`}>
                  {formData.notificaciones ? 'Activo' : 'Inactivo'}
                </span>
                <Label className="text-dark-primary">Enviar notificaciones de acceso</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-dark-primary">IPs Permitidas</Label>
              <div className="flex space-x-2">
                <Input
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                  placeholder="192.168.1.100"
                />
                <Button
                  type="button"
                  onClick={addIP}
                  className="bg-dark-cta text-white hover:bg-blue-600"
                >
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.ipPermitidas.map((ip, index) => (
                  <span key={index} className="bg-purple-700 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                    {ip}
                    <button
                      type="button"
                      onClick={() => removeIP(index)}
                      className="ml-1 text-white hover:text-red-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonCreacion" className="text-dark-primary">Razón de Creación *</Label>
              <Textarea
                id="razonCreacion"
                value={formData.razonCreacion}
                onChange={(e) => handleChange('razonCreacion', e.target.value)}
                className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta"
                placeholder="Describe la razón por la cual se otorgan estos permisos..."
                rows={3}
              />
              {errors.razonCreacion && <p className="text-red-400 text-sm">{errors.razonCreacion}</p>}
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
              {loading ? 'Guardando...' : acceso ? 'Actualizar' : 'Crear Permiso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
