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
import { PawIcon } from "./PawIcon";
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
        {!sidebarCollapsed && item.shortcut && (
          <kbd className={`px-1.5 py-0.5 text-xs font-mono rounded border ${isActive ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-dark-tag border-dark-color text-dark-secondary group-hover:bg-dark-hover"
            }`}>
            {item.shortcut}
          </kbd>
        )}
      </button>
    );
  };

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardUnificado onNavigate={setActivePage} />;
      case "Ventas":
        return <VentasPage onNewSale={() => setActivePage("NuevaVenta")} />;
      case "Clientes":
        return <ClientesPage />;
      case "Agendamiento":
        return <AgendamientoPage />;
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
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-56'} bg-dark-card border-r border-dark-color flex flex-col transition-all duration-300 relative shadow-2xl`} style={{
        boxShadow: theme === 'light'
          ? '0 0 50px rgba(59, 130, 246, 0.1)'
          : '0 0 50px rgba(0, 0, 0, 0.3)'
      }}>

        {/* Toggle Button */}
        <Button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-dark-card border border-dark-color rounded-full p-0 hover:bg-dark-hover"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
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
                <p className="text-xs text-dark-secondary font-medium">v1.0.0 • Gestión Integral</p>
              </div>
            )}
          </div>
        </div>

        {/* Command Palette Search */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-dark-color">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-secondary" />
              <Input
                placeholder="Buscar módulos... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-dark-hover border-dark-color text-dark-primary placeholder-dark-secondary pl-10 pr-10 focus:border-dark-cta focus:bg-dark-hover"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="px-1.5 py-0.5 text-xs font-mono text-dark-secondary bg-dark-card border border-dark-color rounded">⌘K</kbd>
              </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="mt-2 bg-dark-card border border-dark-color rounded-lg max-h-48 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredItems.map(item => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setActivePage(item.label);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 w-full px-2 py-2 text-left text-sm text-dark-secondary hover:text-dark-primary hover:bg-dark-hover rounded"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-dark-secondary">
                    No se encontraron módulos
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
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

        {/* User Profile & Status */}
        <div className={`p-4 border-t border-dark-color ${sidebarCollapsed ? 'px-2' : ''}`}>
          <div className={`bg-dark-hover/50 backdrop-blur-sm rounded-xl p-3 border border-dark-color ${sidebarCollapsed ? 'px-2' : ''}`}>
            {sidebarCollapsed ? (
              // Collapsed view
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative">
                  <User className="w-4 h-4 text-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-dark-card"></div>
                </div>
                {onLogout && (
                  <Button
                    onClick={onLogout}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              // Expanded view
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-card"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-dark-primary truncate" title={user?.nombre_usuario || user?.nombre_completo || 'Usuario'}>
                      {user?.nombre_usuario || user?.nombre_completo || 'Usuario'}
                    </p>
                    <p className="text-xs text-dark-secondary truncate text-blue-400 font-medium">
                      {user?.rol || 'Sin Rol'}
                      <span className="text-dark-secondary font-normal"> • {user?.estado === 'activo' ? 'Activo' : 'Online'}</span>
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-dark-hover rounded-lg p-2 text-center">
                    <div className="text-xs font-semibold text-green-400">10</div>
                    <div className="text-xs text-dark-secondary">Módulos</div>
                  </div>
                  <div className="bg-dark-hover rounded-lg p-2 text-center">
                    <div className="text-xs font-semibold text-blue-400">99.9%</div>
                    <div className="text-xs text-dark-secondary">Uptime</div>
                  </div>
                </div>

                {/* Theme Switcher */}
                <div className="bg-dark-hover rounded-lg p-2.5 mb-3 border border-dark-color">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-xs font-medium text-dark-primary">
                        {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                      </span>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-amber-500"
                    />
                  </div>
                </div>

                {onLogout && (
                  <Button
                    onClick={onLogout}
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{
        background: theme === 'light' ? 'transparent' : '#020617'
      }}>
        {/* Top bar */}
        <div className="h-14 backdrop-blur-sm border-b border-dark-color/50 flex items-center justify-between pl-24 pr-8 transition-colors duration-300 z-10 sticky top-0" style={{
          backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 23, 42, 0.3)',
          borderColor: theme === 'light' ? 'rgba(191, 219, 254, 0.5)' : 'rgba(51, 65, 85, 0.5)'
        }}>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-dark-primary">{activePage}</h2>
            <div className="h-4 w-px bg-dark-border"></div>
            <div className="flex items-center gap-2 text-sm text-dark-secondary">
              <Home className="w-4 h-4" />
              <span>/</span>
              <span className="text-blue-500">{activePage}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-300" style={{
              backgroundColor: theme === 'light' ? 'rgba(219, 234, 254, 0.5)' : 'rgba(30, 41, 59, 0.5)'
            }}>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-dark-secondary">Sistema operativo</span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 text-dark-secondary hover:text-dark-primary">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-dark-bg transition-colors duration-300">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
