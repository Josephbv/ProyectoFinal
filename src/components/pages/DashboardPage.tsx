import { Badge } from "../ui/badge";
import { Clock, TrendingUp, AlertCircle, DollarSign, Users, Calendar, Package } from "lucide-react";
import { useMemo } from "react";
import { useVentas } from "../hooks/useVentas";
import { useClientes } from "../hooks/useClientes";
import { useAgendamiento } from "../hooks/useAgendamiento";
import { VentasChart } from "../VentasChart";
import { ServiciosChart } from "../ServiciosChart";
import { CitasHoy } from "../CitasHoy";
import { ClientesRecientes } from "../ClientesRecientes";
import { AlertasInsumos } from "../AlertInsumos";

export function DashboardPage() {
  const { ventas } = useVentas();
  const { clientes } = useClientes();
  const { citas } = useAgendamiento();

  const metrics = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = ventas.filter(v => v.fecha?.startsWith(hoy)).reduce((acc, v) => acc + Number(v.total), 0);
    const citasHoy = citas.filter(c => c.fecha === hoy).length;

    return [
      {
        title: "Ventas Hoy",
        value: `$${ventasHoy.toLocaleString()}`,
        change: "+0%",
        icon: DollarSign,
        iconColor: "text-green-400",
        isPositive: true
      },
      {
        title: "Cantidad de Clientes",
        value: clientes.length.toString(),
        change: `+${clientes.length}`,
        icon: Users,
        iconColor: "text-blue-400",
        isPositive: true
      },
      {
        title: "Citas Hoy",
        value: citasHoy.toString(),
        change: `+${citasHoy}`,
        icon: Calendar,
        iconColor: "text-purple-400",
        isPositive: true
      },
      {
        title: "Servicios Totales",
        value: ventas.length.toString(),
        change: "+0",
        icon: Package,
        iconColor: "text-orange-400",
        isPositive: true
      },
    ];
  }, [ventas, clientes, citas]);

  const alertas = [
    {
      tipo: "Insumo",
      mensaje: "Stock base de fármacos actualizado",
      urgencia: "alta",
      tiempo: "Ahora"
    },
    {
      tipo: "Sistema",
      mensaje: "Conexión a SQL Server establecida",
      urgencia: "urgente",
      tiempo: "Hace 1 min"
    }
  ];

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "urgente":
        return "text-red-400 bg-red-900/20";
      case "alta":
        return "text-orange-400 bg-orange-900/20";
      default:
        return "text-blue-400 bg-blue-900/20";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-primary mb-2">Dashboard</h1>
            <p className="text-dark-secondary font-medium">Panel de Control en Tiempo Real - KaiVet</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="dark-tag">
              <Clock className="w-4 h-4 mr-2" />
              Sincronizado con SQL Server
            </div>
            <button className="dark-button-primary gap-2 flex items-center">
              <TrendingUp className="w-4 h-4" />
              Generar Reporte
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-dark-bg">
        {/* Top-level Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.title} className="dark-card hover:dark-shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-dark-tag flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${metric.iconColor}`} />
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`w-4 h-4 ${metric.isPositive ? 'text-dark-positive' : 'text-dark-negative'}`} />
                    <span className={`text-sm font-bold ${metric.isPositive ? 'text-dark-positive' : 'text-dark-negative'}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-dark-primary mb-2">{metric.value}</h3>
                  <p className="text-sm font-medium text-dark-secondary">{metric.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <VentasChart />
          </div>
          <div>
            <ServiciosChart />
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <CitasHoy />
          <ClientesRecientes />
        </div>

        {/* Alertas Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="dark-card">
              <div className="flex items-center justify-between pb-6">
                <div>
                  <h3 className="text-xl font-bold text-dark-primary mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    Alertas del Sistema
                  </h3>
                  <p className="text-dark-secondary font-medium">Notificaciones importantes que requieren atención</p>
                </div>
                <button className="dark-button-secondary">
                  Ver Todas
                </button>
              </div>
              <div className="space-y-4">
                {alertas.map((alerta, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-dark-hover border border-dark-color">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getUrgenciaColor(alerta.urgencia)}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold px-2 py-1 rounded ${getUrgenciaColor(alerta.urgencia)}`}>
                          {alerta.tipo.toUpperCase()}
                        </span>
                        <span className="text-xs text-dark-secondary">{alerta.tiempo}</span>
                      </div>
                      <p className="text-sm text-dark-primary font-medium">{alerta.mensaje}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <AlertasInsumos />
          </div>
        </div>
      </main>
    </>
  );
}
