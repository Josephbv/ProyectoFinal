import { useState } from "react";
import {
  BarChart3,
  Users,
  Calendar,
  Clock,
  Settings,
  Bell,
  User,
  DollarSign,
  Heart,
  FileText,
  Wrench,
  Shield,
  LogOut,
  Command,
  Search,
  Home,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import { PawIcon } from "./ui/PawIcon";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { useTheme } from "./hooks/useTheme";
import { useEmailAuth } from "./hooks/useEmailAuth";
import { VentasPage } from "./pages/VentasPage";
import { ClientesPage } from "./pages/ClientesPage";
import { AgendamientoPage } from "./pages/AgendamientoPage";
import { HorarioPage } from "./pages/HorarioPage";
import { DashboardUnificado } from "./pages/DashboardUnificado";
import { MascotasPage } from "./pages/MascotasPage";
import { HistorialMascotasPage } from "./pages/HistorialMascotasPage";
import { ServiciosPage } from "./pages/ServiciosPage";
import { EmpleadosPage } from "./pages/EmpleadosPage";
import { RolesPage } from "./pages/RolesPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import { NuevaVentaPage } from "./pages/NuevaVentaPage";
import { NuevoHorarioPage } from "./pages/NuevoHorarioPage";

const mainNavItems = [
  { icon: BarChart3, label: "Dashboard", active: true, shortcut: "⌘D" },
  { icon: DollarSign, label: "Ventas", shortcut: "⌘V" },
  { icon: Users, label: "Clientes", shortcut: "⌘C" },
  { icon: Calendar, label: "Agendamiento", shortcut: "⌘A" },
];

const mascotasItems = [
  { icon: Heart, label: "Mascotas", shortcut: "⌘M" },
  { icon: FileText, label: "Historial Mascotas", shortcut: "⌘H" },
];

const operationsItems = [
  { icon: Clock, label: "Horario", shortcut: "⌘O" },
  { icon: Wrench, label: "Servicios", shortcut: "⌘S" },
];

const configItems = [
  { icon: User, label: "Empleados", shortcut: "⌘U" },
  { icon: Shield, label: "Roles", shortcut: "⌘R" },
  { icon: Users, label: "Usuarios", shortcut: "⌘O" },
];

interface DashboardProps {
  onLogout?: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { user } = useEmailAuth();

  // State for passing data to edit pages
  const [horarioAEditar, setHorarioAEditar] = useState<any>(null);
  const [citaAPagar, setCitaAPagar] = useState<any>(null);

  // Filter nav items by user's allowed modules.
  // Fail-closed: If no modules are specified, only show "Dashboard" (or the first available).
  const filterByModules = (items: typeof mainNavItems) => {
    const modulos = user?.modulos;
    // Administrador role always has full access (fallback if modules list is missing)
    if (user?.rol?.toLowerCase() === 'administrador') return items;

    if (!modulos || modulos.length === 0) {
      // If no modules list, only show Dashboard as a safety measure
      return items.filter(item => item.label === "Dashboard");
    }
    return items.filter(item => modulos.includes(item.label));
  };

  const visibleMainNav = filterByModules(mainNavItems);
  const visibleMascotasItems = filterByModules(mascotasItems);
  const visibleOperationsItems = filterByModules(operationsItems);
  const visibleConfigItems = filterByModules(configItems);

  // Search: only over visible modules
  const allNavItems = [...visibleMainNav, ...visibleMascotasItems, ...visibleOperationsItems, ...visibleConfigItems];

  // Filtrar items basado en la búsqueda
  const filteredItems = searchQuery
    ? allNavItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const renderNavItem = (item: any, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => {
          setActivePage(item.label);
          setSearchQuery("");
        }}
        className={`group relative flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
          ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 shadow-lg shadow-blue-500/10"
          : "hover:bg-dark-hover border border-transparent"
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-blue-400" : "text-dark-secondary group-hover:text-dark-primary"
            }`} />
          {!sidebarCollapsed && (
            <span className={`font-medium text-sm ${isActive ? "text-blue-400" : "text-dark-primary"
              }`}>{item.label}</span>
          )}
        </div>

      </button>
    );
  };

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardUnificado onNavigate={setActivePage} />;
      case "Ventas":
        return (
          <VentasPage
            onNewSale={() => setActivePage("NuevaVenta")}
            citaAPagar={citaAPagar}
            onVentaCerrada={() => setCitaAPagar(null)}
          />
        );
      case "Clientes":
        return <ClientesPage />;
      case "Agendamiento":
        return (
          <AgendamientoPage
            onNavigate={setActivePage}
            onPagar={(cita) => {
              setCitaAPagar(cita);
              setActivePage("Ventas");
            }}
          />
        );
      case "Horario":
        return <HorarioPage
          onNewHorario={() => { setHorarioAEditar(null); setActivePage("NuevoHorario"); }}
          onEditHorario={(horario) => { setHorarioAEditar(horario); setActivePage("NuevoHorario"); }}
        />;
      case "Mascotas":
        return <MascotasPage />;
      case "Historial Mascotas":
        return <HistorialMascotasPage />;
      case "Servicios":
        return <ServiciosPage />;
      case "Empleados":
        return <EmpleadosPage />;
      case "Roles":
        return <RolesPage />;
      case "Usuarios":
        return <UsuariosPage />;
      case "NuevaVenta":
        return (
          <NuevaVentaPage
            onBack={() => setActivePage("Ventas")}
            onSuccess={() => setActivePage("Ventas")}
          />
        );
      case "NuevoHorario":
        return (
          <NuevoHorarioPage
            onBack={() => setActivePage("Horario")}
            onSuccess={() => setActivePage("Horario")}
            horarioAEditar={horarioAEditar}
          />
        );
      default:
        return <DashboardUnificado />;
    }
  };

  return (
    <div className="flex h-screen transition-colors duration-300" style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      background: theme === 'light'
        ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f5f3ff 100%)'
        : '#020617'
    }}>
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-56'} bg-dark-card border-r border-dark-color flex flex-col transition-all duration-300 relative shadow-2xl overflow-hidden`} style={{
        boxShadow: theme === 'light'
          ? '0 0 50px rgba(59, 130, 246, 0.1)'
          : '0 0 50px rgba(0, 0, 0, 0.3)'
      }}>

        {/* Toggle Button */}
        <Button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          variant="ghost"
          size="sm"
          className="absolute -right-4 top-6 z-10 w-8 h-8 bg-dark-card border-2 border-blue-500/40 rounded-full p-0 hover:bg-blue-500/20 shadow-md shadow-blue-500/10 flex items-center justify-center"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-blue-400" /> : <ChevronLeft className="w-4 h-4 text-blue-400" />}
        </Button>

        {/* Logo */}
        <div className={`p-6 border-b border-dark-color ${sidebarCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                <PawIcon className="w-6 h-6 text-white relative z-10" />
              </div>
              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-card flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-dark-primary">KaiVet Manager</h1>
              </div>
            )}
          </div>
        </div>



        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto overflow-x-hidden">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 mb-3">
                <h3 className="text-xs font-semibold text-dark-secondary uppercase tracking-wider flex items-center gap-2">
                  <Home className="w-3 h-3" />
                  Principal
                </h3>
              </div>
            )}
            {visibleMainNav.map((item) => renderNavItem(item, activePage === item.label))}
          </div>

          <Separator className="bg-dark-border/30" />

          {/* Mascotas Group */}
          {visibleMascotasItems.length > 0 && (
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-dark-secondary uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-3 h-3" />
                    Mascotas
                  </h3>
                </div>
              )}
              {visibleMascotasItems.map((item) => renderNavItem(item, activePage === item.label))}
            </div>
          )}

          {visibleMascotasItems.length > 0 && <Separator className="bg-dark-border/30" />}

          {/* Operations Group */}
          {visibleOperationsItems.length > 0 && (
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-dark-secondary uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-3 h-3" />
                    Operaciones
                  </h3>
                </div>
              )}
              {visibleOperationsItems.map((item) => renderNavItem(item, activePage === item.label))}
            </div>
          )}

          {visibleOperationsItems.length > 0 && <Separator className="bg-dark-border/30" />}

          {/* Configuration Group */}
          {visibleConfigItems.length > 0 && (
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-dark-secondary uppercase tracking-wider flex items-center gap-2">
                    <Command className="w-3 h-3" />
                    Sistema
                  </h3>
                </div>
              )}
              {visibleConfigItems.map((item) => renderNavItem(item, activePage === item.label))}
            </div>
          )}
        </nav>

        {/* User Profile - Fixed at bottom of sidebar */}
        <div className={`p-3 border-t border-dark-color shrink-0 ${sidebarCollapsed ? 'px-2' : ''}`}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative">
                <User className="w-4 h-4 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-dark-card"></div>
              </div>
              {onLogout && (
                <Button onClick={onLogout} variant="ghost" size="sm"
                  className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Cerrar sesión">
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Name & Role */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative shrink-0">
                  <User className="w-4 h-4 text-white" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-dark-card"></div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-dark-primary truncate">
                    {user?.nombre_usuario || user?.nombre_completo || 'Usuario'}
                  </p>
                  <p className="text-xs text-blue-400 truncate">{user?.rol || 'Sin Rol'}</p>
                </div>
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center justify-between bg-dark-hover rounded-lg px-2 py-1.5 border border-dark-color">
                <div className="flex items-center gap-1.5">
                  {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="text-xs text-dark-primary">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-amber-500 scale-75"
                />
              </div>

              {/* Logout */}
              {onLogout && (
                <Button onClick={onLogout} variant="ghost" size="sm"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start gap-2 h-8 text-xs">
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar Sesión
                </Button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{
        background: theme === 'light' ? 'transparent' : '#020617'
      }}>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-dark-bg transition-colors duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
