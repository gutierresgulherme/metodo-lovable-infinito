import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAnalyticsData, AnalyticsData } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import {
    MousePointerClick,
    Eye,
    TrendingUp,
    Users,
    RefreshCw,
    Link2,
    Save,
    Activity,
    Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("7d");
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        const now = new Date();
        let startDate: Date | undefined;

        if (dateRange === "7d") {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === "30d") {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const result = await fetchAnalyticsData(startDate, now);
        setData(result);
        await loadLinks();
        setLoading(false);
    };

    const [links, setLinks] = useState({
        br_prata: "https://go.pepperpay.com.br/lonsw",
        br_gold: "https://go.pepperpay.com.br/ukrg2",
        usa_prata: "https://go.pepperpay.com.br/lonsw",
        usa_gold: "https://go.pepperpay.com.br/ukrg2",
    });
    const [savingLinks, setSavingLinks] = useState(false);

    const loadLinks = async () => {
        const { data } = await (supabase
            .from('checkout_configs' as any) as any)
            .select('*');

        if (data) {
            const linkMap = {
                br_prata: "",
                br_gold: "",
                usa_prata: "",
                usa_gold: "",
            };
            data.forEach((item: any) => {
                if (item.key in linkMap) {
                    linkMap[item.key as keyof typeof linkMap] = item.url;
                }
            });
            setLinks(linkMap);
        }
    };

    const handleSaveLinks = async () => {
        setSavingLinks(true);
        const updates = Object.entries(links).map(([key, url]) => ({
            key,
            url
        }));

        const { error } = await (supabase
            .from('checkout_configs' as any) as any)
            .upsert(updates, { onConflict: 'key' });

        if (error) {
            toast.error("Erro ao salvar links: " + error.message);
        } else {
            toast.success("Links de checkout atualizados com sucesso!");
        }
        setSavingLinks(false);
    };

    useEffect(() => {
        loadData();
    }, [dateRange]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-purple-400 font-orbitron text-sm tracking-widest animate-pulse">CARREGANDO DADOS...</p>
                </div>
            </div>
        );
    }

    const funnelBasePrices = [
        { id: "btn-comprar-13-1", default: 13.90 },
        { id: "btn-comprar-24-1", default: 24.90 },
        { id: "btn-comprar-24-2", default: 24.90 },
        { id: "btn-comprar-13-2", default: 13.90 },
    ];

    const averageFunnelPrice = funnelBasePrices.reduce((acc, curr) => acc + curr.default, 0) / funnelBasePrices.length;

    const buttonChartData = data?.buttonClicks.map((item) => {
        const priceMatch = item.button_label.match(/R\$\s?(\d+[,.]\d+)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : (item.button_id.includes("13") ? 13.90 : 24.90);

        return {
            name: item.button_label.replace("Plano ", "").replace(" - ", "\n"),
            cliques: item.count,
            id: item.button_id,
            faturamento: item.count * price,
            price: price
        };
    }) || [];

    const retentionChartData = data?.videoRetention || [];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                        ANALYTICS AVANÇADO
                    </h1>
                    <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">
                        Inteligência de Dados & Performance
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-[#0f0f16] border border-white/10 p-1 rounded-lg">
                    <FilterButton active={dateRange === "7d"} onClick={() => setDateRange("7d")}>7 DIAS</FilterButton>
                    <FilterButton active={dateRange === "30d"} onClick={() => setDateRange("30d")}>30 DIAS</FilterButton>
                    <FilterButton active={dateRange === "all"} onClick={() => setDateRange("all")}>TOTAL</FilterButton>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={loadData}
                        className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="SESSÕES TOTAIS" value={data?.totalSessions} icon={Users} color="purple" />
                <MetricCard title="CLIQUES TOTAIS" value={data?.totalClicks} icon={MousePointerClick} color="cyan" />
                <MetricCard title="TAXA DE CONV. (CTR)" value={`${data?.ctr}%`} icon={TrendingUp} color="emerald" isPercent />
                <MetricCard title="TOP FONTE (UTM)" value={data?.topUtmSources[0]?.source || "N/A"} icon={Target} color="yellow" truncate />
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Button Clicks Chart */}
                <Card className="bg-[#0f0f16] border-white/5 hover:border-white/10 transition-colors">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-gray-200 font-orbitron text-sm tracking-wider flex items-center gap-2">
                            <MousePointerClick className="w-4 h-4 text-cyan-400" />
                            CLIQUES POR BOTÃO
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={buttonChartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#888"
                                        width={100}
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#0a0a0f",
                                            borderColor: "rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            boxShadow: "0 0 20px rgba(0,0,0,0.5)"
                                        }}
                                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                    />
                                    <Bar dataKey="cliques" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Video Retention Chart */}
                <Card className="bg-[#0f0f16] border-white/5 hover:border-white/10 transition-colors">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-gray-200 font-orbitron text-sm tracking-wider flex items-center gap-2">
                            <Eye className="w-4 h-4 text-purple-400" />
                            RETENÇÃO DO VÍDEO
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={retentionChartData}
                                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis
                                        dataKey="percent"
                                        stroke="#666"
                                        fontSize={10}
                                        tickFormatter={(v) => `${v}%`}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#0a0a0f",
                                            borderColor: "rgba(255,255,255,0.1)",
                                            borderRadius: "8px",
                                            boxShadow: "0 0 20px rgba(0,0,0,0.5)"
                                        }}
                                        formatter={(value: any) => [value, "Visualizações"]}
                                        labelFormatter={(label) => `${label}% Assistido`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sessions"
                                        stroke="#a855f7"
                                        fillOpacity={1}
                                        fill="url(#colorRetention)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mini-Map & Config Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Visual Map */}
                <div className="lg:col-span-2">
                    <Card className="bg-[#0f0f16] border-white/5 h-full">
                        <CardHeader className="border-b border-white/5">
                            <CardTitle className="text-gray-200 font-orbitron text-sm">📍 MAPA VISUAL DA PÁGINA</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="relative bg-[#050508] border border-white/5 rounded-xl p-6 shadow-inner space-y-4">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                                {/* Wireframe Elements */}
                                <div className="border border-red-500/30 bg-red-500/10 rounded h-8 flex items-center justify-center text-[10px] text-red-500 font-mono tracking-widest relative z-10">
                                    SCARCITY BAR
                                </div>
                                <div className="border border-purple-500/30 bg-purple-500/5 rounded h-24 flex items-center justify-center text-[10px] text-purple-500 font-mono tracking-widest relative z-10">
                                    HERO SECTION
                                </div>
                                <div className="border border-gray-700 bg-gray-800/50 rounded h-32 flex items-center justify-center text-[10px] text-gray-400 font-mono tracking-widest relative z-10">
                                    [ VIDEO PLAYER ]
                                </div>
                                <div className="border border-emerald-500/30 bg-emerald-500/10 rounded h-12 flex items-center justify-center text-[10px] text-emerald-500 font-mono font-bold tracking-widest cursor-pointer hover:bg-emerald-500/20 transition-colors relative z-10">
                                    CTA PRI (R$ 13,90) - {buttonChartData.find(b => b.id === "btn-comprar-13-1")?.cliques || 0} clicks
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Checkout Config */}
                <div>
                    <Card className="bg-[#0f0f16] border-white/5 h-full">
                        <CardHeader className="border-b border-white/5">
                            <CardTitle className="text-gray-200 font-orbitron text-sm flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-purple-400" />
                                LINKS DE CHECKOUT
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <CheckoutInput
                                    label="BOTÃO 1: MÉTODO (R$ 13,90)"
                                    color="red"
                                    value={links.br_prata}
                                    onChange={(v) => setLinks({ ...links, br_prata: v })}
                                />
                                <CheckoutInput
                                    label="BOTÃO 2: MÉTODO + BÔNUS (R$ 24,90)"
                                    color="emerald"
                                    value={links.br_gold}
                                    onChange={(v) => setLinks({ ...links, br_gold: v })}
                                />
                                <CheckoutInput
                                    label="BOTÃO 3: PLANO GOLD (R$ 24,90)"
                                    color="yellow"
                                    value={links.usa_gold}
                                    onChange={(v) => setLinks({ ...links, usa_gold: v })}
                                />
                                <CheckoutInput
                                    label="BOTÃO 4: PLANO PRATA (R$ 13,90)"
                                    color="blue"
                                    value={links.usa_prata}
                                    onChange={(v) => setLinks({ ...links, usa_prata: v })}
                                />
                            </div>

                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-orbitron font-bold text-xs tracking-wider h-10 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                                onClick={handleSaveLinks}
                                disabled={savingLinks}
                            >
                                {savingLinks ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                SALVAR CONFIGURAÇÕES
                            </Button>

                            {/* Ticket Médio Stats */}
                            <div className="bg-white/5 rounded-lg p-4 text-center border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ticket Médio (Estimado)</p>
                                <p className="text-2xl font-mono font-bold text-emerald-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageFunnelPrice)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Top UTM Sources Table */}
            <Card className="bg-[#0f0f16] border-white/5">
                <CardHeader className="border-b border-white/5">
                    <CardTitle className="text-gray-200 font-orbitron text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-400" />
                        FONTES DE TRÁFEGO (TOP 5)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-400 font-mono text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-6">#</th>
                                    <th className="py-3 px-6">UTM SOURCE</th>
                                    <th className="py-3 px-6 text-right">SESSÕES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-mono">
                                {data?.topUtmSources.map((utm, index) => (
                                    <tr key={utm.source} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-6 text-gray-500">{index + 1}</td>
                                        <td className="py-3 px-6 text-white">{utm.source}</td>
                                        <td className="py-3 px-6 text-right text-emerald-400">{utm.count}</td>
                                    </tr>
                                ))}
                                {(!data?.topUtmSources || data.topUtmSources.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500 italic">
                                            Nenhum dado registrado para o período.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Sub-components for cleaner code
function FilterButton({ active, children, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded text-[10px] font-mono font-bold tracking-wider transition-all",
                active ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            )}
        >
            {children}
        </button>
    );
}

function MetricCard({ title, value, icon: Icon, color, isPercent, truncate }: any) {
    const colorMap: Record<string, string> = {
        purple: "text-purple-400",
        cyan: "text-cyan-400",
        emerald: "text-emerald-400",
        yellow: "text-yellow-400",
    };

    return (
        <Card className="bg-[#0f0f16] border-white/5 p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">{title}</span>
                <div className={`p-2 rounded bg-white/5 ${colorMap[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div>
                <p className={cn("text-2xl font-orbitron font-bold text-white", truncate && "truncate")}>
                    {value || 0}
                </p>
            </div>
        </Card>
    );
}

function CheckoutInput({ label, color, value, onChange }: any) {
    const colorMap: Record<string, string> = {
        red: "bg-red-500",
        emerald: "bg-emerald-500",
        yellow: "bg-yellow-500",
        blue: "bg-blue-500",
    };

    return (
        <div className="space-y-1.5">
            <Label className="text-gray-400 text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider">
                <div className={`w-1.5 h-1.5 rounded-full ${colorMap[color]}`}></div>
                {label}
            </Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-[#050508] border-white/10 text-xs font-mono text-gray-300 h-9 focus:border-purple-500 transition-colors"
                placeholder="https://..."
            />
        </div>
    );
}
