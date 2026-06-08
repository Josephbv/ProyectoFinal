import { User, Phone, MapPin, Mail, CreditCard, Stethoscope, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { useEmpleados } from "../hooks/useEmpleados";
import { useUsuarios } from "../../configuracion/hooks/useUsuarios";
import { Button } from "../../../shared/components/button";
import { toast } from "sonner";
import { esCedulaValida, esTelefonoValido } from "../../../shared/utils/validators";

export function PerfilEmpleadoPage() {
    const { user, updateUser, logout } = useEmailAuth();
    const { empleados, actualizarEmpleado, loading: updating } = useEmpleados();
    const { actualizarUsuario } = useUsuarios();
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        cedula: '',
        correo: ''
    });

    const empleadoData = empleados.find(e => e.id_empleado === user?.id_empleado);

    useEffect(() => {
        if (empleadoData) {
            setEditFormData({
                nombre: empleadoData.nombre || '',
                telefono: empleadoData.telefono || '',
                direccion: empleadoData.direccion || '',
                cedula: empleadoData.cedula || user?.cedula || '',
                correo: empleadoData.correo || user?.correo || ''
            });
        }
    }, [empleadoData, isEditing, user]);

    const handleSave = async () => {
        if (!user?.id_empleado || !empleadoData) return;

        // Validaciones previas locales
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
        if (!editFormData.telefono.trim()) {
            toast.error("El teléfono no puede estar vacío");
            return;
        }
        if (!esTelefonoValido(editFormData.telefono)) {
            toast.error("El teléfono debe empezar con 3 y tener exactamente 10 dígitos");
            return;
        }

        // Validar duplicados locales
        const dupCorreo = empleados.some(e => 
            e.id_empleado !== user?.id_empleado && 
            e.correo?.toLowerCase().trim() === editFormData.correo.toLowerCase().trim()
        );
        if (dupCorreo) {
            toast.error("El correo electrónico ya está registrado por otro usuario.");
            return;
        }

        const dupCedula = empleados.some(e => 
            e.id_empleado !== user?.id_empleado && 
            e.cedula?.trim() === editFormData.cedula.trim()
        );
        if (dupCedula) {
            toast.error("El número de identificación ya está registrado por otro usuario.");
            return;
        }

        try {
            const res = await actualizarEmpleado(user.id_empleado, editFormData);
            if (!res.success) {
                const errMsg = res.error || '';
                if (errMsg.includes('correo') || errMsg.includes('email') || errMsg.includes('Mail')) {
                    toast.error("El correo electrónico ya está registrado por otro usuario.");
                } else if (errMsg.includes('cedula') || errMsg.includes('documento') || errMsg.includes('identificacion')) {
                    toast.error("El número de identificación ya está registrado por otro usuario.");
                } else {
                    toast.error(errMsg || "Error al actualizar el perfil");
                }
                return;
            }

            const emailChanged = editFormData.correo.toLowerCase().trim() !== (empleadoData.correo || '').toLowerCase().trim();

            if (emailChanged) {
                localStorage.setItem('pending_email_verification', editFormData.correo);
                
                if (user?.id_usuario) {
                    await actualizarUsuario(user.id_usuario, {
                        correo: editFormData.correo,
                        cedula: editFormData.cedula,
                        nombre_usuario: user.nombre_usuario || editFormData.nombre,
                        nombre_completo: editFormData.nombre,
                        id_rol: user.id_rol,
                        id_empleado: user.id_empleado,
                        estado: 'activo'
                    });
                }

                toast.info("Correo de confirmación enviado a " + editFormData.correo);
                logout();
                return;
            }

            if (user?.id_usuario) {
                await actualizarUsuario(user.id_usuario, {
                    cedula: editFormData.cedula,
                    nombre_usuario: user.nombre_usuario || editFormData.nombre,
                    nombre_completo: editFormData.nombre,
                    id_rol: user.id_rol,
                    id_empleado: user.id_empleado,
                    estado: 'activo'
                });
            }

            updateUser({
                nombre_completo: editFormData.nombre,
                nombre_usuario: editFormData.nombre,
                cedula: editFormData.cedula
            });
            toast.success("Perfil actualizado correctamente");
            setIsEditing(false);
        } catch (err) {
            toast.error("Error al guardar cambios");
        }
    };

    if (!empleadoData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-dark-secondary">
                <User className="w-16 h-16 opacity-20 mb-4 animate-pulse" />
                <p className="font-bold tracking-widest uppercase text-sm">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="relative rounded-[4rem] p-10 shadow-2xl overflow-hidden group" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0f766e 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center text-white">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/20">
                            Perfil KaiVet
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-emerald-500/30 text-emerald-200">
                            {empleadoData.cargo || 'Empleado'}
                        </span>
                    </div>

                    {isEditing ? (
                        <input
                            className="bg-white/10 border-b-2 border-white/50 text-4xl font-black tracking-tighter text-center focus:outline-none w-full max-w-lg mb-2"
                            value={editFormData.nombre}
                            onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                        />
                    ) : (
                        <h1 className="text-5xl font-black tracking-tighter mb-2">{empleadoData.nombre}</h1>
                    )}

                    <p className="text-emerald-100/70 text-sm font-medium tracking-wide flex items-center justify-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        KaiVet Staff Member
                    </p>

                    <div className="mt-6">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={updating}
                                    className="bg-white text-[#059669] hover:bg-white/90 font-black text-xs px-8 rounded-2xl"
                                >
                                    {updating ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                                <Button
                                    onClick={() => setIsEditing(false)}
                                    variant="ghost"
                                    className="text-white hover:bg-white/10 font-bold text-xs px-6 rounded-2xl"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-black text-[10px] tracking-widest uppercase py-2 px-8 rounded-2xl"
                            >
                                Editar mi perfil
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Datos de la cuenta */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
                        <h2 className="text-xl font-black text-dark-primary tracking-tight flex items-center gap-3 mb-8">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <User className="w-5 h-5 text-emerald-400" />
                            </div>
                            Datos de la cuenta
                        </h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Cédula - editable */}
                                <div className="group">
                                    <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Documento de Identidad</p>
                                    {isEditing ? (
                                        <input
                                            className="w-full bg-dark-hover p-3 rounded-2xl border border-emerald-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                            value={editFormData.cedula}
                                            onChange={(e) => setEditFormData({ ...editFormData, cedula: e.target.value })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                            <CreditCard className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-bold text-dark-primary uppercase">{empleadoData.cedula || 'No registrada'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Teléfono - editable */}
                                <div className="group">
                                    <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Teléfono Móvil</p>
                                    {isEditing ? (
                                        <input
                                            className="w-full bg-dark-hover p-3 rounded-2xl border border-emerald-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                            value={editFormData.telefono}
                                            onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                                            placeholder="Ej: 3001234567"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                            <Phone className="w-4 h-4 text-emerald-400" />
                                            <span className="text-sm font-bold text-dark-primary">{empleadoData.telefono || 'Sin teléfono'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dirección - editable */}
                            <div className="group">
                                <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Dirección Residencial</p>
                                {isEditing ? (
                                    <input
                                        className="w-full bg-dark-hover p-3 rounded-2xl border border-emerald-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                        value={editFormData.direccion}
                                        onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                                        placeholder="Ej: Calle 10 # 5-30"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                        <MapPin className="w-4 h-4 text-rose-400" />
                                        <span className="text-sm font-bold text-dark-primary">{empleadoData.direccion || 'Sin dirección registrada'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Correo - editable */}
                            <div className="group">
                                <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Correo Electrónico</p>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        className="w-full bg-dark-hover p-3 rounded-2xl border border-emerald-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                        value={editFormData.correo}
                                        onChange={(e) => setEditFormData({ ...editFormData, correo: e.target.value })}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                        <Mail className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm font-bold text-dark-primary truncate">{empleadoData.correo || user?.correo || 'No disponible'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Actividad */}
                <div className="lg:col-span-2">
                    <section className="h-full bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl overflow-hidden relative group flex flex-col justify-center">
                        <div className="absolute top-0 right-0 p-6">
                            <Stethoscope className="w-20 h-20 text-emerald-500/5 rotate-12 group-hover:scale-110 transition-transform" />
                        </div>

                        <h3 className="text-2xl font-black text-dark-primary mb-10 tracking-tight text-center lg:text-left">Información de Servicio</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-dark-hover/50 p-6 rounded-[2.5rem] border border-dark-color flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <Stethoscope className="w-7 h-7 text-emerald-400" />
                                </div>
                                <p className="text-sm font-bold text-dark-secondary mb-1">Cargo</p>
                                <span className="text-xl font-black text-dark-primary capitalize">{empleadoData.cargo || 'Sin cargo'}</span>
                            </div>

                            <div className="bg-dark-hover/50 p-6 rounded-[2.5rem] border border-dark-color flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                                    <Clock className="w-7 h-7 text-amber-400" />
                                </div>
                                <p className="text-sm font-bold text-dark-secondary mb-1">Último acceso</p>
                                <span className="text-lg font-black text-dark-primary uppercase">
                                    {user?.ultimo_acceso
                                        ? new Date(user.ultimo_acceso).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                                        : `Hoy, ${new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`
                                    }
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
