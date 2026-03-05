import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { ShoppingCart, Calendar, User, DollarSign, Stethoscope, Package, Calculator, CheckCircle2, X, Plus, ChevronLeft, Search, Heart } from 'lucide-react';
import { useVentas } from "../hooks/useVentas";
import { useClientes, Cliente, Mascota } from "../hooks/useClientes";
import { useUsuario, Usuario } from "../hooks/useUsuario";
import { Separator } from "../ui/separator";

interface NuevaVentaPageProps {
    onBack: () => void;
    onSuccess: () => void;
}

const serviciosDisponibles = [
    { nombre: 'Consulta General', precio: 45000 },
    { nombre: 'Vacunación', precio: 35000 },
    { nombre: 'Desparasitación', precio: 25000 },
    { nombre: 'Limpieza Dental', precio: 80000 },
    { nombre: 'Cirugía Menor', precio: 150000 },
    { nombre: 'Control de Peso', precio: 30000 },
    { nombre: 'Peluquería Canina', precio: 40000 },
    { nombre: 'Ecografía', precio: 60000 },
    { nombre: 'Radiografía', precio: 55000 },
    { nombre: 'Análisis de Sangre', precio: 35000 },
    { nombre: 'Castración', precio: 120000 }
];

const productosDisponibles = [
    { nombre: 'Vacuna Antirrábica', precio: 35000 },
    { nombre: 'Vacuna Múltiple', precio: 55000 },
    { nombre: 'Desparasitante', precio: 18000 },
    { nombre: 'Antibiótico', precio: 45000 },
    { nombre: 'Analgésico', precio: 25000 },
    { nombre: 'Vitaminas', precio: 35000 },
    { nombre: 'Collar Antipulgas', precio: 28000 }
];

