import { useState, useMemo } from "react";
import {
    Heart,
    Calendar,
    User,
    LogOut,
    Moon,
    Sun,
    LayoutDashboard,
    Stethoscope,
    Bell,
    Settings
} from "lucide-react";
import { useTheme } from "../../../shared/hooks/useTheme";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { Button } from "../../../shared/components/button";
import { Switch } from "../../../shared/components/switch";
import { PawIcon } from "../../../shared/components/PawIcon";

// Vistas del cliente
import { PerfilClientePage } from "../../clientes/pages/PerfilClientePage";
import { MascotasPage } from "../../mascotas/pages/MascotasPage";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { AgendamientoPage } from "../../agendamiento/pages/AgendamientoPage";
import { HistorialMascotasPage } from "../../historial/pages/HistorialMascotasPage";
import { MascotaFormPageWrapper as MascotaFormPage } from "../../mascotas/pages/MascotaFormPageWrapper";

interface ClienteLayoutProps {
    onLogout: () => void;
}

export function ClienteLayout({ onLogout }: ClienteLayoutProps) {
    const [activePage, setActivePage] = useState("Inicio");
    const { theme, toggleTheme } = useTheme();
    const { user } = useEmailAuth();
    const { mascotas } = useMascotas();
    const [mascotaAEditar, setMascotaAEditar] = useState<any>(null);

    const misMascotasCount = useMemo(() => mascotas.length, [mascotas]);

    const navItems = [
        { id: "Inicio", label: "Mi Portal", icon: LayoutDashboard },
        { id: "Mascotas", label: "Mis Mascotas", icon: Heart },
        { id: "Citas", label: "Mis Citas", icon: Calendar },
        { id: "Historial", label: "Historial de Salud", icon: Stethoscope },
        { id: "Perfil", label: "Mi Información", icon: User },
    ];

    const renderContent = () => {
        switch (activePage) {
            case "Inicio":
                return (
                    <div className="p-8 space-y-8 animate-in fade-in duration-500">
                        <header>
                            <h1 className="text-3xl font-bold text-dark-primary">¡Hola, {user?.nombre_usuario || 'Bienvenido'}! 🐾</h1>
                            <p className="text-dark-secondary mt-1">Gestiona el bienestar de tu familia KaiVet desde aquí.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20 flex flex-col justify-between min-h-[160px]">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Próxima Cita</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Gestiona tus citas</h3>
                                    <button onClick={() => setActivePage("Citas")} className="text-sm font-semibold underline underline-offset-4 mt-2 hover:opacity-80">Ver calendario</button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/20 flex flex-col justify-between min-h-[160px]">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                        <Heart className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Familia KaiVet</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {misMascotasCount === 0
                                            ? "Registra a tu mascota"
                                            : `${misMascotasCount} ${misMascotasCount === 1 ? 'Mascota registrada' : 'Mascotas registradas'}`
                                        }
                                    </h3>
                                    <button onClick={() => setActivePage("Mascotas")} className="text-sm font-semibold underline underline-offset-4 mt-2 hover:opacity-80">
                                        {misMascotasCount === 0 ? "Comenzar ahora" : "Ver detalles"}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-3xl text-white shadow-xl shadow-purple-500/20 flex flex-col justify-between min-h-[160px]">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Notificaciones</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Todo al día</h3>
                                    <p className="text-sm opacity-80 mt-1 text-white/90">No tienes avisos nuevos</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-card border border-dark-color rounded-3xl p-8 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <PawIcon className="w-64 h-64 -mr-20 -mt-20" />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold text-dark-primary mb-4">Acceso Rápido</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <button onClick={() => setActivePage("Citas")} className="p-4 bg-dark-hover border border-dark-color rounded-2xl hover:border-blue-500/50 transition-all text-center group">
                                        <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-dark-primary">Nueva Cita</span>
                                    </button>
                                    <button onClick={() => setActivePage("Mascotas")} className="p-4 bg-dark-hover border border-dark-color rounded-2xl hover:border-emerald-500/50 transition-all text-center group">
                                        <Heart className="w-8 h-8 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-dark-primary">Mis Mascotas</span>
                                    </button>
                                    <button onClick={() => setActivePage("Historial")} className="p-4 bg-dark-hover border border-dark-color rounded-2xl hover:border-purple-500/50 transition-all text-center group">
                                        <Stethoscope className="w-8 h-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-dark-primary">Salud</span>
                                    </button>
                                    <button onClick={() => setActivePage("Perfil")} className="p-4 bg-dark-hover border border-dark-color rounded-2xl hover:border-amber-500/50 transition-all text-center group">
                                        <User className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-dark-primary">Mi Perfil</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "Mascotas":
                return <MascotasPage
                    onNewMascota={() => { setMascotaAEditar(null); setActivePage("MascotaForm"); }}
                    onEditMascota={(mascota) => { setMascotaAEditar(mascota); setActivePage("MascotaForm"); }}
                    onViewMascota={(mascota) => { setMascotaAEditar({ ...mascota, readOnly: true }); setActivePage("MascotaForm"); }}
                />;
            case "MascotaForm":
                return <MascotaFormPage
                    onBack={() => setActivePage("Mascotas")}
                    onSuccess={() => setActivePage("Mascotas")}
                    mascota={mascotaAEditar}
                    readOnly={mascotaAEditar?.readOnly || false}
                />;
            case "Citas":
                // El agendamiento del cliente está filtrado automáticamente por el hook que usa los datos del usuario logueado
                return <AgendamientoPage onNavigate={setActivePage} />;
            case "Historial":
                return <HistorialMascotasPage />;
            case "Perfil":
                return <PerfilClientePage />;
            default:
                return <div className="p-8 text-dark-primary">Próximamente...</div>;
        }
    };

    return (
        <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}>

            {/* Sidebar de Cliente - Más delgado y refinado */}
            <aside className="w-64 bg-dark-card border-r border-dark-color flex flex-col shadow-2xl z-20">
                <div className="p-6 border-b border-dark-color">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <PawIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-dark-primary">KaiVet</h2>
                            <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">Portal Cliente</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "text-dark-secondary hover:bg-dark-hover hover:text-dark-primary"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                                <span className="font-semibold text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-dark-color space-y-4">
                    {/* Theme Switcher */}
                    <div className="flex items-center justify-between bg-dark-hover rounded-2xl px-4 py-2 border border-dark-color">
                        <div className="flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                            <span className="text-xs font-bold text-dark-primary">{theme === 'dark' ? 'Noche' : 'Día'}</span>
                        </div>
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-400"
                        />
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-dark-bg relative">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-emerald-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                <div className="relative z-10 min-h-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
