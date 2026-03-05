import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "40px", color: "#f8fafc", background: "#0f172a", height: "100vh", fontFamily: "sans-serif" }}>
                    <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>❌ Algo salió mal en el Frontend</h1>
                    <p>La aplicación ha detectado un error crítico. Por favor, reintenta o contacta a soporte.</p>
                    <pre style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", overflow: "auto", marginTop: "20px", color: "#ef4444" }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        style={{
                            marginTop: "20px",
                            padding: "10px 20px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        Limpiar Datos y Recargar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