export function NuevaVentaPage({ onBack, onSuccess }: NuevaVentaPageProps) {
    const { crearVenta, loading: loadingVentas } = useVentas();
    const { clientes } = useClientes();
    const { usuarios } = useUsuario();

    const [busquedaCedula, setBusquedaCedula] = useState("");
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [mascotasCliente, setMascotasCliente] = useState<Mascota[]>([]);
    const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);

    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        cliente: '',
        mascota: '',
        veterinario: '',
        servicios: [] as { nombre: string; precio: number; cantidad: number }[],
        productos: [] as { nombre: string; precio: number; cantidad: number }[],
        subtotal: 0,
        descuento: 0,
        impuestos: 0,
        total: 0,
        estado: 'completada' as 'completada' | 'pendiente',
        observaciones: ''
    });

    const doctores = usuarios.filter(u => {
        const roleName = u.roles?.nombre_rol?.toLowerCase();
        return roleName === 'administrador' || roleName === 'veterinario';
    });

    useEffect(() => {
        const serviciosTotal = formData.servicios.reduce((sum, s) => sum + (s.precio * s.cantidad), 0);
        const productosTotal = formData.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
        const subtotal = serviciosTotal + productosTotal;
        const total = subtotal; // No taxes, no discounts

        setFormData(prev => ({
            ...prev,
            subtotal,
            impuestos: 0,
            total
        }));
    }, [formData.servicios, formData.productos]);

    const handleBusquedaChange = (valor: string) => {
        setBusquedaCedula(valor);
        if (valor.trim().length > 0) {
            const matches = clientes.filter(c =>
                (c.cedula || '').toLowerCase().startsWith(valor.toLowerCase()) ||
                (c.nombre || '').toLowerCase().includes(valor.toLowerCase())
            );
            setClientesEncontrados(matches);
            setMostrarResultados(true);

            // Si hay un match exacto por cédula, seleccionarlo automáticamente
            const matchExacto = clientes.find(c => c.cedula === valor);
            if (matchExacto) {
                seleccionarCliente(matchExacto);
                setMostrarResultados(false);
            }
        } else {
            setClientesEncontrados([]);
            setMostrarResultados(false);
        }
    };

    const seleccionarCliente = (cliente: Cliente) => {
        setClienteSeleccionado(cliente);
        setMascotasCliente(cliente.mascotas || []);
        setFormData(prev => ({
            ...prev,
            cliente: cliente.nombre,
            mascota: (cliente.mascotas && cliente.mascotas.length > 0) ? cliente.mascotas[0].nombre : ''
        }));
        setBusquedaCedula(cliente.cedula || '');
        setMostrarResultados(false);
        toast.success("Cliente seleccionado");
    };

    const addServicio = (servicioNombre: string) => {
        const servicio = serviciosDisponibles.find(s => s.nombre === servicioNombre);
        if (servicio && !formData.servicios.find(s => s.nombre === servicio.nombre)) {
            setFormData(prev => ({
                ...prev,
                servicios: [...prev.servicios, { ...servicio, cantidad: 1 }]
            }));
        }
    };

    const removeServicio = (nombre: string) => {
        setFormData(prev => ({
            ...prev,
            servicios: prev.servicios.filter(s => s.nombre !== nombre)
        }));
    };

    const addProducto = (productoNombre: string) => {
        const producto = productosDisponibles.find(p => p.nombre === productoNombre);
        if (producto && !formData.productos.find(p => p.nombre === producto.nombre)) {
            setFormData(prev => ({
                ...prev,
                productos: [...prev.productos, { ...producto, cantidad: 1 }]
            }));
        }
    };

    const removeProducto = (nombre: string) => {
        setFormData(prev => ({
            ...prev,
            productos: prev.productos.filter(p => p.nombre !== nombre)
        }));
    };

    const updateQuantity = (type: 'servicios' | 'productos', nombre: string, delta: number) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].map(item =>
                item.nombre === nombre ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item
            )
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cliente) {
            toast.error("Debe seleccionar un cliente");
            return;
        }

        if (formData.servicios.length === 0 && formData.productos.length === 0) {
            toast.error("Debe agregar al menos un servicio o producto");
            return;
        }

        const result = await crearVenta({
            id_cliente: clienteSeleccionado?.id_cliente || (clienteSeleccionado as any)?.id,
            fecha: formData.fecha,
            hora: formData.hora,
            cliente: formData.cliente, // conservado para compatibilidad si algún log lo lee
            mascota: formData.mascota,
            servicios: [
                ...formData.servicios.map(s => ({ nombre: s.nombre, precio: s.precio, cantidad: s.cantidad })),
                ...formData.productos.map(p => ({ nombre: p.nombre, precio: p.precio, cantidad: p.cantidad }))
            ],
            subtotal: formData.subtotal,
            descuento: formData.descuento,
            impuestos: formData.impuestos,
            total: formData.total,
            estado: formData.estado === 'completada' ? 'completada' : 'pendiente',
            veterinario: formData.veterinario,
            vendedor: formData.veterinario || 'Sistema',
            observaciones: formData.observaciones
        });

        if (result.success) {
            toast.success("Venta registrada exitosamente");
            onSuccess();
        } else {
            toast.error(result.error || "Error al registrar venta");
        }
    };

    return (
        <div className="flex flex-col h-full bg-dark-bg">
            <header className="bg-dark-card/50 backdrop-blur-sm border-b border-dark-color/50 px-5 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-dark-secondary hover:text-dark-primary">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-dark-primary">Nueva Venta</h1>
                            <p className="text-sm text-dark-secondary">Registro manual de transacciones</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={onBack} className="border-dark-color text-dark-secondary hover:bg-dark-hover">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={loadingVentas} className="bg-dark-cta text-white hover:bg-blue-600 px-8">
                            {loadingVentas ? "Guardando..." : "Finalizar Venta"}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="p-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Column: Client and Pet Information */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-dark-hover/10 rounded-xl border border-dark-color border-opacity-30 p-4 sticky top-4 z-30">
                            <div className="flex items-center gap-3 text-dark-primary border-b border-dark-color border-opacity-20 pb-4 mb-4">
                                <Search className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-semibold">Identificación del Cliente</h2>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2 relative">
                                    <Label className="text-xs text-dark-secondary font-bold uppercase tracking-tight ml-1">Buscar por Cédula / Nombre</Label>
                                    <div className="relative">
                                        <Input
                                            value={busquedaCedula}
                                            onChange={(e) => handleBusquedaChange(e.target.value)}
                                            placeholder="Ingrese documento o nombre..."
                                            className="bg-dark-card border-dark-color text-dark-primary h-10 px-4 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                            onBlur={() => setTimeout(() => setMostrarResultados(false), 200)}
                                            onFocus={() => busquedaCedula && setMostrarResultados(true)}
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-secondary opacity-50" />
                                    </div>

                                    {mostrarResultados && clientesEncontrados.length > 0 && (
                                        <div className="absolute z-[100] w-full mt-2 bg-dark-card border border-dark-color rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            {clientesEncontrados.map(cliente => (
                                                <button
                                                    key={cliente.id_cliente}
                                                    className="w-full text-left p-3 hover:bg-blue-500/10 border-b border-dark-color/30 last:border-0 transition-colors group"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        seleccionarCliente(cliente);
                                                    }}
                                                >
                                                    <p className="text-dark-primary font-bold group-hover:text-blue-400 transition-colors">{cliente.nombre}</p>
                                                    <p className="text-[10px] text-dark-secondary uppercase tracking-wider">CC: {cliente.cedula}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {clienteSeleccionado && (
                                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 animate-in slide-in-from-left-2 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-dark-primary font-bold">{clienteSeleccionado.nombre}</p>
                                                <p className="text-[10px] text-dark-secondary">{clienteSeleccionado.correo} | {clienteSeleccionado.telefono}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {clienteSeleccionado && (
                                <div className="pt-4 mt-4 border-t border-dark-color border-opacity-20 space-y-4 animate-in fade-in duration-500">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-dark-secondary uppercase font-bold ml-1">Paciente</Label>
                                        <Select
                                            value={formData.mascota}
                                            onValueChange={(val: string) => setFormData(prev => ({ ...prev, mascota: val }))}
                                        >
                                            <SelectTrigger className="bg-dark-card border-dark-color text-dark-primary h-10 rounded-lg">
                                                <SelectValue placeholder="Seleccione mascota" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-dark-card border-dark-color">
                                                {mascotasCliente.map(m => (
                                                    <SelectItem key={m.id_mascota || (m as any).id} value={m.nombre}>
                                                        <div className="flex items-center gap-2">
                                                            <Heart className="w-3.5 h-3.5 text-pink-400" />
                                                            <span className="text-xs">{m.nombre} <span className="text-[10px] opacity-60">({m.raza})</span></span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-dark-secondary uppercase font-bold ml-1">Atendido por</Label>
                                        <Select
                                            value={formData.veterinario}
                                            onValueChange={(val: string) => setFormData(prev => ({ ...prev, veterinario: val }))}
                                        >
                                            <SelectTrigger className="bg-dark-card border-dark-color text-dark-primary h-10 rounded-lg">
                                                <SelectValue placeholder="Seleccione responsable..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-dark-card border-dark-color">
                                                {doctores.map(d => (
                                                    <SelectItem key={d.id_usuario} value={`Dr. ${d.nombre_usuario}`}>
                                                        <span className="text-xs">Dr. {d.nombre_usuario}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-5 space-y-4">
                            <section className="bg-dark-hover/10 rounded-xl border border-dark-color border-opacity-20 p-4 space-y-4">
                                <div className="flex items-center gap-3 text-dark-primary border-b border-dark-color border-opacity-10 pb-4">
                                    <Stethoscope className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-lg font-semibold">Servicios</h2>
                                </div>
                                <Select onValueChange={addServicio}>
                                    <SelectTrigger className="bg-dark-card border-dark-color text-dark-primary h-10">
                                        <SelectValue placeholder="Agregar servicio..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-dark-card border-dark-color">
                                        {serviciosDisponibles.map(s => (
                                            <SelectItem key={s.nombre} value={s.nombre}>
                                                <div className="flex justify-between items-center w-full min-w-[200px] text-xs">
                                                    <span>{s.nombre}</span>
                                                    <b className="text-blue-400 ml-4">${s.precio.toLocaleString()}</b>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="space-y-2">
                                    {formData.servicios.map(s => (
                                        <div key={s.nombre} className="flex items-center justify-between p-3 bg-dark-card/40 rounded-lg border border-dark-color/50 text-xs animate-in zoom-in-95">
                                            <div className="flex-1">
                                                <p className="text-dark-primary font-bold">{s.nombre}</p>
                                                <p className="text-[10px] text-dark-secondary italic">${s.precio.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => updateQuantity('servicios', s.nombre, -1)} className="w-7 h-7 bg-dark-hover border border-dark-color">-</Button>
                                                <span className="w-6 text-center font-bold">{s.cantidad}</span>
                                                <Button size="icon" variant="ghost" onClick={() => updateQuantity('servicios', s.nombre, 1)} className="w-7 h-7 bg-dark-hover border border-dark-color">+</Button>
                                                <Button size="icon" variant="ghost" onClick={() => removeServicio(s.nombre)} className="w-7 h-7 text-red-400 hover:bg-red-500/10 ml-1"><X className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-dark-hover/10 rounded-xl border border-dark-color border-opacity-20 p-4 space-y-4">
                                <div className="flex items-center gap-3 text-dark-primary border-b border-dark-color border-opacity-10 pb-4">
                                    <Package className="w-5 h-5 text-purple-400" />
                                    <h2 className="text-lg font-semibold">Productos</h2>
                                </div>
                                <Select onValueChange={addProducto}>
                                    <SelectTrigger className="bg-dark-card border-dark-color text-dark-primary h-10">
                                        <SelectValue placeholder="Agregar producto..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-dark-card border-dark-color">
                                        {productosDisponibles.map(p => (
                                            <SelectItem key={p.nombre} value={p.nombre}>
                                                <div className="flex justify-between items-center w-full min-w-[200px] text-xs">
                                                    <span>{p.nombre}</span>
                                                    <b className="text-purple-400 ml-4">${p.precio.toLocaleString()}</b>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="space-y-2">
                                    {formData.productos.map(p => (
                                        <div key={p.nombre} className="flex items-center justify-between p-3 bg-dark-card/40 rounded-lg border border-dark-color/50 text-xs animate-in zoom-in-95">
                                            <div className="flex-1">
                                                <p className="text-dark-primary font-bold">{p.nombre}</p>
                                                <p className="text-[10px] text-dark-secondary italic">${p.precio.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => updateQuantity('productos', p.nombre, -1)} className="w-7 h-7 bg-dark-hover border border-dark-color">-</Button>
                                                <span className="w-6 text-center font-bold">{p.cantidad}</span>
                                                <Button size="icon" variant="ghost" onClick={() => updateQuantity('productos', p.nombre, 1)} className="w-7 h-7 bg-dark-hover border border-dark-color">+</Button>
                                                <Button size="icon" variant="ghost" onClick={() => removeProducto(p.nombre)} className="w-7 h-7 text-red-400 hover:bg-red-500/10 ml-1"><X className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-3">
                        <section className="bg-dark-hover/20 rounded-xl border border-blue-500/20 p-6 space-y-6 sticky top-4 shadow-xl shadow-black/20">
                            <div className="flex items-center gap-3 text-dark-primary border-b border-dark-color border-opacity-10 pb-4">
                                <Calculator className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-semibold uppercase tracking-tight">Resumen</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-dark-secondary text-sm">
                                    <span>Subtotal:</span>
                                    <span className="text-dark-primary font-bold">${formData.subtotal.toLocaleString()}</span>
                                </div>

                                <Separator className="bg-dark-color border-opacity-20" />

                                <div className="space-y-1">
                                    <span className="text-[10px] text-dark-secondary uppercase font-bold tracking-widest">Total a Pagar</span>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-emerald-400 font-bold text-3xl tracking-tighter">${formData.total.toLocaleString()}</span>
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">COP</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] text-dark-secondary uppercase font-bold ml-1">Observaciones</Label>
                                <Textarea
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                    placeholder="Notas de la transacción..."
                                    className="bg-dark-card border-dark-color text-dark-primary min-h-[80px] text-xs resize-none p-3"
                                />
                            </div>

                            <div className="pt-2">
                                <Button onClick={handleSubmit} disabled={loadingVentas} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-md shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                    {loadingVentas ? "Procesando..." : "Finalizar Cobro"}
                                </Button>
                                <p className="text-[9px] text-dark-secondary text-center mt-3 opacity-50">Al finalizar se registrará la transacción en el historial contable.</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
