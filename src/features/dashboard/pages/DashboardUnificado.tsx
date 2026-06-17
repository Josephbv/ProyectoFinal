import { useMemo } from "react";
import { Button } from "../../../shared/components/button";
import { Badge } from "../../../shared/components/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, Calendar, DollarSign, Clock, Activity, Heart,
  CalendarCheck, UserCheck, Stethoscope, ShieldCheck,
  PieChart as PieIcon, ArrowUpRight, ArrowDownRight,
  CalendarDays, ShoppingCart, PawPrint
} from "lucide-react";
import { useVentas } from "../../ventas/hooks/useVentas";
import { useClientes } from "../../clientes/hooks/useClientes";
import { useAgendamiento } from "../../agendamiento/hooks/useAgendamiento";
import { useMascotas } from "../../mascotas/hooks/useMascotas";
import { useServicios } from "../../servicios/hooks/useServicios";
import { useEmailAuth } from "../../auth/hooks/useEmailAuth";
import { formatTo12h } from '../../../shared/utils/formatTime';

const PIE_COLORS = ['#3B82F6','#F59E0B','#8B5CF6','#22C55E','#EF4444'];
const BAR_COLORS = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899'];

const fmt = (v: number) => `$${v.toLocaleString('es-CO')}`;

const estadoBadge: Record<string, string> = {
  activa: 'bg-emerald-500/10 text-emerald-400',
  completada: 'bg-blue-500/10 text-blue-400',
  cancelada: 'bg-red-500/10 text-red-400',
};

