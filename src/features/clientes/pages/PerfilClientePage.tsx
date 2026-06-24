import { User, Phone, MapPin, Mail, CreditCard, Star, ShieldCheck, Clock, Calendar, Stethoscope, CheckCircle2, Dog } from "lucide-react";
import { useState, useEffect } from "react";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { useClientes } from "../hooks/useClientes";
import { Button } from "../../../shared/components/button";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { useAgendamiento } from "../../agendamiento/hooks/useAgendamiento";
import { useHorario } from "../../empleados/hooks/useHorario";
import { useUsuarios } from "../../configuracion/hooks/useUsuarios";
import { PerfilGeneralPage } from "../../auth/pages/PerfilGeneralPage";
import { toast } from "sonner";
import { Badge } from "../../../shared/components/badge";
import { esCedulaValida, esTelefonoValido, esNombreCompletoValido } from "../../../shared/utils/validators";

export function PerfilClientePage() {
    const { user, updateUser, logout } = useEmailAuth();
    const { mascotas } = useMascotas();
    const { clientes, actualizarCliente, loading: updating } = useClientes();
    const { actualizarUsuario } = useUsuarios();
    const { citas } = useAgendamiento();
    const { horarios } = useHorario();

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        cedula: '',
        correo: ''
    });

    const clienteData = clientes.find(c => c.id_cliente === user?.id_cliente);
    const misMascotas = mascotas.filter(m => m.id_cliente === user?.id_cliente);

    // Filtrar citas del cliente con manejo seguro de fechas
    const misCitas = (citas || [])
        .filter(c => c.id_cliente === user?.id_cliente)
        .sort((a, b) => {
            const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
            return fechaB - fechaA;
        });

    // Agrupar horarios de la clínica
    const horariosClinica = (horarios || []).reduce((acc, h) => {
        if (h.dia_semana && !acc[h.dia_semana]) acc[h.dia_semana] = h;
        return acc;
    }, {} as Record<string, any>);

    const diasOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    useEffect(() => {
        if (clienteData) {
            setEditFormData({
                nombre: clienteData.nombre || '',
                telefono: clienteData.telefono || '',
                direccion: clienteData.direccion || '',
                cedula: clienteData.cedula || user?.cedula || '',
                correo: clienteData.correo || user?.correo || ''
            });
        }
    }, [clienteData, isEditing, user]);

    const handleSave = async () => {
        if (!user?.id_cliente || !clienteData) return;

        // Validaciones previas locales
        if (!editFormData.nombre.trim()) {
            toast.error("El nombre completo no puede estar vacío");
            return;
        }
        if (!esNombreCompletoValido(editFormData.nombre)) {
            toast.error("Debes ingresar tu nombre y apellido completos (solo letras y espacios)");
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
        if (!editFormData.telefono.trim()) {
            toast.error("El teléfono no puede estar vacío");
            return;
        }
        if (!esTelefonoValido(editFormData.telefono)) {
            toast.error("El teléfono debe empezar con 3 y tener exactamente 10 dígitos");
            return;
        }

        // Validar duplicados locales
        const dupCorreo = clientes.some(c => 
            c.id_cliente !== user?.id_cliente && 
            c.correo?.toLowerCase().trim() === editFormData.correo.toLowerCase().trim()
        );
        if (dupCorreo) {
            toast.error("El correo electrónico ya está registrado por otro usuario.");
            return;
        }

        const dupCedula = clientes.some(c => 
            c.id_cliente !== user?.id_cliente && 
            c.cedula?.trim() === editFormData.cedula.trim()
        );
        if (dupCedula) {
            toast.error("El número de identificación ya está registrado por otro usuario.");
            return;
        }

        try {
            const payload = {
                ...clienteData,
                ...editFormData
            };
            const res = await actualizarCliente(user.id_cliente, payload);
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

            const emailChanged = editFormData.correo.toLowerCase().trim() !== (clienteData.correo || '').toLowerCase().trim();

            if (emailChanged) {
                localStorage.setItem('pending_email_verification', editFormData.correo);
                
                if (user?.id_usuario) {
                    await actualizarUsuario(user.id_usuario, {
                        correo: editFormData.correo,
                        cedula: editFormData.cedula,
                        nombre_usuario: user.nombre_usuario || editFormData.nombre,
                        nombre_completo: editFormData.nombre,
                        id_rol: user.id_rol,
                        id_cliente: user.id_cliente,
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
                    id_cliente: user.id_cliente,
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

    if (!clienteData) {
        if (updating) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-dark-secondary">
                    <User className="w-16 h-16 opacity-20 mb-4 animate-pulse" />
                    <p className="font-bold tracking-widest uppercase text-sm">Sincronizando información...</p>
                </div>
            );
        }
        return <PerfilGeneralPage />;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                                    className="bg-white text-blue-600 hover:bg-blue-50 font-black text-xs px-8 py-3 rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    {updating ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                                <Button
                                    onClick={() => setIsEditing(false)}
                                    variant="ghost"
                                    className="text-white hover:bg-white/10 font-bold text-xs px-6 rounded-2xl border border-white/20"
                                >
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Datos de la cuenta */}
                <section className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col">
                    <h2 className="text-xl font-black text-dark-primary tracking-tight flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <User className="w-5 h-5 text-indigo-400" />
                        </div>
                        Datos de contacto
                    </h2>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="group">
                                <p className="text-[9px] font-black text-dark-secondary tracking-[0.2em] uppercase mb-2 px-1 opacity-40">Documento de identidad</p>
                                {isEditing ? (
                                    <input
                                        className="w-full bg-dark-hover p-3 rounded-2xl border border-blue-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                        value={editFormData.cedula}
                                        onChange={(e) => setEditFormData({ ...editFormData, cedula: e.target.value })}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                        <CreditCard className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-bold text-dark-primary uppercase">{clienteData.cedula || 'No registrada'}</span>
                                    </div>
                                )}
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
                            {isEditing ? (
                                <input
                                    type="email"
                                    className="w-full bg-dark-hover p-3 rounded-2xl border border-blue-500/30 text-sm font-bold text-dark-primary focus:outline-none"
                                    value={editFormData.correo}
                                    onChange={(e) => setEditFormData({ ...editFormData, correo: e.target.value })}
                                />
                            ) : (
                                <div className="flex items-center gap-3 bg-dark-hover p-3 rounded-2xl border border-dark-color transition-all">
                                    <Mail className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-bold text-dark-primary truncate">{clienteData.correo || user?.correo || 'No disponible'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Mis Mascotas */}
                <section className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl flex flex-col">
                    <h3 className="text-xl font-black text-dark-primary mb-8 tracking-tight flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Dog className="w-5 h-5 text-blue-400" />
                            </div>
                            Mis Mascotas
                        </div>
                        <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase">
                            {misMascotas.length} {misMascotas.length === 1 ? 'Mascota' : 'Mascotas'}
                        </span>
                    </h3>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
                        {misMascotas.length > 0 ? (
                            misMascotas.map((m) => (
                                <div key={m.id_mascota} className="flex items-center justify-between p-3.5 bg-dark-hover/40 rounded-2xl border border-dark-color/50 hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-xl">
                                            {m.especie?.toLowerCase().includes('perro') ? '🐕' : m.especie?.toLowerCase().includes('gato') ? '🐈' : '🐾'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-dark-primary uppercase tracking-tight">{m.nombre}</p>
                                            <p className="text-[10px] text-dark-secondary flex items-center gap-1.5 mt-0.5">
                                                <span className="font-bold">{m.especie}</span>
                                                <span className="opacity-50">•</span>
                                                <span>{m.raza || 'Sin raza'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-[9px] font-mono text-dark-secondary opacity-40">#{m.id_mascota}</span>
                                        {m.edad !== null && m.edad !== undefined && (
                                            <span className="text-[10px] font-bold text-dark-secondary bg-dark-bg px-2 py-0.5 rounded-md border border-dark-color/50">
                                                {m.edad} {m.edad === 1 ? 'Mes' : 'Meses'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-10 text-center border border-dashed border-dark-color/50 rounded-2xl">
                                <Dog className="w-8 h-8 text-dark-secondary opacity-20 mb-2" />
                                <p className="text-xs font-bold text-dark-secondary uppercase tracking-wider">Sin mascotas</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Resumen y Horarios */}
                <section className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl flex flex-col">
                    <h3 className="text-xl font-black text-dark-primary mb-8 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        Horarios de Atención
                    </h3>

                    <div className="flex-1 space-y-3">
                        {diasOrdenados.map(dia => {
                            const horario = horariosClinica[dia];
                            return (
                                <div key={dia} className="flex items-center justify-between p-3 bg-dark-hover/40 rounded-2xl border border-dark-color/50">
                                    <span className="text-xs font-bold text-dark-primary">{dia}</span>
                                    {horario ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-0 font-mono text-[10px]">
                                                {horario.hora_inicio.substring(0, 5)} - {horario.hora_fin.substring(0, 5)}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-0 font-bold text-[10px] uppercase">Cerrado</Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Historial de Citas y Seguimiento */}
            <section className="bg-dark-card border border-dark-color rounded-[3.5rem] p-8 shadow-xl">
                <h3 className="text-2xl font-black text-dark-primary mb-10 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    Historial de Citas y Seguimiento Médico
                </h3>

                <div className="space-y-6">
                    {misCitas.length > 0 ? (
                        misCitas.map((cita: any, idx: number) => {
                            const fechaCita = cita.fecha ? new Date(cita.fecha) : new Date();
                            const idCita = cita.id_agendamiento || cita.idAgendamiento || cita.id_cita || idx;

                            return (
                                <div key={idCita} className="relative group p-6 bg-dark-hover/30 border border-dark-color rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-500">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex flex-col items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
                                                <span className="text-[10px] font-black uppercase opacity-60 bg-black/20 w-full text-center py-0.5">
                                                    {fechaCita.toLocaleString('es-ES', { month: 'short' })}
                                                </span>
                                                <span className="text-2xl font-black">
                                                    {fechaCita.getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-dark-primary uppercase tracking-tight flex items-center gap-2">
                                                    {cita.mascota?.nombre || cita.idMascotaNavigation?.nombre || 'Mascota'}
                                                    <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[10px]">
                                                        {cita.motivo || cita.motivoCita || 'Consulta'}
                                                    </Badge>
                                                </h4>
                                                <p className="text-sm text-dark-secondary italic">
                                                    {cita.especialista?.nombre || cita.idEmpleadoNavigation?.nombre || 'Médico Veterinario'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 flex-1 max-w-md">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-xl border border-dark-color">
                                                <Stethoscope className="w-4 h-4 text-indigo-400" />
                                                <span className="text-xs font-bold text-dark-secondary uppercase tracking-wider">Servicios Realizados:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {cita.servicios && Array.isArray(cita.servicios) ? (
                                                    cita.servicios
                                                        .filter((s: any) => s.realizado)
                                                        .map((s: any, sIdx: number) => (
                                                            <Badge key={sIdx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 py-1 px-3 flex items-center gap-2">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                {s.nombre || s.nombre_servicio || 'Servicio'}
                                                            </Badge>
                                                        ))
                                                ) : (
                                                    <span className="text-[10px] text-dark-secondary opacity-60 italic">Consulta general registrada</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            {(() => {
                                                const estadoFinal = (() => {
                                                    const isPagadoLocal = localStorage.getItem(`pagado_${cita.id_agendamiento}`) === 'true';
                                                    if (isPagadoLocal || cita.estado?.toLowerCase() === 'completada') return 'completada';
                                                    if (cita.estado?.toLowerCase() === 'cancelada') return 'cancelada';
                                                    if (cita.fecha) {
                                                        const hoyLocalStr = new Date().toLocaleDateString('en-CA');
                                                        if (cita.fecha < hoyLocalStr) return 'no_asistio';
                                                    }
                                                    return cita.estado?.toLowerCase() || 'activa';
                                                })();

                                                return (
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                        estadoFinal === 'completada' 
                                                            ? 'bg-green-900/20 text-green-400 border-green-500/30' 
                                                            : estadoFinal === 'cancelada'
                                                                ? 'bg-gray-900/20 text-gray-400 border-gray-500/30'
                                                                : estadoFinal === 'no_asistio'
                                                                    ? 'bg-red-900/20 text-red-400 border-red-500/30'
                                                                    : 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
                                                        }`}>
                                                        {estadoFinal === 'completada' ? 'Completada' : estadoFinal === 'cancelada' ? 'Cancelada' : estadoFinal === 'no_asistio' ? 'No Asistió' : 'Activa'}
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-xs font-mono text-dark-secondary opacity-40">Ref: #{idCita}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-dark-color/30 rounded-[3.5rem] bg-dark-hover/10">
                            <Calendar className="w-16 h-16 text-dark-secondary opacity-10 mx-auto mb-4" />
                            <p className="text-sm font-bold text-dark-secondary uppercase tracking-widest opacity-40">No tienes citas registradas aún</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

// Keep the rest of the file...
