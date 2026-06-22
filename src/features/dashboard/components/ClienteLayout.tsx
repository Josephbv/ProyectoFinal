import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Heart,
    Calendar,
    User,
    LogOut,
    Moon,
    Sun,
    Stethoscope,
    Eye,
    DollarSign,
    BarChart3,
    Users,
    Clock,
    Wrench,
    Shield,
    FileText,
    Home,
    Settings,
    Command
} from "lucide-react";
import { useTheme } from "../../../shared/hooks/useTheme";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { apiFetch } from "../../../shared/hooks/apiFetch";
import { Button } from "../../../shared/components/button";
import { Switch } from "../../../shared/components/switch";
import { PawIcon } from "../../../shared/components/PawIcon";

// Vistas disponibles
import { PerfilClientePage } from "../../clientes/pages/PerfilClientePage";
import { MascotasPage } from "../../mascotas/pages/MascotasPage";
import { AgendamientoPage } from "../../agendamiento/pages/AgendamientoPage";
import { HistorialMascotasPage } from "../../historial/pages/HistorialMascotasPage";
import { VentasPage } from "../../ventas/pages/VentasPage";
import { MascotaFormPageWrapper as MascotaFormPage } from "../../mascotas/pages/MascotaFormPageWrapper";
import { DashboardUnificado } from "../pages/DashboardUnificado";
import { ServiciosPage } from "../../servicios/pages/ServiciosPage";
import { HorarioPage } from "../../empleados/pages/HorarioPage";

interface ClienteLayoutProps {
    onLogout: () => void;
}

// Catálogo COMPLETO de módulos del sistema con sus iconos.
// El admin puede asignar cualquiera de estos al rol Cliente.
const MODULE_CATALOG: Record<string, { label: string; icon: any }> = {
    "Dashboard":           { label: "Dashboard",           icon: BarChart3   },
    "Ventas":              { label: "Ventas",              icon: DollarSign  },
    "Clientes":            { label: "Clientes",            icon: Users       },
    "Agendamiento":        { label: "Agendamiento",        icon: Calendar    },
    "Mascotas":            { label: "Mascotas",            icon: Heart       },
    "Historial Mascotas":  { label: "Historial Mascotas",  icon: Stethoscope },
    "Horario":             { label: "Horario",             icon: Clock       },
    "Servicios":           { label: "Servicios",           icon: Wrench      },
    "Empleados":           { label: "Empleados",           icon: User        },
    "Roles":               { label: "Roles",               icon: Shield      },
    "Usuarios":            { label: "Usuarios",            icon: Users       },
};