export function DashboardUnificado({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user } = useEmailAuth();
  const isAdmin = user?.rol?.toLowerCase().includes('administrador');
  const { ventas: allVentas } = useVentas(isAdmin);
  const { clientes: allClientes } = useClientes();
  const { citas: allCitas } = useAgendamiento();
  const { mascotas: allMascotas } = useMascotas();
  const { servicios: allServicios } = useServicios();

  const now = new Date();
  const hoyStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const ventasValidas = useMemo(() => allVentas.filter(v => v.estado !== 'anulada'), [allVentas]);

  // Balances financieros
  const balances = useMemo(() => {
    if (!isAdmin) return { diario:0, semanal:0, mensual:0, anual:0, anuladas:0 };
    const sowk = new Date(now); sowk.setDate(now.getDate()-(now.getDay()===0?6:now.getDay()-1)); sowk.setHours(0,0,0,0);
    let d=0,s=0,m=0,a=0;
    ventasValidas.forEach(v => {
      const fRaw = v.fecha||(v as any).fecha_venta; if(!fRaw) return;
      const f = new Date(fRaw); const t = Number(v.total||0);
      if(f.toISOString().split('T')[0]===hoyStr) d+=t;
      if(f>=sowk) s+=t;
      if(f.getMonth()===now.getMonth()&&f.getFullYear()===now.getFullYear()) m+=t;
      if(f.getFullYear()===now.getFullYear()) a+=t;
    });
    return { diario:d, semanal:s, mensual:m, anual:a, anuladas:allVentas.filter(v=>v.estado==='anulada').length };
  }, [ventasValidas, allVentas, isAdmin]);

  // Citas hoy
  const citasHoy = useMemo(() => allCitas.filter(c => c.fecha?.startsWith(hoyStr)), [allCitas, hoyStr]);

  // Próximas citas (mañana + 7 días)
  const proximas = useMemo(() => {
    const manana = new Date(now); manana.setDate(now.getDate()+1);
    const limite = new Date(now); limite.setDate(now.getDate()+7);
    return allCitas
      .filter(c => {
        if(!c.fecha) return false;
        const f = new Date(c.fecha);
        return f > now && f <= limite;
      })
      .sort((a,b) => new Date(a.fecha!).getTime()-new Date(b.fecha!).getTime())
      .slice(0,5);
  }, [allCitas]);

  // Ingresos mensuales (gráfica)
  const chartData = useMemo(() => {
    const ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const r: Record<string,{mes:string;ingresos:number}> = {};
    ms.forEach(m=>{r[m]={mes:m,ingresos:0};});
    if(isAdmin) ventasValidas.forEach(v=>{
      const fRaw=v.fecha||(v as any).fecha_venta; if(!fRaw) return;
      const f=new Date(fRaw); if(f.getFullYear()!==now.getFullYear()) return;
      const mn=ms[f.getMonth()]; if(r[mn]) r[mn].ingresos+=Number(v.total||0);
    });
    return Object.values(r);
  }, [ventasValidas, isAdmin]);

  // Top servicios del mes
  const topServicios = useMemo(() => {
    const conteo: Record<number,{nombre:string;count:number;ingresos:number}> = {};
    ventasValidas.forEach(v=>{
      const fRaw=v.fecha||(v as any).fecha_venta; if(!fRaw) return;
      const f=new Date(fRaw);
      if(f.getMonth()!==now.getMonth()||f.getFullYear()!==now.getFullYear()) return;
      (v.venta_servicios||[]).forEach((vs:any)=>{
        const sid=vs.id_servicio;
        const svc=allServicios.find(s=>s.id_servicio===sid);
        const nombre=svc?.nombre_servicio||vs.servicio?.nombreServicio||`Servicio #${sid}`;
        if(!conteo[sid]) conteo[sid]={nombre,count:0,ingresos:0};
        conteo[sid].count+=1;
        conteo[sid].ingresos+=Number(svc?.precio||0);
      });
    });
    return Object.values(conteo).sort((a,b)=>b.count-a.count).slice(0,5);
  }, [ventasValidas, allServicios]);

  // Últimas ventas recientes
  const ventasRecientes = useMemo(() =>
    [...ventasValidas].sort((a,b)=>new Date(b.fecha||'').getTime()-new Date(a.fecha||'').getTime()).slice(0,5)
  , [ventasValidas]);

  // Pacientes nuevos este mes vs mes anterior
  const mascotasTrend = useMemo(() => {
    const mes = allMascotas.filter(m=>{
      const fn=m.fecha_creacion||(m as any).createdAt||m.fecha_nacimiento; if(!fn) return false;
      const f=new Date(fn);
      return f.getMonth()===now.getMonth()&&f.getFullYear()===now.getFullYear();
    }).length;
    const mesAnt = allMascotas.filter(m=>{
      const fn=m.fecha_creacion||(m as any).createdAt||m.fecha_nacimiento; if(!fn) return false;
      const f=new Date(fn);
      const ant=new Date(now); ant.setMonth(ant.getMonth()-1);
      return f.getMonth()===ant.getMonth()&&f.getFullYear()===ant.getFullYear();
    }).length;
    return { mes, mesAnt, diff: mes-mesAnt };
  }, [allMascotas]);

  // Distribución por especie
  const especiesData = useMemo(()=>{
    const c:Record<string,number>={};
    if(!allMascotas.length) return [{name:'Sin datos',value:1}];
    allMascotas.forEach(m=>{
      const e=((m as any).especie||'Otro').toString().toLowerCase();
      const n=e.includes('perro')||e.includes('canino')?'Caninos':e.includes('gato')||e.includes('felino')?'Felinos':'Otros';
      c[n]=(c[n]||0)+1;
    });
    return Object.entries(c).map(([name,value])=>({name,value}));
  },[allMascotas]);

  // Últimas mascotas registradas
  const ultimasMascotas = useMemo(() => {
    return [...allMascotas]
      .sort((a, b) => (b.id_mascota || 0) - (a.id_mascota || 0))
      .slice(0, 5)
      .map(m => {
        const owner = allClientes.find(c => c.id_cliente === m.id_cliente);
        return {
          ...m,
          ownerName: owner?.nombre || 'Sin dueño'
        };
      });
  }, [allMascotas, allClientes]);

  return (
    <main className="bg-dark-bg p-3 lg:p-4 overflow-x-hidden min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* HEADER */}
        <header className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-inner"><ShieldCheck className="w-5 h-5 text-white"/></div>
            <div>
              <h1 className="text-lg font-black text-dark-primary tracking-tight leading-none">KaiVet Manager</h1>
              <p className="text-[10px] text-dark-secondary font-bold mt-0.5">Panel de Control · {now.toLocaleDateString('es-CO',{day:'numeric',month:'long'})}</p>
            </div>
          </div>
          <Button onClick={()=>onNavigate?.("Agendamiento")} className="h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <CalendarDays className="w-3.5 h-3.5"/> Nueva Cita
          </Button>
        </header>

        {/* KPIs FILA 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Clientes', val:allClientes.length, icon:UserCheck, color:'text-blue-400', bg:'bg-blue-400/5', onClick:()=>onNavigate?.("Clientes") },
            { label:'Pacientes', val:allMascotas.length, icon:PawPrint, color:'text-pink-400', bg:'bg-pink-400/5', onClick:()=>onNavigate?.("Mascotas") },
            { label:'Citas Hoy', val:citasHoy.length, icon:CalendarCheck, color:'text-emerald-400', bg:'bg-emerald-400/5', onClick:()=>onNavigate?.("Agendamiento") },
            { label:'Ventas Activas', val:ventasValidas.length, icon:ShoppingCart, color:'text-amber-400', bg:'bg-amber-400/5', onClick:()=>onNavigate?.("Ventas") },
          ].map((m,i)=>(
            <div key={i} onClick={m.onClick} className="dark-card p-3 border-white/5 flex items-center gap-3 group cursor-pointer transition-all hover:scale-[1.02] hover:border-white/10">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.bg}`}><m.icon className={`w-4 h-4 ${m.color}`}/></div>
              <div>
                <p className="text-base font-black text-dark-primary">{m.val}</p>
                <p className="text-[9px] font-bold text-dark-secondary tracking-wider">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FILA PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Gráfica Ingresos */}
          <div className="lg:col-span-8 dark-card p-4 border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400"/><h2 className="text-xs font-black text-dark-primary">Ingresos Mensuales {now.getFullYear()}</h2></div>
              <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px] font-bold">{isAdmin?'Admin':'Vista General'}</Badge>
            </div>
            <div className="h-[180px] w-full overflow-hidden">
              <AreaChart width={700} height={180} data={chartData} margin={{top:8,right:20,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.1)" tick={{fill:'#64748b',fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip isAnimationActive={false} contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:'10px',fontSize:'10px'}} formatter={(v:any)=>fmt(Number(v))}/>
                <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gi)" isAnimationActive={false}/>
              </AreaChart>
            </div>
          </div>

          {/* Distribución por especie */}
          <div className="lg:col-span-4 dark-card p-4 border-white/5 flex flex-col">
            <h2 className="text-[10px] font-black text-dark-secondary uppercase mb-3 flex items-center gap-2">
              <PieIcon className="w-3.5 h-3.5 text-blue-400"/> Distribución Pacientes
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center">
              <PieChart width={140} height={130}>
                <Pie data={especiesData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={4} dataKey="value" stroke="none" isAnimationActive={false}>
                  {especiesData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip isAnimationActive={false}/>
              </PieChart>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {especiesData.slice(0,4).map((e,i)=>(
                  <div key={i} className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                    <div>
                      <p className="text-[8px] text-dark-secondary">{e.name}</p>
                      <p className="text-xs font-black text-dark-primary">{e.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FILA 3: Citas Hoy + Próximas Citas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Citas de Hoy completas */}
          <div className="dark-card p-4 border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-dark-secondary flex items-center gap-2"><CalendarCheck className="w-3.5 h-3.5 text-emerald-400"/>Citas de Hoy ({citasHoy.length})</h3>
              <Button onClick={()=>onNavigate?.("Agendamiento")} variant="link" className="text-blue-400 text-[9px] h-auto p-0 font-bold">Ver agenda →</Button>
            </div>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {citasHoy.length>0 ? citasHoy.map(c=>(
                <div key={c.id_agendamiento} className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg gap-2">
                  <span className="text-[10px] font-black text-blue-400 shrink-0 w-14">{formatTo12h(c.hora)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-dark-primary truncate">{c.cliente?.nombre||'Sin cliente'}</p>
                    <p className="text-[9px] text-dark-secondary truncate">{c.empleado?.nombre ? `Dr. ${c.empleado.nombre}` : 'Sin veterinario'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={`text-[8px] px-1.5 border-none font-bold ${estadoBadge[c.estado||'activa']||estadoBadge.activa}`}>{c.estado||'activa'}</Badge>
                    {c.mascota?.nombre_mascota&&<span className="text-[8px] text-pink-400 font-bold">{c.mascota.nombre_mascota}</span>}
                  </div>
                </div>
              )) : <p className="text-[10px] text-dark-secondary italic py-4 text-center">No hay citas programadas para hoy</p>}
            </div>
          </div>

          {/* Resumen de Caja o Últimos Pacientes */}
          {isAdmin ? (
            <div className="dark-card p-4 border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-dark-secondary flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400"/>
                  Resumen de Caja / Finanzas
                </h3>
                <Button onClick={()=>onNavigate?.("Ventas")} variant="link" className="text-blue-400 text-[9px] h-auto p-0 font-bold">Ver ventas →</Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-dark-secondary tracking-wider uppercase mb-1">Ingresos Hoy</p>
                  <p className="text-sm font-black text-emerald-400">{fmt(balances.diario)}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-dark-secondary tracking-wider uppercase mb-1">Esta Semana</p>
                  <p className="text-sm font-black text-blue-400">{fmt(balances.semanal)}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-dark-secondary tracking-wider uppercase mb-1">Este Mes</p>
                  <p className="text-sm font-black text-purple-400">{fmt(balances.mensual)}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-dark-secondary tracking-wider uppercase mb-1">Anuladas (Mes)</p>
                  <p className="text-sm font-black text-red-400">{balances.anuladas} ventas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="dark-card p-4 border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black text-dark-secondary flex items-center gap-2">
                  <PawPrint className="w-3.5 h-3.5 text-pink-400"/>
                  Últimos Pacientes
                </h3>
                <Button onClick={()=>onNavigate?.("Mascotas")} variant="link" className="text-blue-400 text-[9px] h-auto p-0 font-bold">Ver todos →</Button>
              </div>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {ultimasMascotas.length > 0 ? ultimasMascotas.map(m => (
                  <div key={m.id_mascota} className="flex items-center gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                    <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                      <PawPrint className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-dark-primary truncate">{m.nombre}</p>
                      <p className="text-[9px] text-dark-secondary truncate">{m.especie} · {m.raza || 'Sin raza'}</p>
                    </div>
                    <Badge className="text-[8px] bg-blue-500/10 text-blue-400 border-none truncate max-w-[100px]">{m.ownerName}</Badge>
                  </div>
                )) : <p className="text-[10px] text-dark-secondary italic py-4 text-center">No hay pacientes registrados</p>}
              </div>
            </div>
          )}
        </div>

        {/* FILA 4: Top Servicios + Últimas Ventas + Pacientes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Top Servicios del mes */}
          <div className="lg:col-span-5 dark-card p-4 border-white/5">
            <h3 className="text-[10px] font-black text-dark-secondary mb-3 flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 text-orange-400"/>Top Servicios del Mes</h3>
            {topServicios.length>0 ? (
              <div className="space-y-2">
                {topServicios.map((s,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-dark-secondary w-4">{i+1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px] font-bold text-dark-primary truncate max-w-[150px]">{s.nombre}</span>
                        <span className="text-[9px] font-black text-dark-secondary">{s.count}x</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{width:`${(s.count/topServicios[0].count)*100}%`,background:BAR_COLORS[i%BAR_COLORS.length]}}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center">
                <p className="text-[10px] text-dark-secondary italic">Sin datos este mes</p>
              </div>
            )}
          </div>

          {/* Últimas Ventas */}
          <div className="lg:col-span-5 dark-card p-4 border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black text-dark-secondary flex items-center gap-2"><ShoppingCart className="w-3.5 h-3.5 text-amber-400"/>Últimas Ventas</h3>
              <Button onClick={()=>onNavigate?.("Ventas")} variant="link" className="text-blue-400 text-[9px] h-auto p-0 font-bold">Ver todas →</Button>
            </div>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {ventasRecientes.length>0 ? ventasRecientes.map(v=>(
                <div key={v.id_venta} className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-dark-primary truncate">{v.cliente?.nombre||`Cliente #${v.id_cliente}`}</p>
                    <p className="text-[8px] text-dark-secondary">{v.fecha?new Date(v.fecha).toLocaleDateString('es-CO',{day:'2-digit',month:'short'}):'-'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-emerald-400">{fmt(Number(v.total||0))}</span>
                    <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-none">aprobada</Badge>
                  </div>
                </div>
              )) : <p className="text-[10px] text-dark-secondary italic py-4 text-center">Sin ventas registradas</p>}
            </div>
          </div>

          {/* Pacientes nuevos */}
          <div className="lg:col-span-2 dark-card p-4 border-white/5 flex flex-col justify-between">
            <h3 className="text-[10px] font-black text-dark-secondary flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-pink-400"/>Nuevos Pacientes</h3>
            <div className="text-center my-auto py-4">
              <p className="text-4xl font-black text-dark-primary">{mascotasTrend.mes}</p>
              <p className="text-[9px] text-dark-secondary mt-1">este mes</p>
              <div className={`flex items-center justify-center gap-1 mt-2 text-[9px] font-bold ${mascotasTrend.diff>=0?'text-emerald-400':'text-red-400'}`}>
                {mascotasTrend.diff>=0?<ArrowUpRight className="w-3 h-3"/>:<ArrowDownRight className="w-3 h-3"/>}
                {Math.abs(mascotasTrend.diff)} vs mes ant.
              </div>
            </div>
            <Button onClick={()=>onNavigate?.("Mascotas")} variant="outline" className="h-7 text-[9px] font-bold border-white/5 bg-white/[0.03] hover:bg-white/10 w-full">
              Ver mascotas
            </Button>
          </div>

        </div>

      </div>
    </main>
  );
}
