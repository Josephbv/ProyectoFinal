import { useState, useEffect, useRef } from "react";

interface LandingPageProps {
    onGoToLogin: () => void;
}

const modules = [
    {
        emoji: "🐾",
        title: "Gestión de Mascotas",
        description:
            "Registra, consulta y actualiza el perfil clínico completo de cada paciente con historial médico, vacunas y seguimiento.",
        color: "#2563eb",
        bg: "#eff6ff",
    },
    {
        emoji: "📅",
        title: "Agendamiento de Citas",
        description:
            "Programa citas fácilmente, asigna veterinarios disponibles y recibe confirmaciones automáticas por correo.",
        color: "#059669",
        bg: "#ecfdf5",
    },
    {
        emoji: "🩺",
        title: "Historial Clínico",
        description:
            "Accede al historial médico completo de cada mascota: diagnósticos, tratamientos y evolución del paciente.",
        color: "#7c3aed",
        bg: "#f5f3ff",
    },
    {
        emoji: "💰",
        title: "Ventas y Facturación",
        description:
            "Genera facturas, controla ingresos y lleva el registro financiero completo de todos los servicios prestados.",
        color: "#ea580c",
        bg: "#fff7ed",
    },
];

const features = [
    { emoji: "🔐", text: "Acceso seguro por roles" },
    { emoji: "☁️", text: "Disponible 24/7 en la nube" },
    { emoji: "👥", text: "Gestión multiusuario" },
    { emoji: "📧", text: "Notificaciones por correo" },
    { emoji: "📊", text: "Dashboard en tiempo real" },
    { emoji: "❤️", text: "Hecho con amor por mascotas" },
];

const benefits = [
    "Control total de pacientes y sus dueños",
    "Agendamiento inteligente con notificaciones",
    "Historial clínico siempre disponible",
    "Facturación y control de ingresos",
    "Acceso diferenciado por rol de usuario",
];

const defaultServices = [
    {
        nombreServicio: "Inseminación",
        descripcion: "Servicio de inseminación artificial especializada para perros y gatos.",
        idServicio: 9
    },
    {
        nombreServicio: "Progesterona",
        descripcion: "Monitoreo y pruebas de progesterona para determinar el momento óptimo de reproducción.",
        idServicio: 10
    },
    {
        nombreServicio: "Peluquería Canina",
        descripcion: "Servicio profesional de peluquería y estética canina para el bienestar de tu mascota.",
        idServicio: 11
    },
    {
        nombreServicio: "Espermogramas",
        descripcion: "Estudio de laboratorio esencial para evaluar la calidad, cantidad, movilidad y morfología de los espermatozoides, determinando la capacidad reproductiva y fertilidad canina.",
        idServicio: 14
    },
    {
        nombreServicio: "Consulta",
        descripcion: "Exámenes médicos generales, chequeos de salud preventivos y diagnóstico integral.",
        idServicio: 15
    },
    {
        nombreServicio: "Baño de Espuma para Loros",
        descripcion: "Servicio especializado de aseo e higiene con espuma para loros y aves domésticas.",
        idServicio: 16
    }
];

const getServiceMeta = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("inseminacion") || n.includes("reprod")) return { emoji: "🧬", bg: "#eff6ff", color: "#2563eb" };
    if (n.includes("progesterona") || n.includes("hormon")) return { emoji: "🧪", bg: "#f5f3ff", color: "#7c3aed" };
    if (n.includes("peluqueria") || n.includes("corte") || n.includes("estetica") || n.includes("canina")) return { emoji: "✂️", bg: "#ecfdf5", color: "#059669" };
    if (n.includes("espermograma") || n.includes("lab")) return { emoji: "🔬", bg: "#f0fdfa", color: "#0d9488" };
    if (n.includes("consulta") || n.includes("revision") || n.includes("chequeo")) return { emoji: "🩺", bg: "#fdf2f8", color: "#db2777" };
    if (n.includes("baño") || n.includes("bano") || n.includes("espuma") || n.includes("loro") || n.includes("ave")) return { emoji: "🦜", bg: "#fff7ed", color: "#ea580c" };
    return { emoji: "🐾", bg: "#f1f5f9", color: "#64748b" };
};

