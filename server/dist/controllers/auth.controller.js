"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mail_service_1 = require("../services/mail.service");
const SECRET = process.env.JWT_SECRET || 'kaivet_secret';
class AuthController {
    static async register(req, res) {
        try {
            const correo = req.body.correo?.trim().toLowerCase();
            const contrasena = req.body.contrasena;
            const nombre_usuario = req.body.nombre_usuario?.trim();
            const nombre_rol = req.body.nombre_rol || 'cliente';
            const cedula = req.body.cedula;
            const id_cliente = req.body.id_cliente;
            const id_empleado = req.body.id_empleado;
            const telefono = req.body.telefono;
            const direccion = req.body.direccion;
            if (!correo || !contrasena || !nombre_usuario) {
                return res.status(400).json({ error: 'Correo, contraseña y nombre_usuario son obligatorios' });
            }
            const existeCorreo = await prisma_1.default.usuario.findFirst({ where: { correo } });
            if (existeCorreo)
                return res.status(400).json({ error: 'El correo ya se encuentra registrado. Intenta con otro o inicia sesión.' });
            if (cedula) {
                const existeCedula = await prisma_1.default.usuario.findFirst({ where: { cedula } });
                const existeClienteCedula = await prisma_1.default.cliente.findFirst({ where: { cedula } });
                if (existeCedula || existeClienteCedula) {
                    return res.status(400).json({ error: 'El número de documento (Cédula) ya está registrado en el sistema.' });
                }
            }
            let rolDb = await prisma_1.default.roles.findFirst({
                where: { nombre_rol: { contains: nombre_rol } }
            });
            if (!rolDb) {
                rolDb = await prisma_1.default.roles.create({ data: { nombre_rol: nombre_rol, activo: true } });
            }
            let clienteIdToLink = id_cliente ? parseInt(id_cliente) : null;
            let empleadoIdToLink = id_empleado ? parseInt(id_empleado) : null;
            if (nombre_rol.toLowerCase().includes('cliente') && !clienteIdToLink) {
                const clienteExistente = await prisma_1.default.cliente.findFirst({
                    where: { OR: [{ correo }, { cedula: cedula || '---' }] }
                });
                if (clienteExistente) {
                    clienteIdToLink = clienteExistente.id_cliente;
                }
                else {
                    const nuevoCliente = await prisma_1.default.cliente.create({
                        data: {
                            nombre: nombre_usuario,
                            correo: correo,
                            cedula: cedula,
                            telefono: telefono,
                            direccion: direccion,
                            tipo_documento: req.body.tipoDocumento || 'CC'
                        }
                    });
                    clienteIdToLink = nuevoCliente.id_cliente;
                }
            }
            const hashedPassword = await bcryptjs_1.default.hash(contrasena, 10);
            const usuario = await prisma_1.default.usuario.create({
                data: {
                    correo,
                    contrasena: hashedPassword,
                    nombre_usuario,
                    id_rol: rolDb.id_rol,
                    cedula,
                    activo: true,
                    estado: 'activo'
                },
            });
            const nombreRolLower = rolDb.nombre_rol.toLowerCase();
            if (nombreRolLower === 'cliente') {
                const clienteExistente = await prisma_1.default.cliente.findFirst({
                    where: { OR: [{ correo }, { cedula: cedula || '---' }] }
                });
                if (!clienteExistente) {
                    const nuevoCliente = await prisma_1.default.cliente.create({
                        data: {
                            nombre: nombre_usuario,
                            correo,
                            cedula,
                            tipo_documento: req.body.tipoDocumento || 'CC',
                            telefono: telefono || '00000000',
                            direccion: direccion || 'Sin dirección'
                        }
                    });
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: usuario.id_usuario },
                        data: { id_cliente: nuevoCliente.id_cliente }
                    });
                }
                else {
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: usuario.id_usuario },
                        data: { id_cliente: clienteExistente.id_cliente }
                    });
                }
            }
            else {
                const empleadoExistente = await prisma_1.default.empleado.findFirst({
                    where: { OR: [{ correo }, { cedula: cedula || '---' }] }
                });
                if (!empleadoExistente) {
                    const nuevoEmpleado = await prisma_1.default.empleado.create({
                        data: {
                            nombre: nombre_usuario,
                            correo,
                            cedula,
                            tipo_documento: req.body.tipoDocumento || 'CC',
                            telefono: telefono || '00000000',
                            direccion: direccion || 'Sin dirección',
                            cargo: rolDb.nombre_rol
                        }
                    });
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: usuario.id_usuario },
                        data: { id_empleado: nuevoEmpleado.id_empleado }
                    });
                }
                else {
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: usuario.id_usuario },
                        data: { id_empleado: empleadoExistente.id_empleado }
                    });
                }
            }
            (0, mail_service_1.sendWelcomeEmail)(correo, nombre_usuario).catch(err => console.error('[AUTH-SYNC] Error al enviar bienvenida:', err));
            const token = jsonwebtoken_1.default.sign({ id: usuario.id_usuario, email: usuario.correo, rol: rolDb.nombre_rol }, SECRET, { expiresIn: '24h' });
            res.status(201).json({
                token,
                usuario: {
                    id_usuario: usuario.id_usuario,
                    correo: usuario.correo,
                    nombre_usuario: usuario.nombre_usuario,
                    id_rol: usuario.id_rol,
                    rol: rolDb.nombre_rol,
                    cedula: usuario.cedula,
                    id_cliente: usuario.id_cliente,
                    id_empleado: usuario.id_empleado,
                    estado: usuario.estado
                }
            });
        }
        catch (error) {
            console.error('[AUTH] ERROR EN REGISTRO:', error);
            res.status(500).json({ error: 'Error interno del servidor al registrar.' });
        }
    }
    static async login(req, res) {
        try {
            const { correo, contrasena } = req.body;
            if (!correo || !contrasena) {
                return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
            }
            const emailLower = correo.trim().toLowerCase();
            const usuario = await prisma_1.default.usuario.findFirst({
                where: { correo: emailLower },
                include: { rol: true }
            });
            if (!usuario) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }
            if (usuario.activo === false) {
                return res.status(403).json({ error: 'Esta cuenta está desactivada' });
            }
            const valido = await bcryptjs_1.default.compare(contrasena, usuario.contrasena);
            if (!valido) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }
            const token = jsonwebtoken_1.default.sign({ id: usuario.id_usuario, email: usuario.correo, rol: usuario.rol.nombre_rol }, SECRET, { expiresIn: '24h' });
            res.json({
                token,
                usuario: {
                    id_usuario: usuario.id_usuario,
                    correo: usuario.correo,
                    nombre_usuario: usuario.nombre_usuario,
                    id_rol: usuario.id_rol,
                    rol: usuario.rol.nombre_rol,
                    cedula: usuario.cedula,
                    id_cliente: usuario.id_cliente,
                    id_empleado: usuario.id_empleado,
                    nombre_completo: usuario.nombre_completo,
                    grupo_usuario: usuario.grupo_usuario,
                    permisos_especificos: usuario.permisos_especificos,
                    estado: usuario.estado
                }
            });
        }
        catch (error) {
            console.error('[AUTH] ERROR EN LOGIN:', error);
            res.status(500).json({ error: 'Error al iniciar sesión' });
        }
    }
    static async getUsers(_req, res) {
        try {
            const usuarios = await prisma_1.default.usuario.findMany({
                include: { rol: true }
            });
            res.json(usuarios);
        }
        catch (error) {
            console.error('[AUTH] ERROR AL LISTAR USUARIOS:', error);
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    }
    static async updateUser(req, res) {
        try {
            const id_usuario = parseInt(req.params.id);
            const { nombre_usuario, correo, contrasena, id_rol, nombre_rol, cedula, activo, id_cliente, id_empleado } = req.body;
            const data = {};
            if (nombre_usuario)
                data.nombre_usuario = nombre_usuario;
            if (correo)
                data.correo = correo;
            if (cedula !== undefined)
                data.cedula = cedula;
            if (activo !== undefined)
                data.activo = activo;
            if (id_cliente !== undefined)
                data.id_cliente = id_cliente;
            if (id_empleado !== undefined)
                data.id_empleado = id_empleado;
            if (nombre_rol) {
                let rolDb = await prisma_1.default.roles.findFirst({ where: { nombre_rol } });
                if (!rolDb) {
                    rolDb = await prisma_1.default.roles.create({ data: { nombre_rol } });
                }
                data.id_rol = rolDb.id_rol;
            }
            else if (id_rol) {
                data.id_rol = parseInt(id_rol);
            }
            if (contrasena) {
                data.contrasena = await bcryptjs_1.default.hash(contrasena, 10);
            }
            const actualizada = await prisma_1.default.usuario.update({
                where: { id_usuario },
                data,
                include: { rol: true }
            });
            const nuevoRolNombre = actualizada.rol?.nombre_rol?.toLowerCase() || '';
            if (nuevoRolNombre === 'cliente') {
                if (actualizada.id_empleado) {
                    try {
                        const empId = actualizada.id_empleado;
                        await prisma_1.default.usuario.update({
                            where: { id_usuario: actualizada.id_usuario },
                            data: { id_empleado: null }
                        });
                        await prisma_1.default.empleado.delete({ where: { id_empleado: empId } });
                    }
                    catch (e) {
                        console.warn('[SYNC] No se pudo borrar el empleado, solo se desvinculó.');
                    }
                }
                const clienteExistente = await prisma_1.default.cliente.findFirst({
                    where: { OR: [{ correo: actualizada.correo }, { cedula: actualizada.cedula || '---' }] }
                });
                if (!clienteExistente) {
                    const nuevoCliente = await prisma_1.default.cliente.create({
                        data: {
                            nombre: actualizada.nombre_usuario,
                            correo: actualizada.correo,
                            cedula: actualizada.cedula,
                            tipo_documento: 'CC',
                            telefono: '00000000',
                            direccion: 'Creado por cambio de rol'
                        }
                    });
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: actualizada.id_usuario },
                        data: { id_cliente: nuevoCliente.id_cliente }
                    });
                }
                else {
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: actualizada.id_usuario },
                        data: { id_cliente: clienteExistente.id_cliente }
                    });
                }
            }
            else {
                if (actualizada.id_cliente) {
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: actualizada.id_usuario },
                        data: { id_cliente: null }
                    });
                }
                const empleadoExistente = await prisma_1.default.empleado.findFirst({
                    where: { OR: [{ correo: actualizada.correo }, { cedula: actualizada.cedula || '---' }] }
                });
                if (!empleadoExistente) {
                    const nuevoEmp = await prisma_1.default.empleado.create({
                        data: {
                            nombre: actualizada.nombre_usuario,
                            correo: actualizada.correo,
                            cedula: actualizada.cedula,
                            tipo_documento: 'CC',
                            telefono: '00000000',
                            direccion: 'Creado por cambio de rol',
                            cargo: actualizada.rol?.nombre_rol || 'Staff'
                        }
                    });
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: actualizada.id_usuario },
                        data: { id_empleado: nuevoEmp.id_empleado }
                    });
                }
                else {
                    await prisma_1.default.empleado.update({
                        where: { id_empleado: empleadoExistente.id_empleado },
                        data: { cargo: actualizada.rol?.nombre_rol || 'Staff' }
                    });
                    await prisma_1.default.usuario.update({
                        where: { id_usuario: actualizada.id_usuario },
                        data: { id_empleado: empleadoExistente.id_empleado }
                    });
                }
            }
            res.json(actualizada);
        }
        catch (error) {
            console.error('[AUTH] ERROR EN PUT /users/:id:', error);
            res.status(500).json({ error: 'Error al actualizar usuario' });
        }
    }
    static async deleteUser(req, res) {
        try {
            const id_usuario = parseInt(req.params.id);
            await prisma_1.default.usuario.delete({ where: { id_usuario } });
            res.status(204).send();
        }
        catch (error) {
            console.error('[AUTH] ERROR AL ELIMINAR USUARIO:', error);
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    }
    static async requestReset(req, res) {
        const { email } = req.body;
        const emailLower = email?.trim().toLowerCase();
        try {
            const usuario = await prisma_1.default.usuario.findUnique({ where: { correo: emailLower } });
            if (!usuario) {
                return res.status(404).json({ error: 'No existe un usuario con este correo.' });
            }
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            await prisma_1.default.usuario.update({
                where: { id_usuario: usuario.id_usuario },
                data: { token_recuperacion: codigo }
            });
            (0, mail_service_1.sendResetCodeEmail)(email, codigo).catch(err => console.error('[AUTH-ASYNC] Error al enviar código:', err));
            res.json({ success: true, message: 'Código de recuperación enviado' });
        }
        catch (error) {
            console.error('[AUTH] REFRESH-RESET ERROR:', error);
            res.status(500).json({ error: 'Error al enviar código' });
        }
    }
    static async resetPassword(req, res) {
        const { email, token, newPassword } = req.body;
        const emailLower = email?.trim().toLowerCase();
        try {
            const usuario = await prisma_1.default.usuario.findUnique({ where: { correo: emailLower } });
            if (!usuario || usuario.token_recuperacion !== token) {
                return res.status(400).json({ error: 'Código inválido o correo incorrecto' });
            }
            const hashedPsw = await bcryptjs_1.default.hash(newPassword, 10);
            await prisma_1.default.usuario.update({
                where: { id_usuario: usuario.id_usuario },
                data: {
                    contrasena: hashedPsw,
                    token_recuperacion: null
                }
            });
            res.json({ success: true, message: 'Contraseña actualizada' });
        }
        catch (error) {
            console.error('[AUTH] RESET-PASSWORD ERROR:', error);
            res.status(500).json({ error: 'Error al cambiar contraseña' });
        }
    }
}
exports.AuthController = AuthController;
