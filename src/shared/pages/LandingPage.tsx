import { Button } from "../../shared/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../shared/components/card";
import { PawIcon } from "../../shared/components/PawIcon";
import {
  ArrowRight,
  CheckCircle,
  Calendar,
  Users,
  ShoppingCart,
  ClipboardList,
  Clock,
  Shield,
  Zap,
  BarChart3,
  Star,
  TrendingUp,
  Heart,
  Award,
  Globe,
  Mail,
  Phone
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Calendar,
      title: "Agendamiento Inteligente",
      description: "Programa citas y gestiona tu calendario de manera eficiente con recordatorios automáticos."
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Base de datos completa de clientes y sus mascotas con historial detallado."
    },
    {
      icon: ShoppingCart,
      title: "Control de Ventas",
      description: "Facturación electrónica y control total de transacciones en tiempo real."
    },
    {
      icon: ClipboardList,
      title: "Historial Médico",
      description: "Registros médicos completos con consultas, tratamientos y seguimientos."
    },
    {
      icon: Clock,
      title: "Gestión de Horarios",
      description: "Administra turnos del personal y optimiza recursos de tu clínica."
    },
    {
      icon: BarChart3,
      title: "Analytics Avanzado",
      description: "Dashboard con métricas en tiempo real y reportes detallados de tu negocio."
    }
  ];

  const modules = [
    { name: "Dashboard", shortcut: "⌘D" },
    { name: "Ventas", shortcut: "⌘V" },
    { name: "Clientes", shortcut: "⌘C" },
    { name: "Agendamiento", shortcut: "⌘A" },
    { name: "Mascotas", shortcut: "⌘M" },
    { name: "Historial Médico", shortcut: "⌘H" },
    { name: "Horarios", shortcut: "⌘O" },
    { name: "Servicios", shortcut: "⌘S" },
    { name: "Usuarios", shortcut: "⌘U" },
    { name: "Roles", shortcut: "⌘R" }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Rápido y Eficiente",
      description: "Interfaz optimizada para operaciones diarias sin complicaciones."
    },
    {
      icon: Shield,
      title: "Seguro y Confiable",
      description: "Tus datos protegidos con encriptación de nivel empresarial."
    },
    {
      icon: TrendingUp,
      title: "Escalable",
      description: "Crece con tu negocio, desde pequeñas clínicas hasta cadenas veterinarias."
    },
    {
      icon: Award,
      title: "Soporte 24/7",
      description: "Equipo de soporte siempre disponible para ayudarte cuando lo necesites."
    }
  ];

  const stats = [
    { value: "10+", label: "Módulos Integrados" },
    { value: "99.9%", label: "Uptime Garantizado" },
    { value: "24/7", label: "Soporte Disponible" },
    { value: "100%", label: "Satisfacción Cliente" }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-200 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-blue-50 rounded-full opacity-25 animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-blue-100 rounded-full opacity-20 animate-pulse delay-1500"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-blue-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <PawIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-900">KaiVet Manager</span>
                <p className="text-xs text-blue-600 font-medium">v1.0.0</p>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 font-semibold"
            >
              Comenzar Ahora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-blue-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                <Star className="w-4 h-4 fill-blue-600 animate-pulse" />
                Gestión Veterinaria de Nueva Generación
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-blue-900 leading-tight">
                El futuro de la
                <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"> gestión veterinaria</span>
              </h1>

              <p className="text-xl text-blue-700 leading-relaxed max-w-2xl">
                Plataforma integral diseñada para clínicas veterinarias modernas.
                Gestiona clientes, mascotas, citas, ventas y más desde un solo lugar con cariño y profesionalismo.
              </p>


              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                    <div className="text-2xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">{stat.value}</div>
                    <div className="text-sm text-blue-600 group-hover:text-blue-500 transition-colors">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Mockup */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                {/* Dashboard Mockup */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <PawIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-semibold">KaiVet Manager</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/30"></div>
                      <div className="w-3 h-3 rounded-full bg-white/30"></div>
                      <div className="w-3 h-3 rounded-full bg-white/30"></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-900 font-medium">Clientes</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">247</div>
                        <div className="text-xs text-blue-600">+12% este mes</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-900 font-medium">Mascotas</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">412</div>
                        <div className="text-xs text-green-600">+18% este mes</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-900 font-medium">Citas Hoy</span>
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white rounded p-2 text-xs text-blue-800">09:00 - Max (Golden Retriever)</div>
                        <div className="bg-white rounded p-2 text-xs text-blue-800">11:30 - Luna (Labrador)</div>
                        <div className="bg-white rounded p-2 text-xs text-blue-800">14:00 - Rocky (Beagle)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50/30 to-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-sm">
              <Heart className="w-4 h-4 fill-blue-600" />
              Características Principales
            </div>
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-blue-600 max-w-3xl mx-auto">
              Potentes características diseñadas específicamente para clínicas veterinarias profesionales con el cariño que merecen tus mascotas peludas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group bg-white/80 backdrop-blur-sm hover:bg-white">
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-blue-900 text-lg group-hover:text-blue-700 transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              10 Módulos Integrados
            </h2>
            <p className="text-xl text-blue-600 max-w-3xl mx-auto">
              Sistema modular completo con atajos de teclado para máxima productividad
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {modules.map((module, index) => (
              <div
                key={index}
                className="bg-white border-2 border-blue-100 rounded-xl p-4 text-center hover:border-blue-400 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="text-blue-900 font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {module.name}
                </div>
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-mono">
                  {module.shortcut}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">
              ¿Por qué elegir KaiVet Manager?
            </h2>
            <p className="text-xl text-blue-600 max-w-3xl mx-auto">
              Potencia profesional con experiencia moderna
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <benefit.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">{benefit.title}</h3>
                <p className="text-blue-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <Heart className="w-4 h-4 fill-white animate-pulse" />
            ¡Comienza tu transformación hoy!
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            ¿Listo para dar lo mejor a tus mascotas peludas?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Únete a las clínicas veterinarias que ya están revolucionando su gestión con KaiVet Manager.
            Tu dedicación merece las mejores herramientas.
          </p>
          <p className="text-blue-200 mt-6 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Sin tarjeta de crédito • Soporte incluido • Actualizaciones gratuitas</span>
          </p>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Datos 100% seguros</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Configuración en minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="text-sm">Premio a la innovación</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <PawIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">KaiVet Manager</span>
                  <p className="text-xs text-blue-300">v1.0.0</p>
                </div>
              </div>
              <p className="text-blue-200 mb-4">
                Plataforma integral de gestión veterinaria diseñada para profesionales que valoran la eficiencia y la excelencia.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-bold mb-4">Producto</h3>
              <ul className="space-y-2 text-blue-200">
                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Módulos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Actualizaciones</a></li>
              </ul>
            </div>

            {/* Soporte */}
            <div>
              <h3 className="font-bold mb-4">Soporte</h3>
              <ul className="space-y-2 text-blue-200">
                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-blue-300 text-sm">
              © 2025 KaiVet Manager. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-blue-300">
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
