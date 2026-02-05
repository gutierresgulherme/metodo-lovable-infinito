
import { useEffect, useState } from "react";
import { analyzeVSL, VSLElement } from "@/lib/vslAnalyzer";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";

interface VSLVisualMapProps {
    vslType: 'home' | 'thankyou';
}

export default function VSLVisualMap({ vslType }: VSLVisualMapProps) {
    const [elements, setElements] = useState<VSLElement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        analyze();
    }, [vslType]);

    const analyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyzeVSL(vslType);
            setElements(result.elements);
        } catch (err) {
            console.error("Error analyzing VSL:", err);
            setError("Falha ao analisar a estrutura da página.");
        } finally {
            setLoading(false);
        }
    };

    const getColorClass = (color: string) => {
        switch (color) {
            case 'red': return 'border-red-600 bg-[#4a0404]/30 text-red-200';
            case 'purple': return 'border-purple-600 bg-[#1e0a3c]/30 text-purple-200';
            case 'blue': return 'border-blue-600 bg-[#0a1e3c]/30 text-blue-200';
            case 'green': return 'border-green-600 bg-[#0a3c1e]/30 text-green-200';
            default: return 'border-gray-600 bg-gray-800 text-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-mono uppercase">Analisando estrutura...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 p-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
            </div>
        );
    }

    if (elements.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 border border-dashed border-gray-700 rounded-lg">
                <span className="text-sm">Nenhum elemento identificado nesta página.</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-orbitron text-gray-400 uppercase tracking-wider">
                    📍 MAPA VISUAL DA PÁGINA
                </h3>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500 font-mono">
                    {elements.length} ELEMENTOS
                </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {elements.map((el, index) => (
                    <div
                        key={`${el.type}-${index}`}
                        className={`border-l-4 p-3 rounded-r-md transition-all hover:translate-x-1 ${getColorClass(el.color)}`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide opacity-75">
                                {el.type === 'cta' ? 'BOTÃO DE AÇÃO' : el.type.toUpperCase()}
                            </span>
                            {el.value && (
                                <span className="text-xs font-mono bg-black/30 px-1.5 py-0.5 rounded text-green-400">
                                    R$ {el.value.toFixed(2).replace('.', ',')}
                                </span>
                            )}
                        </div>

                        <div className="mt-1 text-sm font-medium truncate">
                            {el.text}
                        </div>

                        {el.subText && (
                            <div className="text-xs opacity-60 truncate mt-0.5 italic">
                                {el.subText}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