export function ClienteLayout({ onLogout }: ClienteLayoutProps) {
    const { theme, toggleTheme } = useTheme();
    const { user } = useEmailAuth();
    const [activePage, setActivePage] = useState("");
    const [mascotaAEditar, setMascotaAEditar] = useState<any>(null);
    // Módulos obtenidos EN TIEMPO REAL desde el backend (null = aún cargando)
    const [roleModules, setRoleModules] = useState<string[] | null>(null);

    // Consulta la API cada vez que el layout se monta para obtener los módulos
    // actuales del rol — así los cambios del admin se reflejan sin re-login.
    const cargarModulosDelRol = useCallback(async () => {
        const idRol = user?.id_rol;
        if (!idRol) return;
        try {
            const data = await apiFetch(`/api/roles/${idRol}`);
            const mods: string[] =
                data?.modulos ||
                data?.Modulos ||
                (data?.idPermisos || data?.IdPermisos || [])
                    .filter((p: any) => p !== null)
                    .map((p: any) => p.nombreModulo || p.NombreModulo || p.descripcion || p.Descripcion || '');
            setRoleModules(mods.filter(Boolean));
        } catch (e) {
            console.warn('[ClienteLayout] No se pudo obtener módulos del rol, usando caché.', e);
            setRoleModules(null);
        }
    }, [user?.id_rol]);

    useEffect(() => {
        cargarModulosDelRol();
    }, [cargarModulosDelRol]);

    // navItems: usa módulos FRESCOS de la API. Si la API falla, usa caché del localStorage.
    // Respeta exactamente lo que el admin configuró — cualquier módulo es válido.
    const navItems = useMemo(() => {
        const mods = roleModules ?? (user?.modulos || []);
        return mods
            .filter(m => MODULE_CATALOG[m]) // solo mostrar módulos conocidos
            .map(m => ({ id: m, ...MODULE_CATALOG[m] }));
    }, [roleModules, user?.modulos]);

    const visibleMainNav = useMemo(() => navItems.filter(item => item.id === "Dashboard"), [navItems]);
    const visibleMascotasItems = useMemo(() => navItems.filter(item => ["Agendamiento", "Mascotas", "Historial Mascotas"].includes(item.id)), [navItems]);
    const visibleOperationsItems = useMemo(() => navItems.filter(item => ["Ventas", "Clientes", "Horario", "Servicios"].includes(item.id)), [navItems]);
    const visibleConfigItems = useMemo(() => navItems.filter(item => ["Empleados", "Roles", "Usuarios"].includes(item.id)), [navItems]);

    const renderNavItem = (item: any) => {
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
    };

    // Auto-dirección al primer módulo permitido al iniciar
    useEffect(() => {
        if (navItems.length > 0 && !activePage) {
            setActivePage(navItems[0].id);
        }
    }, [navItems, activePage]);

    const renderContent = () => {
        switch (activePage) {
            case "Dashboard":
                return <DashboardUnificado />;
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
            case "Agendamiento":
                return <AgendamientoPage onNavigate={setActivePage} />;
            case "Historial Mascotas":
                return <HistorialMascotasPage />;
            case "Ventas":
                return <VentasPage onNewSale={() => {}} onVentaCerrada={() => {}} />;
            case "Servicios":
                return <ServiciosPage />;
            case "Horario":
                return <HorarioPage
                    onNewHorario={() => {}}
                    onEditHorario={() => {}}
                />;
            case "Perfil":
                return <PerfilClientePage />;
            default:
                return (
                    <div className="p-8 text-center text-dark-secondary">
                        <PawIcon className="w-16 h-16 mx-auto mb-4 text-blue-500/20" />
                        <h2 className="text-xl font-bold text-dark-primary">Bienvenido a KaiVet</h2>
                        <p className="mt-2 text-sm">Selecciona un módulo del menú lateral para comenzar.</p>
                    </div>
                );
        }
    };

    return (
        <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* Sidebar del Cliente - Dinámico y estilizado */}
            <aside className="w-60 bg-dark-card border-r border-dark-color flex flex-col shadow-2xl z-20">
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

                {/* Navegación dinámica — refleja exactamente el rol configurado por el admin */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {navItems.length === 0 ? (
                        <p className="text-xs text-dark-secondary text-center py-8">No tienes módulos asignados.</p>
                    ) : (
                        <div className="space-y-6">
                            {/* Principal Group */}
                            {visibleMainNav.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-3 mb-2">
                                        <h3 className="text-xs font-semibold text-dark-secondary tracking-wider flex items-center gap-2">
                                            <Home className="w-3.5 h-3.5" />
                                            Principal
                                        </h3>
                                    </div>
                                    {visibleMainNav.map(renderNavItem)}
                                </div>
                            )}

                            {visibleMainNav.length > 0 && (visibleMascotasItems.length > 0 || visibleOperationsItems.length > 0 || visibleConfigItems.length > 0) && (
                                <div className="h-px bg-dark-border/10 my-4" />
                            )}

                            {/* Gestión Clínica Group */}
                            {visibleMascotasItems.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-3 mb-2">
                                        <h3 className="text-xs font-semibold text-dark-secondary tracking-wider flex items-center gap-2">
                                            <Heart className="w-3.5 h-3.5" />
                                            Gestión Clínica
                                        </h3>
                                    </div>
                                    {visibleMascotasItems.map(renderNavItem)}
                                </div>
                            )}

                            {visibleMascotasItems.length > 0 && (visibleOperationsItems.length > 0 || visibleConfigItems.length > 0) && (
                                <div className="h-px bg-dark-border/10 my-4" />
                            )}

                            {/* Operaciones Group */}
                            {visibleOperationsItems.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-3 mb-2">
                                        <h3 className="text-xs font-semibold text-dark-secondary tracking-wider flex items-center gap-2">
                                            <Settings className="w-3.5 h-3.5" />
                                            Operaciones
                                        </h3>
                                    </div>
                                    {visibleOperationsItems.map(renderNavItem)}
                                </div>
                            )}

                            {visibleOperationsItems.length > 0 && visibleConfigItems.length > 0 && (
                                <div className="h-px bg-dark-border/10 my-4" />
                            )}

                            {/* Configuración Group */}
                            {visibleConfigItems.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-3 mb-2">
                                        <h3 className="text-xs font-semibold text-dark-secondary tracking-wider flex items-center gap-2">
                                            <Command className="w-3.5 h-3.5" />
                                            Configuración
                                        </h3>
                                    </div>
                                    {visibleConfigItems.map(renderNavItem)}
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                {/* Footer del Sidebar */}
                <div className="p-4 border-t border-dark-color space-y-3">
                    <div className="flex items-center justify-between bg-dark-hover/50 rounded-2xl p-3 border border-dark-color">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative shrink-0">
                                <User className="w-4 h-4 text-white" />
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-dark-card"></div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-dark-primary truncate">
                                    {user?.nombre_completo || user?.nombre_usuario || 'Cliente'}
                                </p>
                                <p className="text-[10px] text-blue-400 truncate">{user?.rol || 'Cliente'}</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setActivePage("Perfil")}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 hover:bg-blue-500/10 rounded-full text-blue-400 shrink-0 ${activePage === "Perfil" ? "bg-blue-500/10" : ""}`}
                            title="Ver mi perfil"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center justify-between bg-dark-hover rounded-xl px-3 py-2 border border-dark-color scale-95 origin-center">
                        <div className="flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                            <span className="text-xs text-dark-primary">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                        </div>
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-400 scale-75"
                        />
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-xs"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Area de Contenido Principal */}
            <main className="flex-1 overflow-y-auto bg-dark-bg relative">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-emerald-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                <div className="relative z-10 min-h-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
