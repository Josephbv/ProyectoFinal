import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, BarChart3, Calendar, DollarSign, Users, Heart, 
  Package, Clock, Filter, Download, ShoppingCart, MapPin, Stethoscope,
  Shield, Activity, FileText, Eye
} from "lucide-react";

// Datos simulados para gráficos
const ventasData = [
  { mes: 'Ene', ventas: 45000, transacciones: 120, promedio: 375 },
  { mes: 'Feb', ventas: 52000, transacciones: 135, promedio: 385 },
  { mes: 'Mar', ventas: 48000, transacciones: 128, promedio: 375 },
  { mes: 'Abr', ventas: 61000, transacciones: 156, promedio: 391 },
  { mes: 'May', ventas: 55000, transacciones: 142, promedio: 387 },
  { mes: 'Jun', ventas: 67000, transacciones: 168, promedio: 399 }
];

const clientesData = [
  { mes: 'Ene', nuevos: 45, activos: 342, inactivos: 23, retencion: 94.2 },
  { mes: 'Feb', nuevos: 52, activos: 389, inactivos: 18, retencion: 95.1 },
  { mes: 'Mar', nuevos: 38, activos: 421, inactivos: 15, retencion: 95.8 },
  { mes: 'Abr', nuevos: 61, activos: 475, inactivos: 12, retencion: 96.2 },
  { mes: 'May', nuevos: 49, activos: 518, inactivos: 9, retencion: 96.8 },
  { mes: 'Jun', nuevos: 58, activos: 569, inactivos: 7, retencion: 97.1 }
];

const mascotasData = [
  { especie: 'Perros', cantidad: 45, porcentaje: 52.3 },
  { especie: 'Gatos', cantidad: 32, porcentaje: 37.2 },
  { especie: 'Aves', cantidad: 6, porcentaje: 7.0 },
  { especie: 'Conejos', cantidad: 2, porcentaje: 2.3 },
  { especie: 'Otros', cantidad: 1, porcentaje: 1.2 }
];

const citasData = [
  { dia: 'Lun', agendadas: 24, completadas: 22, canceladas: 2, pendientes: 0 },
  { dia: 'Mar', agendadas: 28, completadas: 26, canceladas: 1, pendientes: 1 },
  { dia: 'Mie', agendadas: 32, completadas: 30, canceladas: 2, pendientes: 0 },
  { dia: 'Jue', agendadas: 26, completadas: 24, canceladas: 1, pendientes: 1 },
  { dia: 'Vie', agendadas: 30, completadas: 28, canceladas: 2, pendientes: 0 },
  { dia: 'Sab', agendadas: 18, completadas: 17, canceladas: 1, pendientes: 0 }
];

const serviciosData = [
  { servicio: 'Consulta General', cantidad: 45, ingresos: 22500 },
  { servicio: 'Vacunación', cantidad: 38, ingresos: 11400 },
  { servicio: 'Cirugía', cantidad: 12, ingresos: 24000 },
  { servicio: 'Laboratorio', cantidad: 28, ingresos: 8400 },
  { servicio: 'Urgencias', cantidad: 15, ingresos: 15000 },
  { servicio: 'Peluquería', cantidad: 22, ingresos: 6600 }
];

