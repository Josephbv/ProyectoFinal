import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useVentas } from "./hooks/useVentas";
import { useMemo } from "react";

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
};

export function ServiciosChart() {
  const { ventas, loading } = useVentas();

  const dataDistribucion = useMemo(() => {
    const conteo: Record<string, number> = {};
    let totalItems = 0;

    ventas.forEach(v => {
      v.servicios?.forEach((s: any) => {
        const nombre = s.servicio?.nombre_servicio || "Otros";
        conteo[nombre] = (conteo[nombre] || 0) + (s.cantidad || 1);
        totalItems += (s.cantidad || 1);
      });
    });

    if (totalItems === 0) return [];

    return Object.entries(conteo)
      .map(([name, value], index) => ({
        name,
        value: Math.round((value / totalItems) * 100),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [ventas]);

  if (loading && dataDistribucion.length === 0) {
    return (
      <div className="dark-card h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="dark-card">
      <div className="pb-6">
        <h3 className="text-xl font-bold text-dark-primary mb-2">Distribución de Servicios</h3>
        <p className="text-dark-secondary font-medium">Servicios más solicitados (Histórico)</p>
      </div>

      <div className="h-64">
        {dataDistribucion.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataDistribucion}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataDistribucion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #374151",
                  borderRadius: "12px",
                  boxShadow: "rgba(0, 0, 0, 0.4) 0px 8px 24px",
                  color: "#FFFFFF",
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-dark-color rounded-xl">
            <p className="text-dark-secondary italic text-sm">Sin datos de servicios registrados</p>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-6 max-h-[150px] overflow-y-auto pr-1">
        {dataDistribucion.map((servicio, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: servicio.color }}
              ></div>
              <span className="text-xs font-medium text-dark-primary truncate">{servicio.name}</span>
            </div>
            <div className="text-xs font-bold text-dark-secondary">{servicio.value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
