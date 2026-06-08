import { useState, useEffect } from "react";
import { DashboardLayout as Dashboard } from "./features/dashboard/components/DashboardLayout";
import { ClienteLayout } from "./features/dashboard/components/ClienteLayout";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { LandingPage } from "./features/landing/LandingPage";
import { ForcePasswordChangePage } from "./features/auth/pages/ForcePasswordChangePage";
import { Toaster } from "./shared/components/sonner";

type Screen = "landing" | "login" | "dashboard" | "force-change";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      const activationToken = params.get("token");
      const activationEmail = params.get("email");

      // Si hay un enlace de activación en la URL, tiene prioridad ABSOLUTA.
      // Se limpia la sesión activa para no mezclar cuentas.
      if (mode === "activate" && activationToken && activationEmail) {
        localStorage.removeItem('kaivet_auth_data');
        setScreen("login");
        setIsLoading(false);
        return;
      }

      const saved = localStorage.getItem('kaivet_auth_data');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.token && data.usuario) {
            if (data.mustChangePassword) {
              setScreen("force-change");
            } else {
              // Normalizar rol a string (puede ser objeto o string)
              const rolRaw = data.usuario.rol;
              const rolStr = typeof rolRaw === 'string'
                ? rolRaw
                : (rolRaw as any)?.nombre_rol || (rolRaw as any)?.nombreRol || '';
              setUserRole(rolStr);
              setScreen("dashboard");
            }
          }
        } catch {
          setScreen("landing");
        }
      } else {
        if (params.get("confirmed") === "true" || localStorage.getItem('pending_email_verification')) {
          setScreen("login");
        } else {
          setScreen("landing");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
    window.addEventListener('kaivet-auth-update', checkAuth);
    return () => window.removeEventListener('kaivet-auth-update', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kaivet_auth_data');
    setUserRole(null);
    setScreen("landing");
  };

  const isCliente = userRole?.toLowerCase().includes('cliente');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Cargando KaiVet...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === "landing" && (
        <LandingPage onGoToLogin={() => setScreen("login")} />
      )}
      {screen === "login" && (
        <LoginPage
          onLogin={(u) => {
            const saved = localStorage.getItem('kaivet_auth_data');
            if (saved) {
              const data = JSON.parse(saved);
              if (data.mustChangePassword) {
                setScreen("force-change");
                return;
              }
            }
            setUserRole(u?.rol || "");
            setScreen("dashboard");
          }}
          onBackToLanding={() => setScreen("landing")}
        />
      )}
      {screen === "force-change" && (
        <ForcePasswordChangePage
          onSuccess={() => {
            const saved = localStorage.getItem('kaivet_auth_data');
            if (saved) {
              try {
                const data = JSON.parse(saved);
                delete data.mustChangePassword;
                localStorage.setItem('kaivet_auth_data', JSON.stringify(data));
              } catch (e) {
                console.error("Error al actualizar la contraseña en sesión:", e);
              }
            }
            window.dispatchEvent(new CustomEvent('kaivet-auth-update'));
          }}
          onCancel={handleLogout}
        />
      )}
      {screen === "dashboard" && (
        isCliente ? (
          <ClienteLayout onLogout={handleLogout} />
        ) : (
          <Dashboard onLogout={handleLogout} />
        )
      )}
      <Toaster position="bottom-right" theme="dark" richColors />
    </>
  );
}
