import { Package, AlertTriangle, TrendingUp } from "lucide-react";

const insumosData = [
    {
        nombre: "Champú Medicado",
        stock: 3,
        minimo: 10,
        estado: "critico"
    },
    {
        nombre: "Vacunas Antirrábicas",
        stock: 8,
        minimo: 20,
        estado: "bajo"
    },
    {
        nombre: "Guantes Quirúrgicos",
        stock: 45,
        minimo: 50,
        estado: "bajo"
    }
];

export function AlertasInsumos() {
    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case "critico":
                return "text-red-400 bg-red-900/20";
            case "bajo":
                return "text-orange-400 bg-orange-900/20";
            default:
                return "text-blue-400 bg-blue-900/20";
        }
    };

    return (
        <div className="dark-card h-full">
            <div className="pb-6">
                <h3 className="text-xl font-bold text-dark-primary mb-2 flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-400" />
                    Alertas de Insumos
                </h3>
                <p className="text-dark-secondary font-medium">Control de stock y reabastecimiento</p>
            </div>

            <div className="space-y-4">
                {insumosData.map((insumo, index) => (
                    <div key={index} className="p-4 rounded-xl bg-dark-hover border border-dark-color hover:bg-dark-table-hover transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-dark-primary">{insumo.nombre}</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getEstadoColor(insumo.estado)}`}>
                                {insumo.estado}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-dark-secondary">
                                <AlertTriangle className={`w-3 h-3 ${insumo.estado === 'critico' ? 'text-red-400' : 'text-orange-400'}`} />
                                Stock actual: <span className="text-dark-primary font-bold">{insumo.stock}</span>
                            </div>
                            <div className="text-dark-secondary italic">
                                Mín: {insumo.minimo}
                            </div>
                        </div>

                        <div className="mt-3 w-full bg-dark-bg h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${insumo.estado === 'critico' ? 'bg-red-500' : 'bg-orange-500'}`}
                                style={{ width: `${Math.min(100, (insumo.stock / insumo.minimo) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-6 dark-button-secondary flex items-center justify-center gap-2 py-3 text-sm">
                <TrendingUp className="w-4 h-4" />
                Gestionar Inventario
            </button>
        </div>
    );
}
