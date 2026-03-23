import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Rutas
import clientesRoutes from './routes/api/clientes';
import mascotasRoutes from './routes/api/mascotas';
import authRoutes from './routes/api/auth';
import ventasRoutes from './routes/api/ventas';
import serviciosRoutes from './routes/api/servicios';
import historialRoutes from './routes/api/historial';
import empleadosRoutes from './routes/api/empleados';
import horariosRoutes from './routes/api/horarios';
import agendamientoRoutes from './routes/api/agendamiento';
import rolesRoutes from './routes/api/roles';
import usuariosRoutes from './routes/api/usuarios';

const app = express();

// Solución para serializar Decimal de Prisma
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

app.use(cors());
app.use(express.json());

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: '🐾 KaiVet API Docs',
    customCss: `.swagger-ui .topbar { background: linear-gradient(135deg, #1e3a5f, #3b82f6); }`,
}));

// Servir home
app.get('/', (_req, res) => {
    res.send('<h1>KaiVet API</h1><p><a href="/api-docs">📖 Ver documentación Swagger</a></p><p><a href="/api/health">✅ Health check</a></p>');
});

// API Routes
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

export default app;
