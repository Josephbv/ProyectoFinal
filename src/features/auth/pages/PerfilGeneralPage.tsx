import { Mail, CreditCard, Shield, Activity, Fingerprint, KeyRound, Clock, CheckCircle2, PenLine, X, Save, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { useUsuarios } from "../../configuracion/hooks/useUsuarios";
import { Button } from "../../../shared/components/button";
import { PawIcon } from "../../../shared/components/PawIcon";
import { toast } from "sonner";
import { esCedulaValida } from "../../../shared/utils/validators";

export function PerfilGeneralPage() {
    const { user, updateUser, logout } = useEmailAuth();
    const { usuarios, actualizarUsuario, loading: updating } = useUsuarios();
    const [isEditing, setIsEditing] = useState(false);

    const [editFormData, setEditFormData] = useState({
        nombre_completo: '',
        nombre_usuario: '',
        correo: '',
        cedula: ''
    });

    useEffect(() => {
        if (user) {
            setEditFormData({
                nombre_completo: user.nombre_completo || user.nombre_usuario || '',
                nombre_usuario: user.nombre_usuario || '',
                correo: user.correo || '',
                cedula: user.cedula || ''
            });
        }
    }, [user, isEditing]);

    const handleSave = async () => {
        if (!user?.id_usuario) return;
        if (!editFormData.nombre_completo.trim() || !editFormData.nombre_usuario.trim()) {
            toast.error("Los campos de nombre no pueden estar vacíos");
            return;
        }
        if (!editFormData.correo.trim()) {
            toast.error("El correo electrónico no puede estar vacío");
            return;
        }
        if (!editFormData.cedula.trim()) {
            toast.error("El número de identificación no puede estar vacío");
            return;
        }
        if (!esCedulaValida(editFormData.cedula)) {
            toast.error("Identificación no válida (Debe tener entre 6 y 15 dígitos y no más de 3 números repetidos continuamente)");
            return;
        }

        // Validar duplicados en lista local de usuarios
        const dupCorreo = usuarios.some(u =>
            u.id_usuario !== user?.id_usuario &&
            u.correo?.toLowerCase().trim() === editFormData.correo.toLowerCase().trim()
        );
        if (dupCorreo) {
            toast.error("El correo electrónico ya está registrado por otro usuario.");
            return;
        }
        const dupCedula = usuarios.some(u =>
            u.id_usuario !== user?.id_usuario &&
            u.cedula?.trim() === editFormData.cedula.trim()
        );
        if (dupCedula) {
            toast.error("El número de identificación ya está registrado por otro usuario.");
            return;
        }

        try {
            const emailChanged = editFormData.correo.toLowerCase().trim() !== (user.correo || '').toLowerCase().trim();

            const result = await actualizarUsuario(user.id_usuario, {
                nombre_completo: editFormData.nombre_completo,
                nombre_usuario: editFormData.nombre_usuario,
                correo: editFormData.correo,
                cedula: editFormData.cedula,
                id_rol: (user as any).id_rol || 1,
                estado: 'activo',
                activo: true
            });

            if (!result.success) {
                const errMsg = result.error || '';
                if (errMsg.includes('correo') || errMsg.includes('email') || errMsg.includes('Mail')) {
                    toast.error("El correo electrónico ya está registrado por otro usuario.");
                } else if (errMsg.includes('cedula') || errMsg.includes('documento') || errMsg.includes('identificacion')) {
                    toast.error("El número de identificación ya está registrado por otro usuario.");
                } else {
                    toast.error(errMsg || "Error al actualizar el perfil");
                }
                return;
            }

            if (emailChanged) {
                localStorage.setItem('pending_email_verification', editFormData.correo);
                toast.info("Correo de confirmación enviado a " + editFormData.correo);
                logout();
                return;
            }

            updateUser({
                nombre_completo: editFormData.nombre_completo,
                nombre_usuario: editFormData.nombre_usuario,
                cedula: editFormData.cedula
            });
            toast.success("Información actualizada exitosamente");
        } catch (err) {
            toast.error("Error al guardar cambios");
        }

        setIsEditing(false);
    };

    if (!user) return null;

    const initials = (user.nombre_completo || user.nombre_usuario || 'U').substring(0, 2).toUpperCase();

    return (
        <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ─── HERO CARD ───────────────────────────────────── */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-6" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 40%, #6366f1 100%)' }}>
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-400/10 rounded-full -ml-16 -mb-16"></div>
                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl"></div>

                <div className="relative z-10 p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                                <span className="text-3xl lg:text-4xl font-black text-white">{initials}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg border-2 border-blue-600 flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[9px] font-black tracking-[0.15em] uppercase border border-white/20 text-white/80">
                                    Mi Cuenta
                                </span>
                                <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full text-[9px] font-black tracking-[0.15em] uppercase border border-emerald-400/30 text-emerald-300">
                                    {user.rol || 'Usuario'}
                                </span>
                            </div>

                            {isEditing ? (
                                <div className="space-y-3 max-w-lg mx-auto lg:mx-0">
                                    <div>
                                        <label className="text-[9px] font-black tracking-[0.15em] text-white/50 block mb-1">Nombre Completo</label>
                                        <input
                                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-lg font-bold text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 transition-all"
                                            value={editFormData.nombre_completo}
                                            onChange={(e) => setEditFormData({ ...editFormData, nombre_completo: e.target.value })}
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black tracking-[0.15em] text-white/50 block mb-1">Usuario (Alias)</label>
                                        <input
                                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-base font-bold text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 transition-all"
                                            value={editFormData.nombre_usuario}
                                            onChange={(e) => setEditFormData({ ...editFormData, nombre_usuario: e.target.value })}
                                            placeholder="Alias de usuario"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-1">
                                        {user.nombre_completo || user.nombre_usuario}
                                    </h1>
                                    <p className="text-blue-200/60 text-sm font-bold">@{user.nombre_usuario}</p>
                                </>
                            )}
                        </div>

                        {/* Action Area */}
                        <div className="shrink-0 flex gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={updating}
                                        style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', cursor: 'pointer', opacity: updating ? 0.7 : 1 }}
                                        className="font-bold px-5 py-2 rounded-xl shadow-lg gap-2 text-xs flex items-center"
                                    >
                                        <Save className="w-4 h-4" />
                                        {updating ? 'Guardando...' : 'Guardar'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                        className="font-bold px-4 py-2 rounded-xl text-xs flex items-center hover:bg-white/10"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                    className="font-bold text-xs tracking-wider uppercase py-2.5 px-6 rounded-xl flex items-center gap-2 hover:bg-white/20"
                                >
                                    <PenLine className="w-3.5 h-3.5" /> Editar Perfil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── STATS GRID ──────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Rol', value: user.rol || 'N/A', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { label: 'Estado', value: 'Activa', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: true },
                    { label: 'Documento', value: user.cedula || '---', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    { label: 'ID Sesión', value: `#${user.id_usuario}`, icon: KeyRound, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                ].map((stat, i) => (
                    <div key={i} className={`dark-card p-4 border ${stat.border} hover:scale-[1.02] transition-transform cursor-default`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 ${stat.bg} rounded-lg flex items-center justify-center`}>
                                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                            </div>
                            <p className="text-[9px] font-black text-dark-secondary tracking-widest">{stat.label}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {stat.dot && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>}
                            <p className="text-sm font-black text-dark-primary truncate">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── DETAIL CARDS ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Correo de Acceso */}
                <div className="dark-card p-5 border-blue-500/10 hover:border-blue-500/30 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-dark-secondary tracking-widest">Correo Electrónico</p>
                            <p className="text-xs text-dark-secondary/50">Acceso principal</p>
                        </div>
                    </div>
                    {isEditing ? (
                        <>
                            <input
                                type="email"
                                className="w-full bg-dark-hover p-3 rounded-xl border border-blue-500/30 text-sm font-bold text-dark-primary focus:outline-none focus:border-blue-500/60 transition-all"
                                value={editFormData.correo}
                                onChange={(e) => setEditFormData({ ...editFormData, correo: e.target.value })}
                                placeholder="nuevo@correo.com"
                            />
                            <p className="text-[9px] text-amber-400/70 mt-2 italic flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Cambiar el correo cerrará tu sesión para confirmación
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="bg-dark-hover/50 rounded-xl p-3 border border-dark-color">
                                <p className="text-sm font-bold text-dark-primary truncate">{user.correo || 'No disponible'}</p>
                            </div>
                            <p className="text-[9px] text-dark-secondary/40 mt-2 italic">Editable desde "Editar Perfil"</p>
                        </>
                    )}
                </div>

                {/* Número de Identificación */}
                <div className="dark-card p-5 border-purple-500/10 hover:border-purple-500/30 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Fingerprint className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-dark-secondary tracking-widest">Número de Identificación</p>
                            <p className="text-xs text-dark-secondary/50">Documento de identidad</p>
                        </div>
                    </div>
                    {isEditing ? (
                        <input
                            className="w-full bg-dark-hover p-3 rounded-xl border border-purple-500/30 text-sm font-bold text-dark-primary focus:outline-none focus:border-purple-500/60 transition-all"
                            value={editFormData.cedula}
                            onChange={(e) => setEditFormData({ ...editFormData, cedula: e.target.value })}
                            placeholder="Ej: 1234567890"
                        />
                    ) : (
                        <>
                            <div className="bg-dark-hover/50 rounded-xl p-3 border border-dark-color">
                                <p className="text-sm font-bold text-dark-primary">{user.cedula || '---'}</p>
                            </div>
                            <p className="text-[9px] text-dark-secondary/40 mt-2 italic">Editable desde "Editar Perfil"</p>
                        </>
                    )}
                </div>

                {/* Seguridad */}
                <div className="dark-card p-5 border-emerald-500/10 hover:border-emerald-500/30 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-dark-secondary tracking-widest">Nivel de Seguridad</p>
                            <p className="text-xs text-dark-secondary/50">Protección de cuenta</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between bg-dark-hover/50 rounded-xl p-3 border border-dark-color">
                            <span className="text-xs text-dark-secondary">Contraseña</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Configurada</span>
                        </div>
                        <div className="flex items-center justify-between bg-dark-hover/50 rounded-xl p-3 border border-dark-color">
                            <span className="text-xs text-dark-secondary">Sesión</span>
                            <span className="text-xs font-bold text-blue-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Activa</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── FOOTER ──────────────────────────────────────── */}
            <div className="mt-6 flex items-center justify-center gap-3 opacity-30">
                <PawIcon className="w-4 h-4 text-blue-400" />
                <p className="text-[9px] font-black text-dark-secondary uppercase tracking-[0.2em]">
                    KaiVet Security System • Sesión #{user.id_usuario}
                </p>
            </div>
        </div>
    );
}
