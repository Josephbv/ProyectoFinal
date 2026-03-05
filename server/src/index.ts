import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import clientesRoutes from './routes/clientes';
import mascotasRoutes from './routes/mascotas';
import authRoutes from './routes/auth';
import ventasRoutes from './routes/ventas';
import serviciosRoutes from './routes/servicios';
import historialRoutes from './routes/historial';
import empleadosRoutes from './routes/empleados';
import horariosRoutes from './routes/horarios';
import agendamientoRoutes from './routes/agendamiento';
import rolesRoutes from './routes/roles';
import usuariosRoutes from './routes/api/usuarios';

// Solución para serializar Decimal de Prisma
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Permitir todos los orígenes en desarrollo
app.use(express.json());

// Rutas
app.get('/', (_req, res) => {
  res.send('<h1>KaiVet API Node.js + SQL Server</h1><p>Usa /api/health para verificar el estado.</p>');
});

app.use('/api/clientes', clientesRoutes);
app.use('/api/mascotas', mascotasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/agendamiento', agendamientoRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'KaiVet API funcionando correctamente' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 KaiVet API corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