const formatTitle = (title: string) => {
    if (!title) return "";
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
};

export function LandingPage({ onGoToLogin }: LandingPageProps) {
    const [current, setCurrent] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const resp = await fetch("/api/servicios");
                if (resp.ok) {
                    const data = await resp.json();
                    const activeServices = data.filter((s: any) => {
                        const est = (s.estado || s.Estado || "").toLowerCase();
                        return est === "activo" || est === "";
                    });
                    if (activeServices.length > 0) {
                        setServices(activeServices);
                        return;
                    }
                }
            } catch (err) {
                console.error("Error al cargar servicios dinámicos:", err);
            }
            setServices(defaultServices);
        };
        fetchServices();
    }, []);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % modules.length);
        }, 3500);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const goTo = (idx: number) => {
        setCurrent(idx);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % modules.length);
        }, 3500);
    };

    const mod = modules[current];

    return (
        <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#ffffff" }}>

            {/* ─── NAVBAR ─── */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                background: "rgba(30,58,138,0.97)", backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                padding: "0 24px", height: "64px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: 38, height: 38, background: "#2563eb", borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, boxShadow: "0 4px 12px rgba(37,99,235,0.4)"
                    }}>🐾</div>
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>
                        Kai<span style={{ color: "#93c5fd" }}>Vet</span>
                    </span>
                </div>

                {/* Desktop links */}
                <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="landing-desktop-nav">
                    {[["#features", "Características"], ["#about", "¿Por qué KaiVet?"], ["#contact", "Contacto"]].map(([href, label]) => (
                        <a key={href} href={href} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}>
                            {label}
                        </a>
                    ))}
                    <button onClick={onGoToLogin} style={{
                        background: "#fff", color: "#1e3a8a", border: "none", borderRadius: 12,
                        padding: "10px 22px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.2)", transition: "all 0.2s"
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                        Iniciar Sesión →
                    </button>
                </div>

                {/* Mobile hamburger */}
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: 24 }}
                    className="landing-mobile-menu-btn">
                    {menuOpen ? "✕" : "☰"}
                </button>
            </nav>

            {/* Mobile menu */}
            {menuOpen && (
                <div style={{
                    position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
                    background: "#1e3a8a", padding: 24, display: "flex", flexDirection: "column", gap: 16,
                }}>
                    {[["#features", "Características"], ["#about", "¿Por qué KaiVet?"], ["#contact", "Contacto"]].map(([href, label]) => (
                        <a key={href} href={href} onClick={() => setMenuOpen(false)}
                            style={{ color: "#fff", textDecoration: "none", fontSize: 16, fontWeight: 600, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            {label}
                        </a>
                    ))}
                    <button onClick={onGoToLogin} style={{
                        background: "#2563eb", color: "#fff", border: "none", borderRadius: 12,
                        padding: "14px", fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 8
                    }}>
                        Iniciar Sesión
                    </button>
                </div>
            )}

            {/* ─── HERO ─── */}
            <section style={{
                background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #172554 100%)",
                paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
                textAlign: "center",
            }}>
                <div style={{ maxWidth: 800, margin: "0 auto" }}>
                    {/* Badge */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 999, padding: "8px 20px", marginBottom: 32,
                    }}>
                        <span style={{ fontSize: 14 }}>✨</span>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Sistema Veterinario Integral</span>
                    </div>

                    <h1 style={{
                        color: "#ffffff", fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900,
                        lineHeight: 1.15, marginBottom: 20, letterSpacing: -1,
                    }}>
                        Tu clínica veterinaria,
                        <br />
                        <span style={{ color: "#93c5fd" }}>perfectamente organizada</span>
                    </h1>

                    <p style={{
                        color: "rgba(255,255,255,0.88)", fontSize: "clamp(1rem, 2vw, 1.25rem)",
                        lineHeight: 1.7, marginBottom: 40, maxWidth: 680, margin: "0 auto 40px"
                    }}>
                        KaiVet es el sistema de gestión veterinaria que simplifica el manejo de pacientes,
                        citas, historial clínico y facturación en un solo lugar.
                    </p>

                    {/* CTA buttons */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 64 }}>
                        <button onClick={onGoToLogin} style={{
                            background: "#ffffff", color: "#1e3a8a", border: "none", borderRadius: 16,
                            padding: "16px 36px", fontSize: 17, fontWeight: 900, cursor: "pointer",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.25)", transition: "all 0.2s"
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)"; }}>
                            Ingresar al Sistema →
                        </button>
                        <a href="#features" style={{
                            color: "#fff", textDecoration: "none", border: "2px solid rgba(255,255,255,0.4)",
                            borderRadius: 16, padding: "16px 36px", fontSize: 17, fontWeight: 700,
                            transition: "all 0.2s", display: "inline-block"
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = ""; }}>
                            Ver características
                        </a>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 700, margin: "0 auto" }}>
                        {[
                            { value: "100%", label: "En la nube" },
                            { value: "4", label: "Roles de acceso" },
                            { value: "∞", label: "Mascotas registradas" },
                            { value: "24/7", label: "Disponibilidad" },
                        ].map((s, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 16, padding: "20px 12px", textAlign: "center"
                            }}>
                                <div style={{ color: "#fff", fontSize: 28, fontWeight: 900 }}>{s.value}</div>
                                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CAROUSEL: MÓDULOS ─── */}
            <section id="features" style={{ background: "#f8fafc", padding: "80px 24px" }}>
                <div style={{ maxWidth: 960, margin: "0 auto" }}>
                    {/* ... (carrusel existente se mantiene igual) ... */}
                </div>
            </section>

            {/* ─── SERVICIOS ─── */}
            <section style={{ padding: "100px 24px", background: "#ffffff" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 64 }}>
                        <span style={{ color: "#2563eb", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: 2 }}>Excelencia Médica</span>
                        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#0f172a", marginTop: 8 }}>Nuestros Servicios <span style={{ color: "#2563eb" }}>Especializados</span></h2>
                        <p style={{ color: "#64748b", maxWidth: 600, margin: "16px auto 0", fontSize: 17 }}>Cuidado integral para tus mascotas con los mejores estándares de calidad y atención profesional.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
                        {services.map((s, i) => {
                            const name = s.nombreServicio || s.NombreServicio || s.nombre_servicio || "";
                            const desc = s.descripcion || s.Descripcion || "";
                            const meta = getServiceMeta(name);
                            return (
                                <div key={i} style={{
                                    background: "#fff", borderRadius: 28,
                                    border: "1px solid #f1f5f9", boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                                    padding: 32, display: "flex", flexDirection: "column", gap: 20,
                                    transition: "all 0.3s ease"
                                }} className="service-card">
                                    <div style={{
                                        width: 60, height: 60, borderRadius: 18, background: meta.bg,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 30, boxShadow: `0 8px 20px ${meta.bg}`
                                    }}>
                                        {meta.emoji}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                            {formatTitle(name)}
                                        </h3>
                                        <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                                            {desc}
                                        </p>
                                    </div>
                                    <div style={{ marginTop: "auto", paddingTop: 10 }}>
                                        <button onClick={onGoToLogin} style={{
                                            background: "none", border: "none", color: "#2563eb",
                                            fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex",
                                            alignItems: "center", gap: 6, padding: 0
                                        }}>
                                            Solicitar servicio →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <style>{`
                .service-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px rgba(0,0,0,0.08) !important; border-color: #2563eb22; }
            `}</style>

            {/* ─── ¿POR QUÉ KAIVET? ─── */}
            <section id="about" style={{ background: "#ffffff", padding: "80px 24px" }}>
                <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="landing-about-grid">
                    {/* Left: text */}
                    <div>
                        <span style={{
                            display: "inline-block", background: "#dbeafe", color: "#1d4ed8",
                            borderRadius: 999, padding: "6px 18px", fontSize: 13, fontWeight: 700, marginBottom: 20
                        }}>¿Por qué KaiVet?</span>

                        <h2 style={{ color: "#0f172a", fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.25 }}>
                            La solución que tu clínica <span style={{ color: "#2563eb" }}>necesitaba</span>
                        </h2>

                        <p style={{ color: "#475569", fontSize: 16, lineHeight: 1.75, margin: "0 0 28px" }}>
                            KaiVet fue diseñado pensando en las clínicas veterinarias que necesitan una herramienta
                            confiable, intuitiva y completa. Sin complicaciones, sin papeles, sin pérdidas de información.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
                            {benefits.map((b, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{
                                        width: 24, height: 24, background: "#dbeafe", borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0
                                    }}>✓</span>
                                    <span style={{ color: "#1e293b", fontSize: 15, fontWeight: 500 }}>{b}</span>
                                </div>
                            ))}
                        </div>

                        <button onClick={onGoToLogin} style={{
                            background: "#2563eb", color: "#fff", border: "none", borderRadius: 14,
                            padding: "16px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer",
                            boxShadow: "0 6px 20px rgba(37,99,235,0.35)", display: "flex", alignItems: "center", gap: 8
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#2563eb"; }}>
                            Comenzar ahora →
                        </button>
                    </div>

                    {/* Right: card */}
                    <div style={{ position: "relative" }}>
                        <div style={{
                            background: "#fff", borderRadius: 24, padding: 32,
                            boxShadow: "0 8px 40px rgba(0,0,0,0.10)", border: "1.5px solid #e2e8f0"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                                <div style={{ width: 48, height: 48, background: "#2563eb", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🐾</div>
                                <div>
                                    <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 17 }}>KaiVet Manager</div>
                                    <div style={{ color: "#64748b", fontSize: 13 }}>Sistema de gestión veterinaria</div>
                                </div>
                            </div>

                            {[
                                { label: "Clientes registrados", val: "Activos", color: "#2563eb" },
                                { label: "Mascotas atendidas", val: "Actualizadas", color: "#059669" },
                                { label: "Citas del mes", val: "Programadas", color: "#7c3aed" },
                                { label: "Ingresos", val: "Controlados", color: "#ea580c" },
                            ].map((row, i) => (
                                <div key={i} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "12px 16px", background: "#f8fafc", borderRadius: 12, marginBottom: 8
                                }}>
                                    <span style={{ color: "#475569", fontSize: 14, fontWeight: 500 }}>{row.label}</span>
                                    <span style={{ color: row.color, fontSize: 14, fontWeight: 700 }}>{row.val}</span>
                                </div>
                            ))}

                            <div style={{
                                marginTop: 16, padding: "14px 16px", background: "#eff6ff",
                                borderRadius: 14, display: "flex", alignItems: "center", gap: 10
                            }}>
                                <span style={{ fontSize: 18 }}>⭐</span>
                                <span style={{ color: "#1d4ed8", fontWeight: 600, fontSize: 14 }}>Todo centralizado, accesible y seguro</span>
                            </div>
                        </div>

                        {/* Floating badges */}
                        <div style={{
                            position: "absolute", top: -14, right: -14,
                            background: "#10b981", color: "#fff", borderRadius: 999,
                            padding: "6px 14px", fontSize: 13, fontWeight: 800,
                            boxShadow: "0 4px 12px rgba(16,185,129,0.4)"
                        }}>✓ En línea</div>

                        <div style={{
                            position: "absolute", bottom: -14, left: -14,
                            background: "#dbeafe", color: "#1e40af", borderRadius: 999,
                            padding: "6px 14px", fontSize: 13, fontWeight: 700,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "1.5px solid #bfdbfe"
                        }}>Seguro y confiable</div>
                    </div>
                </div>
            </section>

            {/* ─── CTA BANNER ─── */}
            <section style={{
                background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
                padding: "80px 24px", textAlign: "center"
            }}>
                <div style={{ maxWidth: 700, margin: "0 auto" }}>
                    <h2 style={{ color: "#ffffff", fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.2 }}>
                        ¿Listo para organizar tu clínica?
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, lineHeight: 1.7, margin: "0 0 40px" }}>
                        Accede a KaiVet y empieza a gestionar tus pacientes, citas y facturación de forma profesional.
                    </p>
                    <button onClick={onGoToLogin} style={{
                        background: "#fff", color: "#1e3a8a", border: "none", borderRadius: 18,
                        padding: "20px 48px", fontSize: 19, fontWeight: 900, cursor: "pointer",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.25)", transition: "all 0.2s"
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
                        Ingresar a KaiVet →
                    </button>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer id="contact" style={{ background: "#0f172a", padding: "60px 24px 32px" }}>
                <div style={{ maxWidth: 960, margin: "0 auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40, marginBottom: 48 }}>
                        {/* Brand */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 36, height: 36, background: "#2563eb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>
                                <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>Kai<span style={{ color: "#60a5fa" }}>Vet</span></span>
                            </div>
                            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                                Sistema de gestión veterinaria integral. Diseñado para clínicas que se preocupan por la salud de sus pacientes.
                            </p>
                        </div>

                        {/* Modules */}
                        <div>
                            <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Módulos</h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                                {["Gestión de Clientes", "Mascotas e Historial", "Agendamiento de Citas", "Ventas y Facturación", "Gestión de Empleados"].map(m => (
                                    <li key={m} style={{ color: "#94a3b8", fontSize: 14 }}>{m}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Contacto</h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                                {[
                                    { icon: "📧", text: "kaivetmanager@gmail.com" },
                                    { icon: "📞", text: "+57 323 425 9445", href: "https://wa.me/573234259445?text=Hola!%20Me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre%20KaiVet." },
                                    { icon: "📍", text: "Vereda San Esteban - Girardota, Antioquia" },
                                ].map(({ icon, text, href }) => (
                                    <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#94a3b8", fontSize: 14 }}>
                                        <span style={{ fontSize: 16, marginTop: 2 }}>{icon}</span>
                                        {href ? (
                                            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                                                style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s ease" }}
                                                onMouseEnter={e => e.currentTarget.style.color = "#60a5fa"}
                                                onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
                                                {text}
                                            </a>
                                        ) : (
                                            <span style={{ lineHeight: 1.4 }}>{text}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Horario de Atención */}
                        <div>
                            <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Horario de Atención</h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                                <li style={{ color: "#94a3b8", fontSize: 14 }}>
                                    <strong style={{ color: "#e2e8f0" }}>Lunes a Viernes:</strong><br />
                                    8:00 AM - 6:00 PM
                                </li>
                                <li style={{ color: "#94a3b8", fontSize: 14 }}>
                                    <strong style={{ color: "#e2e8f0" }}>Sábados:</strong><br />
                                    9:00 AM - 2:00 PM
                                </li>
                                <li style={{ color: "#94a3b8", fontSize: 14 }}>
                                    <strong style={{ color: "#e2e8f0" }}>Domingos y Festivos:</strong><br />
                                    Cerrado
                                </li>
                            </ul>
                        </div>

                        {/* Location Map */}
                        <div>
                            <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Ubicación</h4>
                            <div style={{
                                width: "100%", height: "160px", borderRadius: "16px", overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                            }}>
                                <iframe
                                    title="Ubicación KaiVet"
                                    src="https://maps.google.com/maps?q=vereda%20san%20esteban%20-%20girardota%20antioquia&t=&z=14&ie=UTF8&iwloc=&output=embed"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: "1px solid #1e293b", paddingTop: 28, textAlign: "center" }}>
                        <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>
                            © 2026 KaiVet Manager — Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Responsive overrides */}
            <style>{`
        @media (max-width: 768px) {
          .landing-desktop-nav { display: none !important; }
          .landing-mobile-menu-btn { display: flex !important; }
          .landing-about-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .landing-mobile-menu-btn { display: none !important; }
        }
      `}</style>
        </div>
    );
}
