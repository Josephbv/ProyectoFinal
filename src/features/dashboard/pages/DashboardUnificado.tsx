import { useMemo } from "react";
import { Button } from "../../../shared/components/button";
import { Badge } from "../../../shared/components/badge";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area
} from "recharts";
import {
  TrendingUp, Calendar, DollarSign,
  Clock, Activity, Heart, CalendarCheck, UserCheck, Stethoscope,
  ChevronRight, ShieldCheck, PieChart as PieIcon
} from "lucide-react";
import { useVentas } from "../../ventas/hooks/useVentas";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useAgendamiento } from "../../agendamiento/hooks/useAgendamiento";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { formatTo12h } from '../../../shared/utils/formatTime';

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#22C55E', '#EF4444'];
const EMOJI: Record<string, string> = { Caninos: '🐕', Felinos: '🐈', Otros: '🐾' };

export function DashboardUnificado({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useEmailAuth();
  const isAdmin = user?.rol?.toLowerCase().includes('administrador');
  const { ventas: allVentas } = useVentas(isAdmin);
  const { clientes: allClientes } = useClientes();
  const { citas: allCitas } = useAgendamiento();
  const { mascotas: allMascotas } = useMascotas();

  const ventasValidas = useMemo(() => allVentas.filter(v => v.estado !== 'anulada'), [allVentas]);

  const especiesData = useMemo(() => {
    const c: Record<string, number> = {};
    if (allMascotas.length === 0) return [{ name: 'Sin datos', value: 1 }];
    allMascotas.forEach(m => {
      const e = ((m as any).especie || 'Otro').toString().toLowerCase();
      const n = e.includes('perro') || e.includes('canino') ? 'Caninos' : e.includes('gato') || e.includes('felino') ? 'Felinos' : 'Otros';
      c[n] = (c[n] || 0) + 1;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [allMascotas]);

  const balances = useMemo(() => {
    if (!isAdmin) return { diario: 0, semanal: 0, mensual: 0, anual: 0, ventasMes: 0, anuladas: 0 };
    const now = new Date();
    const hoyStr = now.toISOString().split('T')[0];
    const sowk = new Date(now); sowk.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); sowk.setHours(0, 0, 0, 0);
    let d = 0, s = 0, m = 0, a = 0, vm = 0;
    ventasValidas.forEach(v => {
      const fRaw = v.fecha || (v as any).fecha_venta; if (!fRaw) return;
      const f = new Date(fRaw); const t = Number(v.total || 0);
      if (f.toISOString().split('T')[0] === hoyStr) d += t;
      if (f >= sowk) s += t;
      if (f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()) { m += t; vm++; }
      if (f.getFullYear() === now.getFullYear()) a += t;
    });
    return { diario: d, semanal: s, mensual: m, anual: a, ventasMes: vm, anuladas: allVentas.filter(v => v.estado === 'anulada').length };
  }, [ventasValidas, allVentas, isAdmin]);

  const chartData = useMemo(() => {
    const ms = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const r: Record<string, { mes: string; ingresos: number }> = {};
    ms.forEach(m => { r[m] = { mes: m, ingresos: 0 }; });
    if (isAdmin) {
      ventasValidas.forEach(v => {
        const fRaw = v.fecha || (v as any).fecha_venta; if (!fRaw) return;
        const f = new Date(fRaw); if (f.getFullYear() !== new Date().getFullYear()) return;
        const mn = ms[f.getMonth()]; if (r[mn]) r[mn].ingresos += Number(v.total || 0);
      });
    }
    return Object.values(r);
  }, [ventasValidas, isAdmin]);

  const citasHoy = useMemo(() => {
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return allCitas.filter(c => c.fecha?.startsWith(hoy));
  }, [allCitas]);

  const fmt = (v: number) => `$${v.toLocaleString('es-CO')}`;

  return (
    <main className="bg-dark-bg p-3 lg:p-4 selection:bg-blue-500/30 overflow-x-hidden min-h-screen">
      <div className="max-w-[1300px] mx-auto space-y-4">

        {/* HEADER COMPACTO */}
        <header className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-inner"><ShieldCheck className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-lg font-black text-dark-primary tracking-tight leading-none">KaiVet Manager</h1>
              <p className="text-[10px] text-dark-secondary font-bold mt-1">Panel de Control · {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex -space-x-1 mr-2">
              {[1, 2].map(i => <div key={i} className="w-6 h-6 rounded-full bg-blue-500/20 border border-dark-card" />)}
            </div>
            <Button onClick={() => onNavigate?.("Clientes")} variant="outline" className="h-7 text-[10px] font-bold border-white/5 bg-dark-card hover:bg-white/5">
              {allClientes.length} Clientes
            </Button>
          </div>
        </header>

        {/* KPIs ULTRA COMPACTOS (FILA 1) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Clientes', val: allClientes.length, icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-400/5' },
            { label: 'Pacientes', val: allMascotas.length, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/5' },
            { label: 'Citas Hoy', val: citasHoy.length, icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
            { label: 'En Consulta', val: allCitas.filter(c => c.estado === 'activa' || (c as any).estado === 'pendiente').length, icon: Stethoscope, color: 'text-amber-400', bg: 'bg-emerald-400/5' },
          ].map((m, i) => (
            <div key={i} className="dark-card p-2.5 border-white/5 flex items-center gap-3 group transition-transform hover:scale-[1.02]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.bg}`}><m.icon className={`w-4 h-4 ${m.color}`} /></div>
              <div>
                <p className="text-sm font-black text-dark-primary">{m.val}</p>
                <p className="text-[9px] font-bold text-dark-secondary tracking-wider">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FINANCIALS (FILA 2) */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Ingreso Hoy', val: balances.diario, icon: Clock, c: 'text-blue-400' },
              { label: 'Meta Semanal', val: balances.semanal, icon: TrendingUp, c: 'text-emerald-400' },
              { label: 'Cierre Mes', val: balances.mensual, icon: Calendar, c: 'text-purple-400' },
              { label: 'Balance Anual', val: balances.anual, icon: DollarSign, c: 'text-amber-400', b: balances.anuladas }
            ].map((b, i) => (
              <div key={i} className="dark-card p-3 border-white/5 relative overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] font-bold text-dark-secondary tracking-widest">{b.label}</p>
                  {b.b > 0 && <Badge className="bg-red-500/20 text-red-500 scale-75 origin-right border-none font-black">-{b.b}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <b.icon className={`w-3 h-3 ${b.c}`} />
                  <h3 className="text-sm font-black text-dark-primary">{fmt(b.val)}</h3>
                </div>
                <div className={`absolute bottom-0 left-0 h-0.5 bg-current opacity-20 ${b.c}`} style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        )}

        {/* ANALYTICS GRID (CONTENIDO PRINCIPAL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Gráfica de Ingresos Principal (MEJORADA) */}
          <div className="lg:col-span-8 dark-card p-4 border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h2 className="text-xs font-black text-dark-primary tracking-tighter">Rendimiento Operativo Mensual</h2>
              </div>
              <Badge className="bg-blue-500/10 text-blue-400 border-none font-bold text-[9px]">2026</Badge>
            </div>

            {/* Gráfico de Área Fijo para estabilidad */}
            <div className="flex justify-center bg-white/[0.01] rounded-xl p-2 h-[200px] w-full overflow-hidden">
              <AreaChart width={800} height={200} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" hide />
                <YAxis hide />
                <Tooltip
                  isAnimationActive={false}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" isAnimationActive={false} />
              </AreaChart>
            </div>
          </div>

          {/* Censo Compacto */}
          <div className="lg:col-span-4 dark-card p-4 border-white/5 flex flex-col items-center justify-center">
            <h2 className="text-[10px] font-black text-dark-secondary uppercase mb-4 self-start flex items-center gap-2">
              <PieIcon className="w-3.5 h-3.5 text-blue-400" /> Distribución
            </h2>
            <div className="h-[140px] w-full flex justify-center">
              <PieChart width={150} height={150}>
                <Pie
                  data={especiesData}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={65}
                  paddingAngle={5}
                  dataKey="value" stroke="none"
                  isAnimationActive={false}
                >
                  {especiesData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip isAnimationActive={false} />
              </PieChart>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 w-full">
              {especiesData.slice(0, 2).map((e, i) => (
                <div key={i} className="flex flex-col p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                  <span className="text-[9px] font-bold text-dark-secondary">{e.name}</span>
                  <span className="text-sm font-black text-dark-primary">{e.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda & Bar Chart en Fila Baja */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agenda Mini */}
            <div className="dark-card p-4 border-white/5">
              <h3 className="text-[10px] font-black text-dark-secondary mb-3 flex items-center gap-2">
                <CalendarCheck className="w-3 h-3 text-emerald-400" /> Citas de Hoy
              </h3>
              <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                {citasHoy.length > 0 ? citasHoy.slice(0, 3).map(c => (
                  <div key={c.id_agendamiento} className="flex justify-between items-center p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-blue-400">{formatTo12h(c.hora)}</span>
                      <span className="text-[11px] font-bold text-dark-primary truncate max-w-[150px]">{c.cliente?.nombre || '...'}</span>
                    </div>
                    <Badge className="bg-pink-500/10 text-pink-400 text-[9px] px-1 border-none">{c.mascota?.nombre_mascota || 'Pet'}</Badge>
                  </div>
                )) : <p className="text-[10px] text-dark-secondary italic py-2">No hay actividad para hoy</p>}
              </div>
              <Button onClick={() => onNavigate?.("Agendamiento")} variant="link" className="text-blue-400 text-[10px] h-auto p-0 mt-2 font-bold uppercase">Ver Agenda Completa →</Button>
            </div>

            {/* Bar Chart Compacto */}
            <div className="dark-card p-4 border-white/5">
              <h3 className="text-[10px] font-black text-dark-secondary mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Tendencia Trimestral
              </h3>
              <div className="flex justify-center h-[120px] w-full">
                <BarChart width={300} height={120} data={chartData.slice(-3)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.1)" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip isAnimationActive={false} />
                  <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={false} />
                </BarChart>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
