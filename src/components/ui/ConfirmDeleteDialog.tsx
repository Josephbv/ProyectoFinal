import React from "react";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    description: string;
    loading?: boolean;
}

export function ConfirmDeleteDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    loading = false
}: ConfirmDeleteDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative z-[9999] bg-white rounded-[2.5rem] px-8 py-10 shadow-[0_30px_70px_rgba(0,0,0,0.3)] !w-[320px] animate-in zoom-in-95 duration-300 border border-slate-100">
                <div className="flex flex-col items-center text-center">
                    {/* Icon Section */}
                    <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 border border-red-100">
                        <Trash2 className="w-10 h-10 text-red-600" />
                    </div>

                    {/* Content Section */}
                    <div className="space-y-3 mb-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                            {title}
                        </h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed px-2">
                            {description}
                        </p>
                    </div>

                    {/* Buttons Section */}
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={async (e) => {
                                e.stopPropagation();
                                await onConfirm();
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white h-14 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-red-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                            {loading ? "ELIMINANDO..." : "SÍ, ELIMINAR AHORA"}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-500 h-14 rounded-2xl font-black text-[10px] tracking-widest transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                            NO, VOLVER ATRÁS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
