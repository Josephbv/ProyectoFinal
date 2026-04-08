import { Calendar, Clock } from "lucide-react";
import { useAgendamiento } from "../../agendamiento/hooks/useAgendamiento";
import { useMemo } from "react";
import { formatTo12h } from '../../../shared/utils/formatTime';

import { useEmailAuth } from "../../auth/hooks/useEmailAuth";

interface CitasHoyProps {
  onVerCalendario?: () => void;
}

export function CitasHoy({ onVerCalendario }: CitasHoyProps) {
  const { citas, loading } = useAgendamiento();
  const { user } = useEmailAuth();
  const isClienteRole = user?.rol?.toLowerCase().includes('cliente');

  const hoy = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtrar citas de hoy directamente del array de citas
  const citasHoy = useMemo(() => {
    let filtered = citas.filter(c => c.fecha && c.fecha.startsWith(hoy));
    if (isClienteRole) {
      filtered = filtered.filter(c => c.id_cliente === user?.id_cliente);
    }
    return filtered;
  }, [citas, hoy, isClienteRole, user?.id_cliente]);

  if (loading && citas.length === 0) {
    return (
      <div className="dark-card flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="dark-card">
      <div className="flex items-center justify-between pb-6">
        <div>
          <h3 className="text-xl font-bold text-dark-primary mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            {isClienteRole ? "Mis Citas de Hoy" : "Citas de Hoy"}
          </h3>
          <p className="text-dark-secondary font-medium">
            {isClienteRole ? `Tienes ${citasHoy.length} citas para el día de hoy` : `Agenda del día — ${citasHoy.length} citas programadas`}
          </p>
        </div>
        <button className="dark-button-secondary" onClick={onVerCalendario}>
          Ver Calendario
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {citasHoy.length > 0 ? (
          citasHoy.map((cita) => (
            <div key={cita.id_agendamiento} className="flex items-start space-x-4 p-4 rounded-xl bg-dark-hover border border-dark-color hover:bg-dark-table-hover transition-colors">
              <div className="text-center min-w-[60px]">
                <div className="text-lg font-bold text-dark-primary flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  {formatTo12h(cita.hora)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-dark-primary truncate mb-1">
                  {cita.cliente?.nombre || 'Cliente desconocido'}
                </h4>
                <p className="text-sm text-dark-secondary">
                  <strong>Empleado:</strong> {cita.empleado?.nombre || 'Sin asignar'}
                </p>
                {cita.agendamiento_servicios && cita.agendamiento_servicios.length > 0 && (
                  <p className="text-sm text-dark-secondary">
                    <strong>Servicios:</strong> {cita.agendamiento_servicios.length}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-dark-color rounded-xl">
            <Calendar className="w-12 h-12 text-dark-secondary mx-auto mb-4 opacity-30" />
            <p className="text-dark-secondary">No hay citas programadas para hoy</p>
          </div>
        )}
      </div>

    </div>
  );
}
