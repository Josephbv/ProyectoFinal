import { useState } from 'react';

export interface Acceso {
  id: string;
  usuario: string;
  modulo: string;
  accion: string;
  fechaHora: string;
  ip: string;
  dispositivo: string;
  exitoso: boolean;
  detalles: string;
}

const accesosIniciales: Acceso[] = [
  {
    id: '1',
    usuario: 'Dr. Carlos Martínez',
    modulo: 'Dashboard',
    accion: 'Inicio de sesión',
    fechaHora: '2024-12-21 08:30:15',
    ip: '192.168.1.45',
    dispositivo: 'Windows Desktop',
    exitoso: true,
    detalles: 'Acceso exitoso desde ubicación conocida'
  },
  {
    id: '2',
    usuario: 'Ana García',
    modulo: 'Mascotas',
    accion: 'Consulta historial',
    fechaHora: '2024-12-21 09:15:22',
    ip: '192.168.1.67',
    dispositivo: 'iPad',
    exitoso: true,
    detalles: 'Consulta de historial médico - Mascota ID: 123'
  },
  {
    id: '3',
    usuario: 'Laura Rodríguez',
    modulo: 'Ventas',
    accion: 'Crear factura',
    fechaHora: '2024-12-21 10:45:30',
    ip: '192.168.1.89',
    dispositivo: 'Android Tablet',
    exitoso: true,
    detalles: 'Factura #VET-2024-0045 creada exitosamente'
  },
  {
    id: '4',
    usuario: 'Usuario desconocido',
    modulo: 'Login',
    accion: 'Intento de acceso',
    fechaHora: '2024-12-21 11:20:18',
    ip: '203.45.123.89',
    dispositivo: 'Unknown Browser',
    exitoso: false,
    detalles: 'Intento de acceso con credenciales inválidas'
  },
  {
    id: '5',
    usuario: 'Miguel Torres',
    modulo: 'Insumos',
    accion: 'Actualizar inventario',
    fechaHora: '2024-12-21 12:30:45',
    ip: '192.168.1.23',
    dispositivo: 'MacBook Pro',
    exitoso: true,
    detalles: 'Actualización de stock - Champú medicado'
  },
  {
    id: '6',
    usuario: 'Dr. Carlos Martínez',
    modulo: 'Configuración',
    accion: 'Cambio de permisos',
    fechaHora: '2024-12-21 13:15:12',
    ip: '192.168.1.45',
    dispositivo: 'Windows Desktop',
    exitoso: true,
    detalles: 'Modificación de permisos para usuario Ana García'
  },
  {
    id: '7',
    usuario: 'Sistema',
    modulo: 'Backup',
    accion: 'Respaldo automático',
    fechaHora: '2024-12-21 02:00:00',
    ip: 'localhost',
    dispositivo: 'Servidor',
    exitoso: true,
    detalles: 'Respaldo diario completado exitosamente'
  },
  {
    id: '8',
    usuario: 'Rosa Mendoza',
    modulo: 'Agendamiento',
    acción: 'Cancelar cita',
    fechaHora: '2024-12-21 14:20:33',
    ip: '192.168.1.34',
    dispositivo: 'iPhone',
    exitoso: false,
    detalles: 'Error: No se puede cancelar cita con menos de 24h de anticipación'
  }
];

export const useAcceso = () => {
  const [accesos, setAccesos] = useState<Acceso[]>(accesosIniciales);
  const [loading, setLoading] = useState(false);

  const registrarAcceso = async (nuevoAcceso: Omit<Acceso, 'id' | 'fechaHora'>) => {
    setLoading(true);
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const acceso: Acceso = {
        ...nuevoAcceso,
        id: Date.now().toString(),
        fechaHora: new Date().toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      };
      
      setAccesos(prev => [acceso, ...prev]);
      return { success: true, data: acceso };
    } catch (error) {
      return { success: false, error: 'Error al registrar acceso' };
    } finally {
      setLoading(false);
    }
  };

  const eliminarAcceso = async (id: string) => {
    setLoading(true);
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAccesos(prev => prev.filter(acceso => acceso.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar registro de acceso' };
    } finally {
      setLoading(false);
    }
  };

  const obtenerAccesoPorId = (id: string): Acceso | undefined => {
    return accesos.find(acceso => acceso.id === id);
  };

  const filtrarPorUsuario = (usuario: string): Acceso[] => {
    return accesos.filter(acceso => 
      acceso.usuario.toLowerCase().includes(usuario.toLowerCase())
    );
  };

  const filtrarPorModulo = (modulo: string): Acceso[] => {
    return accesos.filter(acceso => 
      acceso.modulo.toLowerCase().includes(modulo.toLowerCase())
    );
  };

  const filtrarPorExito = (exitoso: boolean): Acceso[] => {
    return accesos.filter(acceso => acceso.exitoso === exitoso);
  };

  const obtenerEstadisticas = () => {
    const total = accesos.length;
    const exitosos = accesos.filter(a => a.exitoso).length;
    const fallidos = total - exitosos;
    const usuariosUnicos = new Set(accesos.map(a => a.usuario)).size;
    const modulosAccedidos = new Set(accesos.map(a => a.modulo)).size;

    return {
      total,
      exitosos,
      fallidos,
      tasaExito: total > 0 ? ((exitosos / total) * 100).toFixed(1) : '0',
      usuariosUnicos,
      modulosAccedidos
    };
  };

  const limpiarRegistrosAntiguos = async (diasAntiguedad: number = 30) => {
    setLoading(true);
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      
      setAccesos(prev => prev.filter(acceso => {
        const fechaAcceso = new Date(acceso.fechaHora);
        return fechaAcceso >= fechaLimite;
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al limpiar registros antiguos' };
    } finally {
      setLoading(false);
    }
  };

  return {
    accesos,
    loading,
    registrarAcceso,
    eliminarAcceso,
    obtenerAccesoPorId,
    filtrarPorUsuario,
    filtrarPorModulo,
    filtrarPorExito,
    obtenerEstadisticas,
    limpiarRegistrosAntiguos
  };
};
