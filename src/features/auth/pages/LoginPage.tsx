import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Input } from "../../../shared/components/input";
import { Label } from "../../../shared/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/components/card";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CreditCard, ChevronRight, ArrowLeft, Shield } from "lucide-react";
import { PawIcon } from "../../../shared/components/PawIcon";
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

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'activate-account'>('login');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    tipoDocumento: "CC",
    numeroDocumento: "",
    telefono: "",
    direccion: "",
    token: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      onLogin(user);
    }
  }, [isAuthenticated, user, onLogin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const emailParam = params.get("email");
    const tokenParam = params.get("token");

    if (mode === "activate" && emailParam && tokenParam) {
      setAuthMode("activate-account");
      setFormData(prev => ({
        ...prev,
        email: emailParam,
        token: tokenParam
      }));
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (!formData.email || !formData.password) {
      toast.error("Error", { description: "Complete todos los campos." });
      return;
    }
    const result = await login(formData.email, formData.password);
    if (!result.success) toast.error("Error", { description: result.error || "Credenciales incorrectas." });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const requiredFields = ['email', 'password', 'nombre', 'telefono', 'numeroDocumento', 'direccion'];
    const missingFields = requiredFields.filter(f => !formData[f as keyof typeof formData]);

    if (missingFields.length > 0) {
      toast.error("Error", { description: "Complete los campos obligatorios." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Error", { description: "Las contraseñas no coinciden." });
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      nombre: formData.nombre,
      tipoDocumento: formData.tipoDocumento,
      cedula: formData.numeroDocumento,
      telefono: formData.telefono,
      direccion: formData.direccion
    });

    if (result.success) {
      toast.success("¡Bienvenido!", { description: "Registro completado con éxito." });
    } else {
      toast.error("Error", { description: result.error || "No se pudo realizar el registro." });
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Error", { description: "Ingrese su correo electrónico." });
      return;
    }
    const result = await requestPasswordReset(formData.email);
    if (result.success) {
      toast.success("Enviado", { description: "Revisa tu correo para obtener el código de seguridad." });
      setAuthMode('reset-password');
    } else {
      toast.error("Error", { description: result.error || "Cuenta no encontrada." });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.token || !formData.password) {
      toast.error("Error", { description: "Datos incompletos." });
      return;
    }

    if (authMode === 'activate-account' && formData.password !== formData.confirmPassword) {
      toast.error("Error", { description: "Las contraseñas no coinciden." });
      return;
    }

    const result = await resetPassword(formData.email, formData.token, formData.password);
    if (result.success) {
      toast.success(authMode === 'activate-account' ? "Cuenta activada" : "Listo", { description: authMode === 'activate-account' ? "Ahora puedes iniciar sesión con tu cuenta." : "Contraseña actualizada." });
      setAuthMode('login');
      // Limpiar URL si venía de activación
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      toast.error("Error", { description: result.error || "Código inválido." });
    }
  };

  // Common black text class with dark mode override to ensure it stays black
  const blackText = "text-black dark:text-black !text-black font-semibold";
  const titleText = "text-black dark:text-black !text-black font-black";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className={`w-full transition-all duration-500 ease-in-out transform ${authMode === 'register' ? 'max-w-2xl' : 'max-w-md'} relative z-10`}>

        {/* Branding */}
        <div className="flex flex-col items-center mb-6 space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-lg ring-4 ring-blue-400/30">
            <PawIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight uppercase drop-shadow-md">Kaivet Manager</h1>
        </div>

        <Card className="bg-white dark:bg-white border-none shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="pt-10 pb-6 px-8 text-center bg-white border-b border-slate-100">
            <CardTitle className={`text-3xl tracking-tight mb-2 ${titleText}`} style={{ color: '#000000' }}>
              {authMode === 'login' && '¡Hola de nuevo!'}
              {authMode === 'register' && 'Crear Cuenta'}
              {authMode === 'forgot-password' && 'Recuperar Clave'}
              {authMode === 'reset-password' && 'Nueva Contraseña'}
              {authMode === 'activate-account' && 'Activar Cuenta'}
            </CardTitle>
            <CardDescription className={`${blackText} opacity-80`} style={{ color: '#000000' }}>
              {authMode === 'login' && 'Ingresa tus datos para entrar al sistema.'}
              {authMode === 'register' && 'Regístrate para gestionar tu veterinaria.'}
              {authMode === 'forgot-password' && 'Te ayudaremos a recuperar tu acceso.'}
              {authMode === 'reset-password' && 'Define tus nuevas credenciales.'}
              {authMode === 'activate-account' && 'Crea tu nueva contraseña para acceder.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 py-10 bg-white">
            <form
              onSubmit={(e) => {
                if (authMode === 'login') handleLogin(e);
                else if (authMode === 'register') handleRegister(e);
                else if (authMode === 'forgot-password') handleRequestReset(e);
                else handleResetPassword(e);
              }}
              className="space-y-6"
            >
              {authMode === 'register' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Nombre Completo"
                    icon={<User className="w-4 h-4" />}
                    placeholder="Ej. Mauricio Rossi"
                    value={formData.nombre}
                    onChange={(v) => handleInputChange('nombre', v)}
                    error={isSubmitted && !formData.nombre}
                  />
                  <FormInput
                    label="Teléfono"
                    icon={<Phone className="w-4 h-4" />}
                    placeholder="300 000 0000"
                    value={formData.telefono}
                    onChange={(v) => handleInputChange('telefono', v)}
                    error={isSubmitted && !formData.telefono}
                  />
                  <div className="space-y-2">
                    <Label className={`text-xs flex items-center gap-2 mb-1.5 ml-1 uppercase tracking-wide ${blackText}`} style={{ color: '#000000' }}>
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Identificación <span className="text-red-600">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <select
                        className="bg-slate-50 border border-slate-200 !text-black rounded-xl px-2 text-xs focus:ring-2 focus:ring-blue-500/50 outline-none transition-all h-12"
                        value={formData.tipoDocumento}
                        onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
                        style={{ color: '#000000' }}
                      >
                        <option value="CC" className="text-black">CC</option>
                        <option value="CE" className="text-black">CE</option>
                        <option value="NIT" className="text-black">NIT</option>
                      </select>
                      <Input
                        className="bg-slate-50 border-slate-200 !text-black placeholder:text-slate-500 rounded-xl h-12 focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Número"
                        value={formData.numeroDocumento}
                        onChange={e => handleInputChange('numeroDocumento', e.target.value)}
                        style={{ color: '#000000' }}
                      />
                    </div>
                    {isSubmitted && !formData.numeroDocumento && <p className="text-[10px] text-red-600 font-bold italic ml-2">Este campo es obligatorio</p>}
                  </div>
                  <FormInput
                    label="Dirección"
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="Calle 10 # 20"
                    value={formData.direccion}
                    onChange={(v) => handleInputChange('direccion', v)}
                    error={isSubmitted && !formData.direccion}
                  />
                </div>
              )}

              <FormInput
                label="Correo Electrónico"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(v) => handleInputChange('email', v)}
                disabled={authMode === 'reset-password' || authMode === 'activate-account'}
                error={isSubmitted && !formData.email}
              />

              {authMode === 'reset-password' && (
                <FormInput
                  label="Código"
                  icon={<Shield className="w-4 h-4" />}
                  placeholder="000000"
                  maxLength={6}
                  value={formData.token}
                  onChange={(v) => handleInputChange('token', v)}
                  className="text-center font-mono text-xl tracking-widest"
                />
              )}

              {(authMode === 'login' || authMode === 'register' || authMode === 'reset-password' || authMode === 'activate-account') && (
                <div className={`grid grid-cols-1 ${authMode === 'register' || authMode === 'activate-account' ? 'md:grid-cols-2 gap-6' : ''}`}>
                  <div className="space-y-2 text-black">
                    <Label className={`text-xs flex items-center gap-2 mb-1.5 ml-1 uppercase tracking-wide ${blackText}`} style={{ color: '#000000' }}>
                      <Lock className="w-4 h-4 text-blue-600" />
                      Contraseña <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="bg-slate-50 border-slate-200 !text-black placeholder:text-slate-500 rounded-xl pr-12 h-12 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => handleInputChange('password', e.target.value)}
                        style={{ color: '#000000' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {isSubmitted && !formData.password && <p className="text-[10px] text-red-600 font-bold italic ml-2">Este campo es obligatorio</p>}

                    {authMode === 'login' && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot-password')}
                          className={`text-xs hover:underline transition-colors !text-black dark:text-black font-bold`}
                          style={{ color: '#000000' }}
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    )}
                  </div>

                  {(authMode === 'register' || authMode === 'activate-account') && (
                    <FormInput
                      label="Confirmar Clave"
                      icon={<Lock className="w-4 h-4" />}
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(v) => handleInputChange('confirmPassword', v)}
                      error={isSubmitted && !formData.confirmPassword}
                    />
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span className="flex items-center gap-2">
                    {authMode === 'login' ? 'Iniciar Sesión' : authMode === 'register' ? 'Registrarse ahora' : authMode === 'activate-account' ? 'Activar Cuenta' : 'Continuar'}
                    <ChevronRight size={20} />
                  </span>
                )}
              </Button>

              {(authMode === 'forgot-password' || authMode === 'reset-password' || authMode === 'activate-account') && (
                <button
                  type="button"
                  className={`w-full text-sm flex items-center justify-center gap-2 mt-2 transition-opacity hover:opacity-70 !text-black dark:text-black font-bold`}
                  style={{ color: '#000000' }}
                  onClick={() => {
                    setAuthMode('login');
                    setIsSubmitted(false);
                  }}
                >
                  <ArrowLeft size={16} className="text-black" />
                  Volver al inicio
                </button>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setIsSubmitted(false);
                  setShowPassword(false);
                }}
                className={`text-sm transition-all !text-black dark:text-black`}
                style={{ color: '#000000' }}
              >
                {authMode === 'login' ? (
                  <>¿Eres nuevo? <span className="font-extrabold underline underline-offset-4 !text-black" style={{ color: '#000000' }}>Regístrate aquí</span></>
                ) : (
                  <>¿Ya tienes cuenta? <span className="font-extrabold underline underline-offset-4 !text-black" style={{ color: '#000000' }}>Inicia sesión</span></>
                )}
              </button>

              <div className="mt-8 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className={`text-[10px] uppercase tracking-widest !text-black dark:text-black font-bold opacity-40`} style={{ color: '#000000' }}>Protocolo Seguro</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface FormInputProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  maxLength?: number;
}

function FormInput({ label, icon, value, onChange, placeholder, type = "text", className = "", disabled, error, maxLength }: FormInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className={`text-xs font-bold flex items-center gap-2 mb-1.5 ml-1 uppercase tracking-wide text-black dark:text-black !text-black`} style={{ color: '#000000' }}>
        <span className="text-blue-600">{icon}</span>
        {label} <span className="text-red-600">*</span>
      </Label>
      <Input
        type={type}
        className={`bg-slate-50 border border-slate-200 !text-black placeholder:text-slate-500 rounded-xl h-12 focus:ring-2 focus:ring-blue-500/50 transition-all ${error ? 'border-red-600 ring-1 ring-red-600/20' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        style={{ color: '#000000' }}
      />
      {error && <p className="text-[10px] text-red-600 font-bold italic ml-2 mt-1">Este campo es obligatorio</p>}
    </div>
  );
}
