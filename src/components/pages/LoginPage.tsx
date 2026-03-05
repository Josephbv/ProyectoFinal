import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { PawIcon } from "../PawIcon";
import { useEmailAuth } from "../hooks/useEmailAuth";

interface LoginPageProps {
  onLogin: (user?: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const {
    isAuthenticated,
    user,
    loading,
    register,
    login,
    requestPasswordReset,
    resetPassword
  } = useEmailAuth();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellido: "",
    tipoDocumento: "CC",
    numeroDocumento: "",
    telefono: "",
    token: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onLogin(user);
    }
  }, [isAuthenticated, user, onLogin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    const result = await login(formData.email, formData.password);
    if (!result.success) toast.error(result.error || "Error al iniciar sesión");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.nombre || !formData.apellido) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    const result = await register({
      email: formData.email,
      password: formData.password,
      nombre: formData.nombre,
      apellido: formData.apellido,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      telefono: formData.telefono
    });
    if (result.success) {
      toast.success("Cuenta creada exitosamente");
    } else {
      toast.error(result.error || "Error al registrar");
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Por favor ingresa tu correo");
      return;
    }
    const result = await requestPasswordReset(formData.email);
    if (result.success) {
      toast.success(`${result.message}. CÓDIGO: ${result.token}`, { duration: 10000 });
      setAuthMode('reset-password');
    } else {
      toast.error(result.error || "Error al solicitar reseteo");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.token || !formData.password) {
      toast.error("Completa todos los campos");
      return;
    }
    const result = await resetPassword(formData.email, formData.token, formData.password);
    if (result.success) {
      toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
      setAuthMode('login');
    } else {
      toast.error(result.error || "Código inválido");
    }
  };

  const getTitle = () => {
    switch (authMode) {
      case 'login': return 'Bienvenido a KaiVet';
      case 'register': return 'Únete a KaiVet';
      case 'forgot-password': return 'Recuperar Acceso';
      case 'reset-password': return 'Nueva Contraseña';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full blur-[100px]"></div>
      </div>

      <Card className="w-full max-w-md bg-dark-card border-dark-color shadow-2xl relative z-10 transition-all duration-500">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
              <PawIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold text-white tracking-tight">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-dark-secondary text-lg">
            {authMode === 'login' && 'Accede a tu plataforma profesional'}
            {authMode === 'register' && 'Empieza a gestionar tu veterinaria hoy'}
            {authMode === 'forgot-password' && 'Te enviaremos un código de seguridad'}
            {authMode === 'reset-password' && 'Ingresa el código que recibiste'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={(e) => {
              if (authMode === 'login') handleLogin(e);
              else if (authMode === 'register') handleRegister(e);
              else if (authMode === 'forgot-password') handleRequestReset(e);
              else handleResetPassword(e);
            }}
            className="space-y-4"
          >
            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <Label className="text-white">Nombre</Label>
                  <Input
                    className="bg-dark-hover border-dark-color text-white focus:border-blue-500 transition-colors"
                    placeholder="Juan"
                    required
                    value={formData.nombre}
                    onChange={e => handleInputChange('nombre', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Apellido</Label>
                  <Input
                    className="bg-dark-hover border-dark-color text-white focus:border-blue-500 transition-colors"
                    placeholder="Pérez"
                    required
                    value={formData.apellido}
                    onChange={e => handleInputChange('apellido', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white">Correo Electrónico</Label>
              <Input
                type="email"
                className="bg-dark-hover border-dark-color text-white focus:border-blue-500 transition-colors"
                placeholder="doctor@kaivet.com"
                required
                disabled={authMode === 'reset-password'}
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
              />
            </div>

            {authMode === 'reset-password' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-white">Código de Seguridad</Label>
                <Input
                  className="bg-dark-hover border-dark-color text-white focus:border-blue-500 transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                  value={formData.token}
                  onChange={e => handleInputChange('token', e.target.value)}
                />
              </div>
            )}

            {(authMode === 'login' || authMode === 'register' || authMode === 'reset-password') && (
              <div className="space-y-2">
                <Label className="text-white">{authMode === 'reset-password' ? 'Nueva Contraseña' : 'Contraseña'}</Label>
                <div className="relative group">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="bg-dark-hover border-dark-color text-white focus:border-blue-500 transition-colors pr-10"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-secondary hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'register' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label className="text-white">Confirmar Contraseña</Label>
                <Input
                  type="password"
                  className="bg-dark-hover border-dark-color text-white focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                  value={formData.confirmPassword}
                  onChange={e => handleInputChange('confirmPassword', e.target.value)}
                />
              </div>
            )}

            {authMode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot-password')}
                  className="text-xs text-blue-400 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/20 transition-all" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {authMode === 'login' && <LogIn size={20} />}
                  {authMode === 'register' && <UserPlus size={20} />}
                  {authMode === 'login' ? 'Entrar' : authMode === 'register' ? 'Unirse' : 'Enviar'}
                </span>
              )}
            </Button>

            {(authMode === 'forgot-password' || authMode === 'reset-password') && (
              <Button
                variant="ghost"
                type="button"
                className="w-full text-dark-secondary hover:text-white"
                onClick={() => setAuthMode('login')}
              >
                Volver al inicio
              </Button>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dark-color"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-card px-2 text-dark-secondary">Sistema Seguro v1.0</span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
            >
              {authMode === 'login' ? '¿Aún no tienes cuenta? Regístrate gratis' : '¿Ya eres usuario? Inicia sesión'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
