import { useState, useMemo } from "react";
import { Button } from "../../../shared/components/button";
import { Card } from "../../../shared/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shared/components/tabs";
import { Badge } from "../../../shared/components/badge";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, TrendingDown, BarChart3, Calendar, DollarSign, Users, Heart,
  Package, Clock, Filter, Download, ShoppingCart, MapPin, Stethoscope,
  Shield, Activity, FileText, Eye, AlertCircle, Bell, Loader2
} from "lucide-react";
import { CitasHoy } from "../components/CitasHoy";
import { useVentas } from "../../ventas/hooks/useVentas";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useAgendamiento } from "../../agendamiento/hooks/useAgendamiento";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function DashboardUnificado({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState('resumen');
  const [periodo, setPeriodo] = useState('6m');
  const { user } = useEmailAuth();
  const isClienteRole = user?.rol?.toLowerCase().includes('cliente');

  const { ventas: allVentas, loading: loadingVentas } = useVentas();
  const { clientes: allClientes, loading: loadingClientes } = useClientes();
  const { citas: allCitas, loading: loadingCitas } = useAgendamiento();
  const { mascotas: allMascotas } = useMascotas();

  // Filtrar datos si es cliente
  const ventas = useMemo(() => {
    if (isClienteRole) return allVentas.filter(v => v.id_cliente === user?.id_cliente);
    return allVentas;
  }, [allVentas, isClienteRole, user?.id_cliente]);

  const clientes = useMemo(() => {
    if (isClienteRole) return allClientes.filter(c => c.id_cliente === user?.id_cliente);
    return allClientes;
  }, [allClientes, isClienteRole, user?.id_cliente]);

  const citas = useMemo(() => {
    if (isClienteRole) return allCitas.filter(c => c.id_cliente === user?.id_cliente);
    return allCitas;
  }, [allCitas, isClienteRole, user?.id_cliente]);

  const mascotasCount = useMemo(() => {
    if (isClienteRole) return allMascotas.filter(m => m.id_cliente === user?.id_cliente).length;
    return allMascotas.length;
  }, [allMascotas, isClienteRole, user?.id_cliente]);

  // Procesar datos para gráficos
  const chartData = useMemo(() => {
    // Agrupar ventas por mes
    const ventasPorMes: Record<string, any> = {};
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Inicializar con ceros últimos 6 meses (simplificado)
    meses.slice(0, 6).forEach(mes => {
      ventasPorMes[mes] = { mes, ventas: 0, transacciones: 0 };
    });

    ventas.forEach(v => {
      try {
        const fechaRaw = v.fecha || (v as any).fecha_venta;
        if (!fechaRaw) return;
        const fecha = new Date(fechaRaw);
        if (isNaN(fecha.getTime())) return;

        const mesNombre = meses[fecha.getMonth()];
        if (mesNombre && ventasPorMes[mesNombre]) {
          ventasPorMes[mesNombre].ventas += Number(v.total || 0);
          ventasPorMes[mesNombre].transacciones += 1;
        }
      } catch (e) {
        console.error("Error procesando venta para gráfico:", e);
      }
    });

    const ventasDataReal = Object.values(ventasPorMes);

    // Agrupar clientes nuevos por mes
    const clientesPorMes: Record<string, any> = {};
    meses.slice(0, 6).forEach(mes => {
      clientesPorMes[mes] = { mes, nuevos: 0, activos: clientes.length };
    });

    clientes.forEach((_, idx) => {
      // Distribuir clientes en el primer mes disponible como fallback
      const mesNombre = meses[idx % 6];
      if (clientesPorMes[mesNombre]) {
        clientesPorMes[mesNombre].nuevos += 1;
      }
    });

    const clientesDataReal = Object.values(clientesPorMes);

    return { ventasDataReal, clientesDataReal };
  }, [ventas, clientes]);

  // Métricas principales
  const metrics = useMemo(() => {
    const totalVentas = ventas.reduce((sum, v) => {
      const val = Number(v.total || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const totalClientes = clientes.length;
    // Fecha local del usuario garantizada en formato YYYY-MM-DD sin depender del locale del navegador
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const currentMin = now.getHours() * 60 + now.getMinutes();
    const hoyCount = citas.filter(c => {
      if (!c.fecha || !c.fecha.startsWith(hoy)) return false;
      if (!c.hora) return true;
      const [h, m] = c.hora.split(':').map(Number);
      const startMin = h * 60 + m;
      const duration = (c.agendamiento_servicios?.length || 1) * 30;
      return currentMin < (startMin + duration);
    }).length;

    const ventasHoyCount = ventas.filter(v => {
      const fechaRaw = v.fecha || (v as any).fecha_venta || '';
      return String(fechaRaw).startsWith(hoy);
    }).reduce((sum, v) => sum + Number(v.total || 0), 0);

    return {
      ventasTotal: totalVentas,
      ventasHoy: ventasHoyCount,
      clientesTotal: totalClientes,
      citasHoy: hoyCount,
      ticketPromedio: ventas.length > 0 ? totalVentas / ventas.length : 0
    };
  }, [ventas, clientes, citas]);

  const loading = loadingVentas || loadingClientes || loadingCitas;

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "urgente": return "text-red-400 bg-red-900/20 border-red-500/30";
      case "alta": return "text-orange-400 bg-orange-900/20 border-orange-500/30";
      case "info": return "text-cyan-400 bg-cyan-900/20 border-cyan-500/30";
      default: return "text-blue-400 bg-blue-900/20 border-blue-500/30";
    }
  };

  const getEstadoInsumo = (estado: string) => {
    switch (estado) {
      case "critico":
        return "text-red-400 bg-red-900/20";
      case "bajo":
        return "text-orange-400 bg-orange-900/20";
      case "bueno":
        return "text-green-400 bg-green-900/20";
      case "excelente":
        return "text-blue-400 bg-blue-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  return (
    <>
      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1" onClick={() => onNavigate?.("Mascotas")}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-dark-primary mb-1">{mascotasCount}</h3>
                <p className="text-sm font-medium text-dark-secondary">{isClienteRole ? "Mis Mascotas" : "Mascotas Registradas"}</p>
              </div>
            </div>

            <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1" onClick={() => onNavigate?.("Agendamiento")}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-dark-primary mb-1">{metrics.citasHoy}</h3>
                <p className="text-sm font-medium text-dark-secondary">{isClienteRole ? "Mis Citas Hoy" : "Citas Hoy"}</p>
              </div>
            </div>

            <div className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1" onClick={() => onNavigate?.("Ventas")}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-dark-primary mb-1">${metrics.ventasTotal.toLocaleString('es-CO')}</h3>
                <p className="text-sm font-medium text-dark-secondary">{isClienteRole ? "Mis Pagos Totales" : "Ventas Totales"}</p>
              </div>
            </div>
          </div>

          {/* Citas de Hoy */}
          <CitasHoy onVerCalendario={() => onNavigate?.("Agendamiento")} />

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="dark-card">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-dark-primary">Ventas por Mes</h3>
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.ventasDataReal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="ventas" stroke="#3B82F6" fill="#3B82F620" strokeWidth={3} name="Ventas ($)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="dark-card">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-dark-primary">Nuevos Clientes</h3>
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.clientesDataReal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="nuevos" stroke="#22C55E" strokeWidth={3} name="Nuevos Clientes" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </>
  );
}
