import { useState, useEffect } from "react";
import { DashboardLayout as Dashboard } from "./features/dashboard/components/DashboardLayout";
import { ClienteLayout } from "./features/dashboard/components/ClienteLayout";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { LandingPage } from "./features/landing/LandingPage";
import { Toaster } from "./shared/components/sonner";

type Screen = "landing" | "login" | "dashboard";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const saved = localStorage.getItem('kaivet_auth_data');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.token && data.usuario) {
            setUserRole(data.usuario.rol || "");
            setScreen("dashboard");
          }
        } catch {
          setScreen("landing");
        }
      } else {
        setScreen("landing");
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
            setUserRole(u?.rol || "");
            setScreen("dashboard");
          }}
          onBackToLanding={() => setScreen("landing")}
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
