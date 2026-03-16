import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/pages/LoginPage";
import { LandingPage } from "./components/pages/LandingPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay una sesión guardada al cargar la app
  useEffect(() => {
    const checkSavedSession = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");

        // Si viene con un enlace de activación o recuperación, forzamos cierre de sesión actual
        // y lo enviamos directo a la pantalla de Login (donde LoginPage atrapará el resto).
        if (mode === "activate" || mode === "reset") {
          localStorage.removeItem("kaivet_auth_data");
          setIsAuthenticated(false);
          setShowLanding(false);
          setIsLoading(false);
          return;
        }

        const savedAuthData = localStorage.getItem("kaivet_auth_data");

        if (savedAuthData) {
          const data = JSON.parse(savedAuthData);
          if (data.token && data.usuario) {
            setIsAuthenticated(true);
            setShowLanding(false);
            toast.success(`¡Bienvenido de vuelta, ${data.usuario.nombre_usuario || 'Usuario'}!`);
          } else {
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Error al verificar sesión guardada:", error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    setTimeout(checkSavedSession, 500);
  }, []);

  const handleLogin = (user?: any) => {
    setIsAuthenticated(true);
    setShowLanding(false);
    // Nota: La persistencia real ya se maneja en useEmailAuth
    // Pero mantenemos este callback si es necesario para otros fines de UI
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLanding(false);

    // Limpiar datos de autenticación
    localStorage.removeItem("kaivet_auth_data");
    toast.info("Sesión cerrada exitosamente");
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  // Mostrar loading inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* Logo animado */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 relative overflow-hidden mx-auto animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
            <div className="w-10 h-10 bg-white rounded-full relative z-10"></div>
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              KaiVet Manager
            </h1>
            <p className="text-blue-200">Cargando...</p>
          </div>

          {/* Spinner */}
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        <Toaster position="bottom-right" theme="dark" richColors />
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        expand={true}
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            color: "#f8fafc",
            backdropFilter: "blur(10px)",
          },
        }}
      />
    </>
  );
}
