import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useVentas } from "./hooks/useVentas";
import { useMemo } from "react";

export function VentasChart() {
  const { ventas, loading } = useVentas();

  const dataGrafico = useMemo(() => {
    if (ventas.length === 0) return [];

    // Obtener los últimos 7 días
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return ultimos7Dias.map(fecha => {
      const ventasDia = ventas.filter(v => v.fecha?.startsWith(fecha));
      const total = ventasDia.reduce((acc, v) => acc + Number(v.total), 0);

      // Intentar separar por servicios si la estructura lo permite
      const servicios = ventasDia.reduce((acc, v) => {
        const sValue = v.servicios?.reduce((sAcc: number, s: any) => sAcc + (Number(s.servicio?.precio || 0) * (s.cantidad || 1)), 0) || 0;
        return acc + sValue;
      }, 0);

      const d = new Date(fecha);
      const label = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

      return {
        dia: label,
        ventas: total,
        servicios: servicios,
        productos: Math.max(0, total - servicios)
      };
    });
  }, [ventas]);

  if (loading && dataGrafico.length === 0) {
    return (
      <div className="dark-card h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="dark-card">
      <div className="pb-6">
        <h3 className="text-xl font-bold text-dark-primary mb-2">Análisis de Ventas</h3>
        <p className="text-dark-secondary font-medium">
          Seguimiento de ingresos reales - Últimos 7 días
        </p>
      </div>
      <div>
        <div className="space-y-4">
          <div className="h-80">
            {dataGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="dia"
                    stroke="#94A3B8"
                    fontSize={10}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      boxShadow: "rgba(0, 0, 0, 0.4) 0px 8px 24px",
                      fontWeight: 500,
                      color: "#FFFFFF",
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2, fill: "#1E293B" }}
                    name="Ventas Totales"
                  />
                  <Line
                    type="monotone"
                    dataKey="servicios"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={{ fill: "#22C55E", strokeWidth: 0, r: 3 }}
                    name="Servicios"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-dark-color rounded-xl">
                <p className="text-dark-secondary italic text-sm">Sin datos de ventas esta semana</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
