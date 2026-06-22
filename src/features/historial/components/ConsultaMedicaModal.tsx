import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Stethoscope, FileText, PillBottle, Heart, User } from 'lucide-react';

interface ConsultaMedicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { motivoConsulta: string; diagnostico: string; tratamiento: string }) => Promise<any>;
  loading?: boolean;
  entradaInfo?: {
    nombreMascota: string;
    nombreCliente: string;
  } | null;
}

export function ConsultaMedicaModal({ isOpen, onClose, onSubmit, loading, entradaInfo }: ConsultaMedicaModalProps) {
  const [formData, setFormData] = useState({
    motivoConsulta: '',
    diagnostico: '',
    tratamiento: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        motivoConsulta: '',
        diagnostico: '',
        tratamiento: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.motivoConsulta.trim()) newErrors.motivoConsulta = 'El motivo de consulta es requerido';
    if (!formData.diagnostico.trim()) newErrors.diagnostico = 'El diagnóstico es requerido';
    if (!formData.tratamiento.trim()) newErrors.tratamiento = 'El tratamiento es requerido';

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-dark-card border-dark-color">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-primary flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-400" />
            Nueva Consulta Médica
          </DialogTitle>
          <DialogDescription className="text-dark-secondary">
            Registra el motivo, diagnóstico y tratamiento de la consulta médica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la Entrada */}
          {entradaInfo && (
            <div className="bg-dark-hover border border-dark-color rounded-lg p-4">
              <h4 className="text-sm font-semibold text-dark-primary mb-3">Información del Paciente</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <div>
                    <p className="text-xs text-dark-secondary">Mascota</p>
                    <p className="text-sm font-medium text-dark-primary">{entradaInfo.nombreMascota}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-dark-secondary">Propietario</p>
                    <p className="text-sm font-medium text-dark-primary">{entradaInfo.nombreCliente}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Motivo de Consulta */}
          <div className="space-y-2">
            <Label htmlFor="motivoConsulta" className="text-dark-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Motivo de Consulta *
            </Label>
            <Textarea
              id="motivoConsulta"
              value={formData.motivoConsulta}
              onChange={(e) => handleChange('motivoConsulta', e.target.value)}
              className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta min-h-[100px]"
              placeholder="Describe el motivo de la consulta médica..."
            />
            {errors.motivoConsulta && <p className="text-red-400 text-sm">{errors.motivoConsulta}</p>}
          </div>

          {/* Diagnóstico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="diagnostico" className="text-dark-primary flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Diagnóstico *
              </Label>
              <span className="text-[10px] font-bold text-dark-secondary bg-dark-hover px-2 py-0.5 rounded-full border border-dark-color">
                {(formData.diagnostico || '').length}/100
              </span>
            </div>
            <Textarea
              id="diagnostico"
              value={formData.diagnostico}
              onChange={(e) => handleChange('diagnostico', e.target.value.slice(0, 100))}
              maxLength={100}
              className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta min-h-[120px]"
              placeholder="Escribe el diagnóstico médico completo..."
            />
            {errors.diagnostico && <p className="text-red-400 text-sm">{errors.diagnostico}</p>}
          </div>

          {/* Tratamiento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tratamiento" className="text-dark-primary flex items-center gap-2">
                <PillBottle className="w-4 h-4" />
                Tratamiento *
              </Label>
              <span className="text-[10px] font-bold text-dark-secondary bg-dark-hover px-2 py-0.5 rounded-full border border-dark-color">
                {(formData.tratamiento || '').length}/100
              </span>
            </div>
            <Textarea
              id="tratamiento"
              value={formData.tratamiento}
              onChange={(e) => handleChange('tratamiento', e.target.value.slice(0, 100))}
              maxLength={100}
              className="bg-dark-hover border-dark-color text-dark-primary focus:border-dark-cta min-h-[120px]"
              placeholder="Detalla el tratamiento prescrito (medicamentos, terapias, recomendaciones)..."
            />
            {errors.tratamiento && <p className="text-red-400 text-sm">{errors.tratamiento}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="dark-button-secondary"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="dark-button-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Consulta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
