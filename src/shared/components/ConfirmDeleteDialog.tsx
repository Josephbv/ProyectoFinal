import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    description: string;
    loading?: boolean;
    confirmText?: string;
    loadingText?: string;
    variant?: 'danger' | 'warning';
}

export function ConfirmDeleteDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    loading = false,
    confirmText,
    loadingText,
    variant = 'danger'
}: ConfirmDeleteDialogProps) {
    const [countdown, setCountdown] = useState(3);
    const [canConfirm, setCanConfirm] = useState(false);

    const defaultConfirmText = variant === 'danger' ? "Sí, eliminar" : "Sí, cancelar";
    const defaultLoadingText = variant === 'danger' ? "Eliminando..." : "Cancelando...";

    const activeConfirmText = confirmText || defaultConfirmText;
    const activeLoadingText = loadingText || defaultLoadingText;

    useEffect(() => {
        if (!isOpen) {
            setCountdown(3);
            setCanConfirm(false);
            return;
        }
        setCountdown(3);
        setCanConfirm(false);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanConfirm(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const headerGradient = variant === 'danger' 
        ? "bg-gradient-to-br from-red-500 to-rose-600" 
        : "bg-gradient-to-br from-orange-500 to-orange-600";

    const HeaderIcon = variant === 'danger' ? Trash2 : AlertTriangle;

    const confirmButtonStyles = variant === 'danger'
        ? (canConfirm
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 active:scale-95 cursor-pointer'
            : 'bg-red-200 text-red-400 cursor-not-allowed')
        : (canConfirm
            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 active:scale-95 cursor-pointer'
            : 'bg-orange-200 text-orange-400 cursor-not-allowed');

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4">
            {/* Backdrop animado */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-md cursor-pointer transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-[9999] w-full max-w-sm animate-in zoom-in-90 fade-in duration-300">
                <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border ${variant === 'danger' ? 'border-red-100' : 'border-orange-100'}`}>

                    {/* Header rojo/naranja con ícono animado */}
                    <div className={`${headerGradient} p-8 flex flex-col items-center relative`}>
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Ícono con pulso */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                            <div className="relative w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                                <HeaderIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-white mt-4 text-center">{title}</h2>
                        <p className="text-red-100 text-sm text-center mt-1 leading-relaxed">{description}</p>
                    </div>

                    {/* Cuerpo */}
                    <div className="p-6 space-y-4">
                        {/* Aviso */}
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                Esta acción <strong>no se puede deshacer</strong>.
                                {variant === 'danger' ? ' Los datos serán eliminados permanentemente.' : ' El estado de la cita cambiará de forma definitiva.'}
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col gap-2 pt-1">
                            <button
                                type="button"
                                disabled={loading || !canConfirm}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await onConfirm();
                                }}
                                className={`w-full h-12 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${confirmButtonStyles}`}
                            >
                                {loading
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{activeLoadingText}</>
                                    : !canConfirm
                                        ? `Espera ${countdown}s...`
                                        : <><HeaderIcon className="w-4 h-4" />{activeConfirmText}</>
                                }
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="w-full h-12 rounded-2xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-95 cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

