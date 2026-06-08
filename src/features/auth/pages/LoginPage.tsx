import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/button";
import { Input } from "../../../shared/components/input";
import { Label } from "../../../shared/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/components/card";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CreditCard, ChevronRight, ArrowLeft, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { PawIcon } from "../../../shared/components/PawIcon";
import { useEmailAuth } from "../hooks/useEmailAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ONLY_DIGITS = /^\d+$/;

interface LoginPageProps {
  onLogin: (user?: any) => void;
  onBackToLanding?: () => void;
}

export function LoginPage({ onLogin, onBackToLanding }: LoginPageProps) {
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem('pending_email_verification');
    if (email) {
      setPendingEmail(email);
      setFormData(prev => ({ ...prev, email: "", password: "" }));
    }
  }, []);

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
    const confirmedParam = params.get("confirmed");

    if (confirmedParam === "true") {
      toast.success("¡Correo confirmado!", {
        description: "Tu cuenta ha sido activada con éxito. Ya puedes iniciar sesión.",
      });
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (mode === "activate" && emailParam && tokenParam) {
      setAuthMode("activate-account");
      setFormData(prev => ({
        ...prev,
        email: emailParam,
        token: tokenParam
      }));
    }
  }, []);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
    // Validación en tiempo real de confirmPassword
    if (field === 'confirmPassword') {
      if (value && value !== formData.password)
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden.' }));
      else
        setFieldErrors(prev => { const n = { ...prev }; delete n['confirmPassword']; return n; });
    }
    if (field === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword)
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden.' }));
      else
        setFieldErrors(prev => { const n = { ...prev }; delete n['confirmPassword']; return n; });
    }
  };

  const validateRegisterForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      errs.nombre = 'El nombre completo es obligatorio.';
    } else if (formData.nombre.trim().length < 5) {
      errs.nombre = 'El nombre debe tener al menos 5 caracteres.';
    } else if (formData.nombre.trim().length > 30) {
      errs.nombre = 'El nombre no puede exceder los 30 caracteres.';
    }

    if (!formData.telefono.trim()) {
      errs.telefono = 'El teléfono es obligatorio.';
    } else if (!/^3\d{9}$/.test(formData.telefono.trim())) {
      errs.telefono = 'El teléfono debe empezar con 3 y tener exactamente 10 dígitos.';
    }

    if (!formData.numeroDocumento.trim()) {
      errs.numeroDocumento = 'El número de documento es obligatorio.';
    } else if (!ONLY_DIGITS.test(formData.numeroDocumento.trim())) {
      errs.numeroDocumento = 'El documento debe contener solo números.';
    } else if (formData.numeroDocumento.trim().length < 8) {
      errs.numeroDocumento = 'El documento debe tener al menos 8 dígitos.';
    } else if (formData.numeroDocumento.trim().length > 15) {
      errs.numeroDocumento = 'El documento no puede tener más de 15 dígitos.';
    } else if (/(\d)\1{3}/.test(formData.numeroDocumento.trim())) {
      errs.numeroDocumento = 'El documento no puede tener más de 3 números repetidos continuamente (ej. no "1111").';
    }

    const addressPrefixRegex = /^(calle|carrera|cra|cl|avenida|av|diagonal|dg|transversal|transv|tv|intersección|interseccion|autopista|circular|via|vía)\b/i;
    if (!formData.direccion.trim()) {
      errs.direccion = 'La dirección es obligatoria.';
    } else if (!addressPrefixRegex.test(formData.direccion.trim())) {
      errs.direccion = 'La dirección debe comenzar con una vía válida (Ej: Calle, Carrera, Avenida, Diagonal, Transversal, etc.).';
    }

    if (!formData.email.trim()) {
      errs.email = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errs.email = 'Ingresa un correo electrónico válido (ej. usuario@correo.com).';
    }

    if (!formData.password) {
      errs.password = 'La contraseña es obligatoria.';
    } else if (formData.password.length < 8) {
      errs.password = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (formData.password.startsWith('Temp-')) {
      errs.password = 'Por seguridad, la contraseña no puede comenzar con "Temp-".';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Debes confirmar tu contraseña.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    const errs: Record<string, string> = {};
    if (!formData.email.trim()) errs.email = 'El correo es obligatorio.';
    else if (!EMAIL_REGEX.test(formData.email.trim())) errs.email = 'Ingresa un correo válido.';
    if (!formData.password) errs.password = 'La contraseña es obligatoria.';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    const result = await login(formData.email, formData.password);
    if (!result.success) toast.error("Acceso denegado", { description: result.error || "Credenciales incorrectas." });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (!validateRegisterForm()) {
      toast.error("Formulario incompleto", { description: "Revisa los campos marcados en rojo." });
      return;
    }
    const result = await register({
      email: formData.email.trim(),
      password: formData.password,
      nombre: formData.nombre.trim(),
      tipoDocumento: formData.tipoDocumento,
      cedula: formData.numeroDocumento.trim(),
      telefono: formData.telefono.trim(),
      direccion: formData.direccion.trim(),
    });
    if (result.success) {
      toast.success("¡Cuenta creada!", { description: "Registro exitoso. Ya puedes iniciar sesión." });
      setAuthMode('login');
      setIsSubmitted(false);
      setFieldErrors({});
    } else {
      if (result.error === 'duplicate_email') {
        setFieldErrors(prev => ({ ...prev, email: 'Este correo ya está registrado. ¿Ya tienes una cuenta?' }));
        toast.error("Correo ya registrado", { description: "El correo ingresado pertenece a una cuenta existente." });
      } else if (result.error === 'duplicate_cedula') {
        setFieldErrors(prev => ({ ...prev, numeroDocumento: 'Este número de documento ya está registrado.' }));
        toast.error("Documento duplicado", { description: "Ya existe una cuenta con ese número de documento." });
      } else if (result.error === 'duplicate_generic') {
        setFieldErrors(prev => ({
          ...prev,
          email: 'El correo o documento ya está en uso.',
          numeroDocumento: 'El correo o documento ya está en uso.',
        }));
        toast.error("Datos duplicados", { description: "El correo o documento ya están asociados a una cuenta." });
      } else {
        toast.error("Error al registrar", { description: result.error || "No se pudo completar el registro." });
      }
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
  const blackText = "text-black dark:text-black !text-black font-bold";
  const titleText = "text-black dark:text-black !text-black font-black";

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4338ca 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: authMode === 'register' ? '500px' : '360px', position: 'relative', zIndex: 10, margin: 'auto', flexShrink: 0 }}>

        {/* Branding */}
        <div className="flex flex-col items-center mb-4 space-y-1.5">
          <div className="p-2 bg-white rounded-2xl shadow-xl ring-2 ring-white/20">
            <PawIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-white text-lg font-bold tracking-tight uppercase drop-shadow-lg">Kaivet</h1>
        </div>

        <div style={{ background: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.18)', border: 'none' }}>
          {/* Header */}
          <div style={{ paddingTop: '40px', paddingBottom: '20px', paddingLeft: '32px', paddingRight: '32px', textAlign: 'center', borderBottom: '1px solid #f8fafc' }}>
            <CardTitle className={`text-xl tracking-tight mb-0.5 ${titleText}`} style={{ color: '#000000' }}>
              {authMode === 'login' && '¡Bienvenido!'}
              {authMode === 'register' && 'Crear Cuenta'}
              {authMode === 'forgot-password' && 'Recuperar'}
              {authMode === 'reset-password' && 'Nueva Clave'}
              {authMode === 'activate-account' && 'Activar'}
            </CardTitle>
            <CardDescription className="text-black/60 text-[11px] font-medium leading-tight text-center" style={{ color: '#000000' }}>
              {authMode === 'login' && 'Ingresa para gestionar tu veterinaria.'}
              {authMode === 'register' && 'Regístrate en el sistema.'}
              {authMode === 'forgot-password' && 'Recupera tu acceso.'}
              {authMode === 'reset-password' && 'Define tu nueva contraseña.'}
              {authMode === 'activate-account' && 'Crea tu contraseña.'}
            </CardDescription>
          </div>

          {/* Content */}
          <div style={{ padding: '32px' }}>
            <form
              onSubmit={(e) => {
                if (authMode === 'login') handleLogin(e);
                else if (authMode === 'register') handleRegister(e);
                else if (authMode === 'forgot-password') handleRequestReset(e);
                else handleResetPassword(e);
              }}
              className="space-y-6"
            >
              {authMode === 'register' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Row 1: Identificación (Left), Nombre completo (Right) */}
                  <div className="space-y-2">
                    <Label className={`text-xs flex items-center gap-2 mb-1.5 ml-1 ${blackText}`} style={{ color: '#000000' }}>
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
                      </select>
                      <Input
                        className={`bg-slate-50 !text-black placeholder:text-slate-500 rounded-xl h-12 focus:ring-2 focus:ring-blue-500/50 ${fieldErrors.numeroDocumento ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200'}`}
                        placeholder="Número"
                        value={formData.numeroDocumento}
                        onChange={e => handleInputChange('numeroDocumento', e.target.value)}
                        style={{ color: '#000000' }}
                        maxLength={15}
                      />
                    </div>
                    {fieldErrors.numeroDocumento && (
                      <p className="font-bold italic ml-2 flex items-center gap-1" style={{ color: '#ef4444', fontSize: '11px' }}>
                        <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} />{fieldErrors.numeroDocumento}
                      </p>
                    )}
                  </div>

                  <FormInput
                    label="Nombre completo"
                    icon={<User className="w-4 h-4" />}
                    placeholder="Ej. Mauricio Rossi"
                    value={formData.nombre}
                    onChange={(v) => handleInputChange('nombre', v)}
                    error={!!fieldErrors.nombre}
                    errorMessage={fieldErrors.nombre}
                    maxLength={30}
                  />

                  {/* Row 2: Correo electrónico (Left), Teléfono (Right) */}
                  <FormInput
                    label="Correo electrónico"
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(v) => handleInputChange('email', v)}
                    error={!!fieldErrors.email}
                    errorMessage={fieldErrors.email}
                  />

                  <FormInput
                    label="Teléfono"
                    icon={<Phone className="w-4 h-4" />}
                    placeholder="300 000 0000"
                    value={formData.telefono}
                    onChange={(v) => handleInputChange('telefono', v)}
                    error={!!fieldErrors.telefono}
                    errorMessage={fieldErrors.telefono}
                    maxLength={10}
                  />

                  {/* Row 3: Dirección (Full width / col-span-2) */}
                  <FormInput
                    label="Dirección"
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="Calle 10 # 20"
                    value={formData.direccion}
                    onChange={(v) => handleInputChange('direccion', v)}
                    error={!!fieldErrors.direccion}
                    errorMessage={fieldErrors.direccion}
                    className="col-span-1 md:col-span-2"
                  />

                  {/* Row 4: Contraseña (Left), Confirmar contraseña (Right) */}
                  <div className="space-y-2 text-black">
                    <Label className={`text-xs flex items-center gap-2 mb-1.5 ml-1 ${blackText}`} style={{ color: '#000000' }}>
                      <Lock className="w-4 h-4 text-blue-600" />
                      Contraseña <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className={`bg-slate-50 !text-black placeholder:text-slate-500 rounded-xl pr-12 h-12 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200'}`}
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
                    {fieldErrors.password && (
                      <p className="font-bold italic ml-2 flex items-center gap-1" style={{ color: '#ef4444', fontSize: '11px' }}>
                        <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} />{fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-black">
                    <Label className={`text-xs flex items-center gap-2 mb-1.5 ml-1 ${blackText}`} style={{ color: '#000000' }}>
                      <Lock className="w-4 h-4 text-blue-600" />
                      Confirmar contraseña <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        className={`bg-slate-50 !text-black placeholder:text-slate-500 rounded-xl pr-12 h-12 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm ${fieldErrors.confirmPassword ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200'}`}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={e => handleInputChange('confirmPassword', e.target.value)}
                        style={{ color: '#000000' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="font-bold italic ml-2 flex items-center gap-1" style={{ color: '#ef4444', fontSize: '11px' }}>
                        <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} />{fieldErrors.confirmPassword}
                      </p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="text-[10px] text-green-600 font-bold ml-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <FormInput
                    label="Correo electrónico"
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(v) => handleInputChange('email', v)}
                    disabled={authMode === 'reset-password' || authMode === 'activate-account'}
                    error={!!fieldErrors.email}
                    errorMessage={fieldErrors.email}
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

                  {(authMode === 'login' || authMode === 'reset-password' || authMode === 'activate-account') && (
                    <div className={`grid grid-cols-1 ${authMode === 'activate-account' ? 'md:grid-cols-2 gap-6' : ''}`}>
                      <div className="space-y-2 text-black">
                        <Label className={`text-xs flex items-center gap-2 mb-1.5 ml-1 ${blackText}`} style={{ color: '#000000' }}>
                          <Lock className="w-4 h-4 text-blue-600" />
                          Contraseña <span className="text-red-600">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className={`bg-slate-50 !text-black placeholder:text-slate-500 rounded-xl pr-12 h-12 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm ${fieldErrors.password ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200'}`}
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
                        {fieldErrors.password && (
                          <p className="font-bold italic ml-2 flex items-center gap-1" style={{ color: '#ef4444', fontSize: '11px' }}>
                            <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} />{fieldErrors.password}
                          </p>
                        )}

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

                      {authMode === 'activate-account' && (
                        <div className="space-y-2 text-black">
                          <Label className={`text-xs flex items-center gap-2 mb-1.5 ml-1 ${blackText}`} style={{ color: '#000000' }}>
                            <Lock className="w-4 h-4 text-blue-600" />
                            Confirmar contraseña <span className="text-red-600">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              className={`bg-slate-50 !text-black placeholder:text-slate-500 rounded-xl pr-12 h-12 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm ${fieldErrors.confirmPassword ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200'}`}
                              placeholder="••••••••"
                              value={formData.confirmPassword}
                              onChange={e => handleInputChange('confirmPassword', e.target.value)}
                              style={{ color: '#000000' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {fieldErrors.confirmPassword && (
                            <p className="font-bold italic ml-2 flex items-center gap-1" style={{ color: '#ef4444', fontSize: '11px' }}>
                              <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} />{fieldErrors.confirmPassword}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span className="flex items-center gap-2">
                    {authMode === 'login' ? 'Entrar' : authMode === 'register' ? 'Registrarse' : 'Continuar'}
                    <ChevronRight size={16} />
                  </span>
                )}
              </Button>

              {(authMode === 'forgot-password' || authMode === 'reset-password' || authMode === 'activate-account') && (
                <button
                  type="button"
                  className="w-full text-xs flex items-center justify-center gap-1 mt-1 transition-opacity hover:opacity-70 text-black font-bold"
                  style={{ color: '#000000' }}
                  onClick={() => {
                    setAuthMode('login');
                    setIsSubmitted(false);
                  }}
                >
                  <ArrowLeft size={14} />
                  Volver
                </button>
              )}
            </form>


            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setIsSubmitted(false);
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                  setFieldErrors({});
                }}
                className="text-[12px] transition-all text-black hover:opacity-70"
                style={{ color: '#000000' }}
              >
                {authMode === 'login' ? (
                  <>¿Sin cuenta? <span className="font-extrabold underline underline-offset-2">Regístrate</span></>
                ) : (
                  <>¿Ya tienes cuenta? <span className="font-extrabold underline underline-offset-2">Logín</span></>
                )}
              </button>

              <div className="mt-8 flex items-center justify-between">
                {onBackToLanding ? (
                  <button
                    onClick={onBackToLanding}
                    className="flex items-center gap-1.5 text-xs text-black font-bold hover:opacity-70 transition-opacity"
                    style={{ color: '#000000' }}
                  >
                    <ArrowLeft size={12} /> Volver al inicio
                  </button>
                ) : <div />}
              </div>
            </div>
          </div>
        </div>
    </div>
      {pendingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-dark-card border border-dark-color p-6 md:p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400">
              <Mail className="w-8 h-8 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-dark-primary tracking-tight">Confirmación de Correo Requerida</h2>
              <p className="text-sm text-dark-secondary">
                Hemos enviado un correo de confirmación a: <br />
                <span className="text-blue-400 font-black break-all">{pendingEmail}</span>
              </p>
              <p className="text-xs text-dark-secondary/60">
                Por seguridad, tu sesión ha sido cerrada. Debes confirmar tu correo antes de poder ingresar.
              </p>
            </div>

            <div className="p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10 text-left space-y-3">
              <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
                [Entorno de Pruebas / Simulación]
              </span>
              <p className="text-xs text-dark-secondary">
                Haz clic en el botón de abajo para simular que abriste el enlace de confirmación de tu correo electrónico.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('pending_email_verification');
                  setPendingEmail(null);
                  toast.success("¡Correo confirmado!", {
                    description: "Tu cuenta ha sido activada con éxito. Ya puedes iniciar sesión.",
                  });
                  setFormData(prev => ({
                    ...prev,
                    email: "",
                    password: ""
                  }));
                }}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition-all uppercase tracking-wider cursor-pointer"
              >
                Simular Confirmación de Correo
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('pending_email_verification');
                setPendingEmail(null);
              }}
              className="text-xs text-dark-secondary hover:text-dark-primary transition-colors underline cursor-pointer"
            >
              Cancelar y omitir
            </button>
          </div>
        </div>
      )}
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
  errorMessage?: string;
  maxLength?: number;
}

function FormInput({ label, icon, value, onChange, placeholder, type = "text", className = "", disabled, error, errorMessage, maxLength }: FormInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className={`text-xs font-bold flex items-center gap-2 mb-1.5 ml-1 text-black dark:text-black !text-black`} style={{ color: '#000000' }}>
        <span className="text-blue-600">{icon}</span>
        {label} <span className="text-red-600">*</span>
      </Label>
      <Input
        type={type}
        className={`bg-slate-50 border !text-black placeholder:text-slate-500 rounded-xl h-12 focus:ring-2 focus:ring-blue-500/50 transition-all ${error ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-200'}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        style={{ color: '#000000' }}
      />
      {error && (
        <p className="font-bold italic ml-2 mt-1 flex items-center gap-1" style={{ color: '#ef4444', fontSize: '11px' }}>
          <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#ef4444' }} />
          {errorMessage || 'Este campo es obligatorio'}
        </p>
      )}
    </div>
  );
}
