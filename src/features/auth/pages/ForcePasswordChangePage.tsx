import { useState } from 'react';
import { apiFetch } from '../../../shared/hooks/apiFetch';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Label } from '../../../shared/components/label';
import { toast } from 'sonner';
import { KeyRound, ShieldAlert, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#+-])[A-Za-z\d@$!%*?&._#+-]{8,}$/;

interface ForcePasswordChangePageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ForcePasswordChangePage({ onSuccess, onCancel }: ForcePasswordChangePageProps) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.password) {
      errs.password = 'La nueva contraseña es obligatoria.';
    } else if (formData.password.length < 8) {
      errs.password = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      errs.password = 'Debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&._#+-).';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Debes confirmar la contraseña.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const saved = localStorage.getItem('kaivet_auth_data');
      if (!saved) {
        throw new Error('No se encontró la sesión activa.');
      }
      
      const authData = JSON.parse(saved);
      const user = authData.usuario;
      const id = user.id_usuario;

      // Realizar la actualización del usuario incluyendo la nueva contraseña
      await apiFetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          IdUsuario: id,
          NombreUsuario: user.nombre_usuario,
          NombreCompleto: user.nombre_completo || user.nombre_usuario,
          Correo: user.correo,
          Cedula: user.cedula,
          Contrasena: formData.password,
          IdRol: user.id_rol,
          Estado: 'activo',
          Activo: true
        }),
      });

      toast.success('Contraseña actualizada con éxito');
      onSuccess();
    } catch (error: any) {
      toast.error('Error al actualizar contraseña', {
        description: error.message || 'Intente nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#311042] z-50 overflow-y-auto">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_45%)]" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Glow effect */}
        <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-30 animate-pulse" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Cambio de Contraseña Obligatorio</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Has iniciado sesión con una contraseña temporal. Por seguridad, debes crear una nueva contraseña para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs font-semibold">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 pr-10 rounded-xl"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-[10px] mt-0.5">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300 text-xs font-semibold">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 pr-10 rounded-xl"
                  placeholder="Repite la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-[10px] mt-0.5">{errors.confirmPassword}</p>}
            </div>

            <div className="bg-slate-800/40 border border-slate-700/30 p-3 rounded-xl flex items-start gap-2.5 text-[10px] text-slate-400">
              <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Asegúrate de que tu nueva contraseña sea fácil de recordar y no la compartas con nadie.
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Guardando...' : 'Cambiar y Acceder'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl py-2"
              >
                Cerrar Sesión
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