const insumosData = [
  { categoria: 'Medicamentos', stock: 85, minimo: 20, valor: 45000 },
  { categoria: 'Alimentos', stock: 65, minimo: 15, valor: 23000 },
  { categoria: 'Instrumentos', stock: 95, minimo: 10, valor: 78000 },
  { categoria: 'Higiene', stock: 72, minimo: 25, valor: 12000 },
  { categoria: 'Accesorios', stock: 58, minimo: 20, valor: 18000 }
];

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function MedicionPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [periodo, setPeriodo] = useState('6m');

  // Métricas principales calculadas
  const metricsGenerales = useMemo(() => {
    const totalVentas = ventasData.reduce((sum, item) => sum + item.ventas, 0);
    const totalClientes = clientesData[clientesData.length - 1]?.activos || 0;
    const totalMascotas = mascotasData.reduce((sum, item) => sum + item.cantidad, 0);
    const totalCitas = citasData.reduce((sum, item) => sum + item.completadas, 0);

    return {
      ventas: { valor: totalVentas, cambio: 12.5, tipo: 'positivo' },
      clientes: { valor: totalClientes, cambio: 8.2, tipo: 'positivo' },
      mascotas: { valor: totalMascotas, cambio: 5.8, tipo: 'positivo' },
      citas: { valor: totalCitas, cambio: 15.3, tipo: 'positivo' }
    };
  }, []);

  const getIcon = (modulo: string) => {
    const icons = {
      ventas: <DollarSign className="w-6 h-6" />,
      clientes: <Users className="w-6 h-6" />,
      mascotas: <Heart className="w-6 h-6" />,
      citas: <Calendar className="w-6 h-6" />,
      servicios: <Stethoscope className="w-6 h-6" />,
      insumos: <Package className="w-6 h-6" />,
      domicilio: <MapPin className="w-6 h-6" />,
      roles: <Shield className="w-6 h-6" />,
      reportes: <FileText className="w-6 h-6" />
    };
    return icons[modulo as keyof typeof icons] || <BarChart3 className="w-6 h-6" />;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-dark-bg border-b border-dark-color px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-dark-primary">Centro de Medición KaiVet</h1>
            <p className="text-sm text-dark-secondary mt-1">
              Analytics avanzado y business intelligence para gestión veterinaria integral
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-3 py-2 bg-dark-hover border border-dark-color rounded-lg text-dark-primary focus:border-dark-cta focus:outline-none"
            >
              <option value="1m">Último mes</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="1y">Último año</option>
            </select>
            <button className="dark-button-secondary gap-2 flex items-center">
              <Filter className="w-4 h-4" />
              Filtros Avanzados
            </button>
            <button className="dark-button-primary gap-2 flex items-center">
              <Download className="w-4 h-4" />
              Exportar Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-dark-bg">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Ingresos Totales</p>
                <p className="text-2xl font-bold text-dark-primary">
                  ${metricsGenerales.ventas.valor.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">+{metricsGenerales.ventas.cambio}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Cantidad de Clientes</p>
                <p className="text-2xl font-bold text-dark-primary">{metricsGenerales.clientes.valor}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">+{metricsGenerales.clientes.cambio}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Mascotas Registradas</p>
                <p className="text-2xl font-bold text-dark-primary">{metricsGenerales.mascotas.valor}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-400">+{metricsGenerales.mascotas.cambio}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="dark-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-secondary">Citas Completadas</p>
                <p className="text-2xl font-bold text-dark-primary">{metricsGenerales.citas.valor}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-400">+{metricsGenerales.citas.cambio}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs para módulos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 bg-dark-card border border-dark-color">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="ventas" className="text-xs">Ventas</TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs">Clientes</TabsTrigger>
            <TabsTrigger value="mascotas" className="text-xs">Mascotas</TabsTrigger>
            <TabsTrigger value="citas" className="text-xs">Citas</TabsTrigger>
            <TabsTrigger value="servicios" className="text-xs">Servicios</TabsTrigger>
            <TabsTrigger value="insumos" className="text-xs">Insumos</TabsTrigger>
            <TabsTrigger value="operaciones" className="text-xs">Operaciones</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
          </TabsList>

          {/* Tab General */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Ingresos por Semanas</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ventasData}>
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
                      <Area type="monotone" dataKey="ventas" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Tipos de Mascotas Registradas</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mascotasData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, porcentaje }) => `${name} ${porcentaje}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {mascotasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Ventas */}
          <TabsContent value="ventas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Análisis de Ventas Mensuales</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ventasData}>
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
                      <Legend />
                      <Line type="monotone" dataKey="ventas" stroke="#22C55E" strokeWidth={3} name="Ingresos ($)" />
                      <Line type="monotone" dataKey="transacciones" stroke="#3B82F6" strokeWidth={2} name="Transacciones" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Ticket Promedio</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasData}>
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
                      <Bar dataKey="promedio" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Clientes */}
          <TabsContent value="clientes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Crecimiento de Base de Clientes</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <Users className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={clientesData}>
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
                      <Legend />
                      <Area type="monotone" dataKey="activos" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.8} name="Clientes Activos" />
                      <Area type="monotone" dataKey="nuevos" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Nuevos Clientes" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Tasa de Retención</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <Activity className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clientesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="mes" stroke="#94A3B8" />
                      <YAxis domain={[90, 100]} stroke="#94A3B8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E293B', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="retencion" stroke="#8B5CF6" strokeWidth={3} name="Retención (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Citas */}
          <TabsContent value="citas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Gestión Semanal de Citas</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={citasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="dia" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E293B', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="completadas" stackId="a" fill="#22C55E" name="Completadas" />
                      <Bar dataKey="canceladas" stackId="a" fill="#EF4444" name="Canceladas" />
                      <Bar dataKey="pendientes" stackId="a" fill="#F59E0B" name="Pendientes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="dark-card">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold text-dark-primary">Eficiencia de Atención</h3>
                  <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                    <Clock className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-green-400 mb-4">94.2%</div>
                    <div className="text-dark-secondary">Tasa de Finalización</div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-secondary">Tiempo promedio:</span>
                        <span className="text-dark-primary font-medium">28 min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-dark-secondary">Satisfacción:</span>
                        <span className="text-green-400 font-medium">4.8/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Servicios */}
          <TabsContent value="servicios" className="space-y-6">
            <Card className="dark-card">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-dark-primary">Servicios Más Demandados</h3>
                <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                  <Stethoscope className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviciosData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#94A3B8" />
                    <YAxis dataKey="servicio" type="category" stroke="#94A3B8" width={120} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="cantidad" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Tab Insumos */}
          <TabsContent value="insumos" className="space-y-6">
            <Card className="dark-card">
              <div className="flex items-center justify-between pb-4">
                <h3 className="text-lg font-semibold text-dark-primary">Control de Inventario</h3>
                <Button variant="outline" size="sm" className="border-dark-color text-dark-secondary">
                  <Package className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insumosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="categoria" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="stock" fill="#3B82F6" name="Stock Actual (%)" />
                    <Bar dataKey="minimo" fill="#EF4444" name="Stock Mínimo (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          {/* Tabs adicionales para otros módulos */}
          <TabsContent value="operaciones" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="dark-card text-center">
                <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">Servicios a Domicilio</h3>
                <div className="text-3xl font-bold text-blue-400">24</div>
                <div className="text-sm text-dark-secondary">Este mes</div>
              </Card>
              
              <Card className="dark-card text-center">
                <Clock className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">Horarios Activos</h3>
                <div className="text-3xl font-bold text-green-400">8</div>
                <div className="text-sm text-dark-secondary">Veterinarios</div>
              </Card>
              
              <Card className="dark-card text-center">
                <ShoppingCart className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">Pedidos Procesados</h3>
                <div className="text-3xl font-bold text-orange-400">156</div>
                <div className="text-sm text-dark-secondary">Último mes</div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="dark-card text-center">
                <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">Usuarios Activos</h3>
                <div className="text-3xl font-bold text-purple-400">12</div>
                <div className="text-sm text-dark-secondary">Personal registrado</div>
              </Card>
              
              <Card className="dark-card text-center">
                <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">Roles Configurados</h3>
                <div className="text-3xl font-bold text-red-400">3</div>
                <div className="text-sm text-dark-secondary">Administrador, Cliente, Asistente</div>
              </Card>
              
              <Card className="dark-card text-center">
                <Activity className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-primary mb-2">Sesiones Activas</h3>
                <div className="text-3xl font-bold text-cyan-400">8</div>
                <div className="text-sm text-dark-secondary">Usuarios conectados</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
