"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const PORT = process.env.PORT || 3001;
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '🐾 KaiVet Manager API',
            version: '1.0.0',
            description: 'Documentación interactiva de todos los endpoints de KaiVet Manager. Puedes probar las rutas directamente desde aquí.',
        },
        servers: [{ url: `http://localhost:${PORT}`, description: 'Servidor local de desarrollo' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        tags: [
            { name: 'Auth', description: 'Registro, login y recuperación de contraseña' },
            { name: 'Clientes', description: 'Gestión de clientes de la clínica' },
            { name: 'Mascotas', description: 'Registro y seguimiento de mascotas' },
            { name: 'Ventas', description: 'Control de ventas y facturación' },
            { name: 'Servicios', description: 'Catálogo de servicios veterinarios' },
            { name: 'Empleados', description: 'Directorio de empleados y veterinarios' },
            { name: 'Horarios', description: 'Gestión de horarios del personal' },
            { name: 'Agendamiento', description: 'Citas y agenda de la clínica' },
            { name: 'Roles', description: 'Roles y permisos del sistema' },
            { name: 'Usuarios', description: 'Gestión de cuentas de usuario' },
            { name: 'Historial', description: 'Historial médico de mascotas' },
        ],
        paths: {
            '/api/auth/register': { post: { tags: ['Auth'], summary: 'Registrar nuevo usuario/cliente', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { correo: { type: 'string', example: 'nuevo@ejemplo.com' }, contrasena: { type: 'string', example: 'mi_clave' }, nombre_usuario: { type: 'string', example: 'Juan Pérez' }, cedula: { type: 'string', example: '100000001' }, telefono: { type: 'string', example: '3000000000' }, direccion: { type: 'string', example: 'Calle 1 # 2-3' }, nombre_rol: { type: 'string', example: 'Cliente' } } } } } }, responses: { 201: { description: 'Usuario creado exitosamente' }, 400: { description: 'Datos inválidos o correo ya registrado' } } } },
            '/api/auth/login': { post: { tags: ['Auth'], summary: 'Iniciar sesión', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['correo', 'contrasena'], properties: { correo: { type: 'string', example: 'josephballestas10@gmail.com' }, contrasena: { type: 'string', example: 'tu_contrasena_aqui' } } } } } }, responses: { 200: { description: 'Login exitoso, retorna token JWT' }, 401: { description: 'Credenciales incorrectas' } } } },
            '/api/auth/request-reset': { post: { tags: ['Auth'], summary: 'Solicitar código de recuperación de contraseña', responses: { 200: { description: 'Código enviado al correo' } } } },
            '/api/auth/reset-password': { post: { tags: ['Auth'], summary: 'Restablecer contraseña con código', responses: { 200: { description: 'Contraseña actualizada' } } } },
            '/api/auth/activate': { post: { tags: ['Auth'], summary: 'Activar cuenta de usuario', responses: { 200: { description: 'Cuenta activada' } } } },
            '/api/clientes': { get: { tags: ['Clientes'], summary: 'Listar todos los clientes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de clientes' } } }, post: { tags: ['Clientes'], summary: 'Crear nuevo cliente', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Cliente creado' } } } },
            '/api/clientes/{id}': { get: { tags: ['Clientes'], summary: 'Obtener cliente por ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Cliente encontrado' }, 404: { description: 'No encontrado' } } }, put: { tags: ['Clientes'], summary: 'Actualizar cliente', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Cliente actualizado' } } }, delete: { tags: ['Clientes'], summary: 'Eliminar cliente', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Cliente eliminado' } } } },
            '/api/mascotas': { get: { tags: ['Mascotas'], summary: 'Listar todas las mascotas', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de mascotas' } } }, post: { tags: ['Mascotas'], summary: 'Registrar nueva mascota', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Mascota registrada' } } } },
            '/api/mascotas/{id}': { get: { tags: ['Mascotas'], summary: 'Obtener mascota por ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Mascota encontrada' } } }, put: { tags: ['Mascotas'], summary: 'Actualizar mascota', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Mascota actualizada' } } }, delete: { tags: ['Mascotas'], summary: 'Eliminar mascota', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Mascota eliminada' } } } },
            '/api/ventas': { get: { tags: ['Ventas'], summary: 'Listar todas las ventas', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de ventas' } } }, post: { tags: ['Ventas'], summary: 'Registrar nueva venta', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Venta registrada' } } } },
            '/api/ventas/{id}': { get: { tags: ['Ventas'], summary: 'Obtener venta por ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Venta encontrada' } } }, delete: { tags: ['Ventas'], summary: 'Eliminar venta', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Venta eliminada' } } } },
            '/api/servicios': { get: { tags: ['Servicios'], summary: 'Listar servicios', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de servicios' } } }, post: { tags: ['Servicios'], summary: 'Crear servicio', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Servicio creado' } } } },
            '/api/servicios/{id}': { put: { tags: ['Servicios'], summary: 'Actualizar servicio', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Servicio actualizado' } } }, delete: { tags: ['Servicios'], summary: 'Eliminar servicio', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Servicio eliminado' } } } },
            '/api/empleados': { get: { tags: ['Empleados'], summary: 'Listar empleados', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de empleados' } } }, post: { tags: ['Empleados'], summary: 'Crear empleado', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Empleado creado' } } } },
            '/api/empleados/{id}': { put: { tags: ['Empleados'], summary: 'Actualizar empleado', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Empleado actualizado' } } }, delete: { tags: ['Empleados'], summary: 'Eliminar empleado', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Empleado eliminado' } } } },
            '/api/horarios': { get: { tags: ['Horarios'], summary: 'Listar horarios', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de horarios' } } }, post: { tags: ['Horarios'], summary: 'Crear horario', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Horario creado' } } } },
            '/api/horarios/{id}': { put: { tags: ['Horarios'], summary: 'Actualizar horario', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Horario actualizado' } } }, delete: { tags: ['Horarios'], summary: 'Eliminar horario', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Horario eliminado' } } } },
            '/api/agendamiento': { get: { tags: ['Agendamiento'], summary: 'Listar citas', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de citas' } } }, post: { tags: ['Agendamiento'], summary: 'Crear cita', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Cita creada' } } } },
            '/api/agendamiento/{id}': { put: { tags: ['Agendamiento'], summary: 'Actualizar cita', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Cita actualizada' } } }, delete: { tags: ['Agendamiento'], summary: 'Cancelar cita', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Cita cancelada' } } } },
            '/api/roles': { get: { tags: ['Roles'], summary: 'Listar roles', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de roles' } } }, post: { tags: ['Roles'], summary: 'Crear rol', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Rol creado' } } } },
            '/api/roles/{id}': { put: { tags: ['Roles'], summary: 'Actualizar rol', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Rol actualizado' } } }, delete: { tags: ['Roles'], summary: 'Eliminar rol', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Rol eliminado' } } } },
            '/api/usuarios': { get: { tags: ['Usuarios'], summary: 'Listar usuarios', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de usuarios' } } } },
            '/api/usuarios/{id}': { put: { tags: ['Usuarios'], summary: 'Actualizar usuario', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Usuario actualizado' } } }, delete: { tags: ['Usuarios'], summary: 'Eliminar usuario', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Usuario eliminado' } } } },
            '/api/historial': { get: { tags: ['Historial'], summary: 'Listar historial médico', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Lista de registros' } } }, post: { tags: ['Historial'], summary: 'Crear registro médico', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Registro creado' } } } },
            '/api/historial/{id}': { put: { tags: ['Historial'], summary: 'Actualizar registro', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Registro actualizado' } } }, delete: { tags: ['Historial'], summary: 'Eliminar registro', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Registro eliminado' } } } },
            '/api/health': { get: { tags: ['Auth'], summary: 'Health check del servidor', responses: { 200: { description: 'Servidor operativo' } } } },
        }
    },
    apis: [],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
