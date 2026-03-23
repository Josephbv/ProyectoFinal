"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
// Rutas
const clientes_1 = __importDefault(require("./routes/api/clientes"));
const mascotas_1 = __importDefault(require("./routes/api/mascotas"));
const auth_1 = __importDefault(require("./routes/api/auth"));
const ventas_1 = __importDefault(require("./routes/api/ventas"));
const servicios_1 = __importDefault(require("./routes/api/servicios"));
const historial_1 = __importDefault(require("./routes/api/historial"));
const empleados_1 = __importDefault(require("./routes/api/empleados"));
const horarios_1 = __importDefault(require("./routes/api/horarios"));
const agendamiento_1 = __importDefault(require("./routes/api/agendamiento"));
const roles_1 = __importDefault(require("./routes/api/roles"));
const usuarios_1 = __importDefault(require("./routes/api/usuarios"));
const app = (0, express_1.default)();
// Solución para serializar Decimal de Prisma
BigInt.prototype.toJSON = function () {
    return this.toString();
};
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Swagger
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customSiteTitle: '🐾 KaiVet API Docs',
    customCss: `.swagger-ui .topbar { background: linear-gradient(135deg, #1e3a5f, #3b82f6); }`,
}));
// Servir home
app.get('/', (_req, res) => {
    res.send('<h1>KaiVet API</h1><p><a href="/api-docs">📖 Ver documentación Swagger</a></p><p><a href="/api/health">✅ Health check</a></p>');
});
// API Routes
app.use('/api/clientes', clientes_1.default);
app.use('/api/mascotas', mascotas_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/ventas', ventas_1.default);
app.use('/api/servicios', servicios_1.default);
app.use('/api/historial', historial_1.default);
app.use('/api/empleados', empleados_1.default);
app.use('/api/horarios', horarios_1.default);
app.use('/api/agendamiento', agendamiento_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/usuarios', usuarios_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'KaiVet API funcionando correctamente' });
});
exports.default = app;
