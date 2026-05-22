import { useState, useEffect, useCallback } from "react";
import { Button } from "../../../shared/components/button";
import { Input } from "../../../shared/components/input";
import { Label } from "../../../shared/components/label";
import { Textarea } from "../../../shared/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/components/select";
import { Badge } from "../../../shared/components/badge";
import { toast } from "sonner";
import { ShoppingCart, Calendar, User, DollarSign, Stethoscope, Package, Calculator, CheckCircle2, X, Plus, ChevronLeft, Search, Heart, Clock } from 'lucide-react';
import { useVentas } from "../hooks/useVentas";
import { useClientes, Cliente, Mascota } from "../../clientes/hooks/useClientes";
import { useUsuarios } from "../../configuracion/hooks/useUsuarios";
import { useServicios } from "../../servicios/hooks/useServicios";
import { Separator } from "../../../shared/components/separator";

interface NuevaVentaPageProps {
    onBack: () => void;
    onSuccess: () => void;
}

export function NuevaVentaPage({ onBack, onSuccess }: NuevaVentaPageProps) {
    const { crearVenta, loading: loadingVentas } = useVentas();
    const { clientes } = useClientes();
    const { usuarios } = useUsuarios();
    const { servicios: dbServicios } = useServicios();

    const [busquedaCedula, setBusquedaCedula] = useState("");
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [mascotasCliente, setMascotasCliente] = useState<Mascota[]>([]);
    const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);

    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        cliente: '',
        id_mascota: '',
        veterinario: '',
        servicios: [] as { id_servicio: number; nombre: string; precio: number; cantidad: number }[],
        productos: [] as { id_servicio: number; nombre: string; precio: number; cantidad: number }[],
        subtotal: 0,
        descuento: 0,
        impuestos: 0,
        total: 0,
        estado: 'completada' as 'completada' | 'pendiente',
        observaciones: ''
    });

    const doctores = (usuarios as any[]).filter(u => {
        const rolObj = u.rol || u.roles;
        const roleName = (typeof rolObj === 'string' ? rolObj : rolObj?.nombre_rol)?.toLowerCase() || '';
        return roleName.includes('administrador') || roleName.includes('veterinario');
    });

    useEffect(() => {
        const serviciosTotal = formData.servicios.reduce((sum, s) => sum + (s.precio * s.cantidad), 0);
        const productosTotal = formData.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
        const subtotal = serviciosTotal + productosTotal;
        const total = subtotal;

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
            id_mascota: (cliente.mascotas && cliente.mascotas.length > 0) ? cliente.mascotas[0].id_mascota?.toString() || (cliente.mascotas[0] as any).id?.toString() || '' : ''
        }));
        setBusquedaCedula(cliente.cedula || '');
        setMostrarResultados(false);
        toast.success("Cliente seleccionado");
    };

    const addServicio = (servicioId: string) => {
        const idNum = parseInt(servicioId);
        const servicio = dbServicios.find(s => s.id_servicio === idNum);
        if (servicio && !formData.servicios.find(s => s.id_servicio === idNum)) {
            setFormData(prev => ({
                ...prev,
                servicios: [...prev.servicios, {
                    id_servicio: servicio.id_servicio,
                    nombre: servicio.nombre_servicio || (servicio as any).nombre || 'Servicio',
                    precio: servicio.precio,
                    cantidad: 1
                }]
            }));
        }
    };

    const removeServicio = (id_servicio: number) => {
        setFormData(prev => ({
            ...prev,
            servicios: prev.servicios.filter(s => s.id_servicio !== id_servicio)
        }));
    };

    const removeProducto = (id_servicio: number) => {
        setFormData(prev => ({
            ...prev,
            productos: prev.productos.filter(p => p.id_servicio !== id_servicio)
        }));
    };

    const updateQuantity = (type: 'servicios' | 'productos', id_servicio: number, delta: number) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].map(item =>
                item.id_servicio === id_servicio ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item
            )
        }));
    };

    const validateForm = () => {
        if (!clienteSeleccionado) {
            toast.error("Identificación requerida", {
                description: "Por favor, busca y selecciona un cliente para continuar con la venta."
            });
            return false;
        }

        if (!formData.id_mascota) {
            toast.error("Mascota requerida", {
                description: "Debes seleccionar el paciente asociado a este cobro."
            });
            return false;
        }

        if (formData.servicios.length === 0 && formData.productos.length === 0) {
            toast.error("Carrito vacío", {
                description: "Añade al menos un servicio o producto para registrar la venta."
            });
            return false;
        }

        if (!formData.veterinario) {
            toast.error("Responsable requerido", {
                description: "Selecciona el profesional que atendió la cita."
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) return;

        const result = await crearVenta({
            id_cliente: clienteSeleccionado?.id_cliente || (clienteSeleccionado as any)?.id,
            id_mascota: formData.id_mascota ? parseInt(formData.id_mascota) : null,
            fecha: formData.fecha,
            hora: formData.hora,
            venta_servicios: [
                ...formData.servicios.map(s => ({ id_servicio: s.id_servicio, cantidad: s.cantidad })),
                ...formData.productos.map(p => ({ id_servicio: p.id_servicio, cantidad: p.cantidad }))
            ],
            total: formData.total,
            estado: formData.estado === 'completada' ? 'completada' : 'pendiente',
            observaciones: formData.observaciones
        });

        if (result.success) {
            toast.success("Venta exitosa", {
                description: `Se registró el cobro por un total de $${formData.total.toLocaleString()}.`
            });
            onSuccess();
        } else {
            toast.error("Error de Registro", {
                description: result.error || "No se pudo conectar con el servidor para guardar la venta."
            });
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
                                            className="bg-dark-card border-dark-color text-dark-primary h-12 pl-10 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-dark-secondary" />
                                    </div>

                                    {mostrarResultados && clientesEncontrados.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-color rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {clientesEncontrados.map((c) => (
                                                <button
                                                    key={c.id_cliente}
                                                    onClick={() => seleccionarCliente(c)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-dark-hover text-left transition-colors border-b border-dark-color last:border-0"
                                                >
                                                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-dark-primary">{c.nombre}</p>
                                                        <p className="text-[10px] text-dark-secondary">CC: {c.cedula}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {clienteSeleccionado && (
                                    <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-3 animate-in zoom-in-95">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-dark-primary">{clienteSeleccionado.nombre}</p>
                                                <p className="text-xs text-dark-secondary">{clienteSeleccionado.correo}</p>
                                            </div>
                                        </div>
                                        <Separator className="bg-blue-500/10" />
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="flex items-center gap-2 text-dark-secondary">
                                                <DollarSign className="w-3 h-3" />
                                                <span>Saldo: $0.00</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-dark-secondary text-right justify-end">
                                                <Calendar className="w-3 h-3" />
                                                <span>Miembro hace 1 año</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {clienteSeleccionado && (
                                <div className="mt-6 space-y-5 animate-in slide-in-from-left-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-dark-secondary uppercase font-bold ml-1">Mascota del Paciente</Label>
                                        <Select
                                            value={formData.id_mascota}
                                            onValueChange={(val: string) => setFormData(prev => ({ ...prev, id_mascota: val }))}
                                        >
                                            <SelectTrigger className="bg-dark-card border-dark-color text-dark-primary h-10 rounded-lg">
                                                <SelectValue placeholder={mascotasCliente.length === 0 ? "Sin mascotas registradas" : "Seleccione mascota"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-dark-card border-dark-color">
                                                {mascotasCliente.length === 0 ? (
                                                    <div className="px-3 py-3 text-xs text-dark-secondary italic text-center">
                                                        Este cliente no tiene mascotas registradas
                                                    </div>
                                                ) : (
                                                    mascotasCliente.map(m => (
                                                        <SelectItem key={m.id_mascota || (m as any).id} value={String(m.id_mascota || (m as any).id)}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{m.especie?.toLowerCase().includes('perro') || m.especie?.toLowerCase().includes('canino') ? '🐕' : m.especie?.toLowerCase().includes('gato') || m.especie?.toLowerCase().includes('felino') ? '🐈' : '🐾'}</span>
                                                                <span className="font-semibold">{m.nombre}</span>
                                                                {m.raza && <span className="text-dark-secondary text-xs italic">{m.especie} · {m.raza}</span>}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
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
                                    {dbServicios.map(s => (
                                        <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>
                                            <div className="flex justify-between items-center w-full min-w-[200px] text-xs">
                                                <span>{s.nombre_servicio}</span>
                                                <b className="text-blue-400 ml-4">${s.precio.toLocaleString()}</b>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="space-y-2">
                                {formData.servicios.map(s => (
                                    <div key={s.id_servicio} className="flex items-center justify-between p-3 bg-dark-card/40 rounded-lg border border-dark-color/50 text-xs animate-in zoom-in-95">
                                        <div className="flex-1">
                                            <p className="text-dark-primary font-bold">{s.nombre}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-dark-secondary italic">${s.precio.toLocaleString()}</p>
                                                {dbServicios.find(ds => ds.id_servicio === s.id_servicio)?.duracion && (
                                                    <span className="text-[9px] text-blue-400/70 flex items-center gap-0.5">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {dbServicios.find(ds => ds.id_servicio === s.id_servicio)?.duracion} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); updateQuantity('servicios', s.id_servicio, -1); }} className="w-7 h-7 bg-dark-hover border border-dark-color">-</Button>
                                            <span className="w-6 text-center font-bold">{s.cantidad}</span>
                                            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); updateQuantity('servicios', s.id_servicio, 1); }} className="w-7 h-7 bg-dark-hover border border-dark-color">+</Button>
                                            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); removeServicio(s.id_servicio); }} className="w-7 h-7 text-red-400 hover:bg-red-500/10 ml-1"><X className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-dark-hover/10 rounded-xl border border-dark-color border-opacity-20 p-4 space-y-4">
                            <div className="flex items-center gap-3 text-dark-primary border-b border-dark-color border-opacity-10 pb-4">
                                <Package className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-semibold">Productos del Catálogo</h2>
                            </div>
                            <p className="text-xs text-dark-secondary italic px-2">Selecciona productos disponibles en el catálogo de servicios.</p>
                            <Select onValueChange={(val) => {
                                const idNum = parseInt(val);
                                const prod = dbServicios.find(s => s.id_servicio === idNum);
                                if (prod && !formData.productos.find(p => p.id_servicio === idNum)) {
                                    setFormData(prev => ({
                                        ...prev,
                                        productos: [...prev.productos, {
                                            id_servicio: prod.id_servicio,
                                            nombre: prod.nombre_servicio || (prod as any).nombre || 'Producto',
                                            precio: prod.precio,
                                            cantidad: 1
                                        }]
                                    }));
                                }
                            }}>
                                <SelectTrigger className="bg-dark-card border-dark-color text-dark-primary h-10">
                                    <SelectValue placeholder="Agregar producto..." />
                                </SelectTrigger>
                                <SelectContent className="bg-dark-card border-dark-color">
                                    {dbServicios.map(s => (
                                        <SelectItem key={`prod-${s.id_servicio}`} value={s.id_servicio.toString()}>
                                            <div className="flex justify-between items-center w-full min-w-[200px] text-xs">
                                                <span>{s.nombre_servicio}</span>
                                                <b className="text-purple-400 ml-4">${s.precio.toLocaleString()}</b>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="space-y-2">
                                {formData.productos.map(p => (
                                    <div key={p.id_servicio} className="flex items-center justify-between p-3 bg-dark-card/40 rounded-lg border border-dark-color/50 text-xs animate-in zoom-in-95">
                                        <div className="flex-1">
                                            <p className="text-dark-primary font-bold">{p.nombre}</p>
                                            <p className="text-[10px] text-dark-secondary italic">${p.precio.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); updateQuantity('productos', p.id_servicio, -1); }} className="w-7 h-7 bg-dark-hover border border-dark-color">-</Button>
                                            <span className="w-6 text-center font-bold">{p.cantidad}</span>
                                            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); updateQuantity('productos', p.id_servicio, 1); }} className="w-7 h-7 bg-dark-hover border border-dark-color">+</Button>
                                            <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); removeProducto(p.id_servicio); }} className="w-7 h-7 text-red-300 hover:bg-red-500/10 ml-1"><X className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

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

