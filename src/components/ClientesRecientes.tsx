import { Users, Star, Calendar, Phone } from "lucide-react";
import { useClientes } from "./hooks/useClientes";
import { useMemo } from "react";

export function ClientesRecientes() {
  const { clientes, loading } = useClientes();

  // Tomar los 4 más recientes (asumiendo que vienen ordenados o por ID)
  const clientesRecientes = useMemo(() => {
    return [...clientes].sort((a, b) => b.id_cliente - a.id_cliente).slice(0, 4);
  }, [clientes]);

  const stats = useMemo(() => {
    return {
      activos: clientes.filter(c => c.estado === 'activo').length,
      nuevos: clientes.length, // Placeholder
      cumpleaños: 0 // Placeholder
    };
  }, [clientes]);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "frecuente":
      case "VIP":
        return "bg-green-600 text-white";
      case "nuevo":
        return "bg-blue-600 text-white";
      default:
        return "bg-dark-tag text-white";
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < count ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  if (loading && clientesRecientes.length === 0) {
    return (
      <div className="dark-card flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="dark-card">
      <div className="flex items-center justify-between pb-6">
        <div>
          <h3 className="text-xl font-bold text-dark-primary mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Clientes Recientes
          </h3>
          <p className="text-dark-secondary font-medium">Actividad reciente en la clínica</p>
        </div>
        <button className="dark-button-secondary">
          Ver Todos
        </button>
      </div>

      <div className="space-y-4">
        {clientesRecientes.length > 0 ? (
          clientesRecientes.map((cliente) => (
            <div key={cliente.id_cliente} className="p-4 rounded-xl bg-dark-hover border border-dark-color hover:bg-dark-table-hover transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-dark-primary truncate">{cliente.nombre} {cliente.apellido}</h4>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getTipoColor(cliente.fidelidad > 4 ? 'VIP' : 'regular')}`}>
                      {cliente.fidelidad > 4 ? 'VIP' : 'REGULAR'}
                    </div>
                  </div>
                  <p className="text-sm text-dark-secondary">
                    {cliente.mascotas && cliente.mascotas.length > 0 ? (
                      <><strong>{cliente.mascotas[0].nombre}</strong> - {cliente.mascotas[0].raza}</>
                    ) : (
                      "Sin mascotas registradas"
                    )}
                  </p>
                </div>
                {renderStars(cliente.fidelidad)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-dark-secondary">
                  <Phone className="w-3 h-3" />
                  {cliente.telefono}
                </div>
                <div className="flex items-center gap-2 text-dark-secondary">
                  <Calendar className="w-3 h-3" />
                  ID: {cliente.id_cliente}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-dark-color">
                <p className="text-xs text-dark-secondary">
                  Correo: <span className="text-dark-primary font-medium">{cliente.correo}</span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-dark-color rounded-xl">
            <Users className="w-12 h-12 text-dark-secondary mx-auto mb-4 opacity-30" />
            <p className="text-dark-secondary">No hay clientes registrados aún</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-dark-color">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">{stats.activos}</div>
            <div className="text-xs text-dark-secondary">Clientes Activos</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">{stats.nuevos}</div>
            <div className="text-xs text-dark-secondary">Totales</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-400">{stats.cumpleaños}</div>
            <div className="text-xs text-dark-secondary">Cumpleaños</div>
          </div>
        </div>
      </div>
    </div>
  );
}
