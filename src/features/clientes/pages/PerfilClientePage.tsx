import { User, Phone, MapPin, Mail, CreditCard, Star, ShieldCheck, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { useClientes } from "../hooks/useClientes";
import { Button } from "../../../shared/components/button";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { toast } from "sonner";

export function PerfilClientePage() {
    const { user, updateUser } = useEmailAuth();
    const { mascotas } = useMascotas();
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        cedula: ''
    });

    const { clientes, actualizarCliente, loading: updating } = useClientes();
    const clienteData = clientes.find(c => c.id_cliente === user?.id_cliente);
    const misMascotas = mascotas.filter(m => m.id_cliente === user?.id_cliente);

    useEffect(() => {
        if (clienteData) {
            setEditFormData({
                nombre: clienteData.nombre || '',
                telefono: clienteData.telefono || '',
                direccion: clienteData.direccion || '',
                cedula: clienteData.cedula || user?.cedula || ''
            });
        }
    }, [clienteData, isEditing, user]);

    const handleSave = async () => {
        if (!user?.id_cliente) return;
        try {
            const res = await actualizarCliente(user.id_cliente, editFormData);
            if (res.success) {
                updateUser({
                    nombre_completo: editFormData.nombre,
                    nombre_usuario: editFormData.nombre
                });
                toast.success("Perfil actualizado");
                setIsEditing(false);
            }
        } catch (err) {
            toast.error("Error de conexión");
        }
    };

    if (!clienteData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-dark-secondary">
                <User className="w-16 h-16 opacity-20 mb-4 animate-pulse" />
                <p className="font-bold tracking-widest uppercase text-sm">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="relative rounded-[4rem] p-10 shadow-2xl overflow-hidden group" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center text-white">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/20">Tu perfil KaiVet</span>
                        <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-emerald-500/30 text-emerald-300">Verificado</span>
                    </div>

                    {isEditing ? (
                        <input
                            className="bg-white/10 border-b-2 border-white/50 text-4xl font-black tracking-tighter text-center focus:outline-none w-full max-w-lg mb-2"
                            value={editFormData.nombre}
                            onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                        />
                    ) : (
                        <h1 className="text-5xl font-black tracking-tighter mb-2">{clienteData.nombre}</h1>
                    )}

                    <p className="text-blue-100/70 text-sm font-medium tracking-wide flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        KaiVet Premium Member
                    </p>

                    <div className="mt-6">
                        {isEditing ? (
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={updating}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-400/20 font-black text-sm px-10 py-6 rounded-[2rem] shadow-xl shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95"
                                >
                                    {updating ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                                </Button>
                                <Button onClick={() => setIsEditing(false)} variant="ghost" className="bg-white/10 text-white hover:bg-white/20 font-bold text-xs px-6 rounded-2xl border border-white/20">
                                    Cancelar
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={() => setIsEditing(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-black text-[10px] tracking-widest uppercase py-2 px-8 rounded-2xl">
                                Editar mi perfil
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
                        <h2 className="text-xl font-black text-dark-primary tracking-tight flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <User className="w-5 h-5 text-indigo-400" />
                            </div>
                            Datos de la cuenta
                        </h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Documento de identidad</p>
                                    <div className="flex items-center gap-3 bg-dark-hover/50 p-3 rounded-2xl border border-dark-color opacity-70">
                                        <CreditCard className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-bold text-dark-primary uppercase">{clienteData.cedula || 'No registrada'}</span>
                                    </div>
                                </div>

                                <div className="group">
                                    <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Teléfono móvil</p>
                                    {isEditing ? (
                                        <input
                                            className="w-full bg-dark-hover p-3 rounded-2xl border border-blue-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                            value={editFormData.telefono}
                                            onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                            <Phone className="w-4 h-4 text-emerald-400" />
                                            <span className="text-sm font-bold text-dark-primary">{clienteData.telefono || 'Sin teléfono'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="group">
                                <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Dirección residencial</p>
                                {isEditing ? (
                                    <input
                                        className="w-full bg-dark-hover p-3 rounded-2xl border border-blue-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                        value={editFormData.direccion}
                                        onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                        <MapPin className="w-4 h-4 text-rose-400" />
                                        <span className="text-sm font-bold text-dark-primary">{clienteData.direccion || 'Sin dirección registrada'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="group">
                                <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Correo electrónico</p>
                                <div className="flex items-center gap-3 bg-dark-hover/50 p-3 rounded-2xl border border-dark-color opacity-70">
                                    <Mail className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-bold text-dark-primary truncate">{user?.correo || 'No disponible'}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-2">
                    <section className="h-full bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl overflow-hidden relative group flex flex-col justify-center">
                        <div className="absolute top-0 right-0 p-6">
                            <Star className="w-20 h-20 text-blue-500/5 rotate-12 group-hover:scale-110 transition-transform" />
                        </div>

                        <h3 className="text-2xl font-black text-dark-primary mb-10 tracking-tight text-center lg:text-left">Actividad Reciente</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-dark-hover/50 p-6 rounded-[2.5rem] border border-dark-color flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
                                    <Star className="w-7 h-7 text-pink-400" />
                                </div>
                                <p className="text-sm font-bold text-dark-secondary mb-1">Mascotas en Sistema</p>
                                <span className="text-4xl font-black text-dark-primary">{misMascotas.length}</span>
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
