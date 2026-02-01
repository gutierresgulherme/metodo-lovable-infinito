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
    LineChart,
    Line,
    AreaChart,
    Area,
} from "recharts";
import {
    MousePointerClick,
    Eye,
    TrendingUp,
    Users,
    ArrowLeft,
    RefreshCw,
    Calendar,
    FlaskConical,
} from "lucide-react";

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
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [dateRange]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    // Preparar dados para gráfico de botões
    const buttonChartData = data?.buttonClicks.map((item) => ({
        name: item.button_label.replace("Plano ", "").replace(" - ", "\n"),
        cliques: item.count,
        id: item.button_id,
    })) || [];

    // Preparar dados para gráfico de retenção
    const retentionChartData = data?.videoRetention || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        📊 Analytics
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Análise de performance da VSL
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                        <Button
                            size="sm"
                            variant={dateRange === "7d" ? "default" : "ghost"}
                            onClick={() => setDateRange("7d")}
                            className={dateRange === "7d" ? "bg-purple-600" : ""}
                        >
                            7 dias
                        </Button>
                        <Button
                            size="sm"
                            variant={dateRange === "30d" ? "default" : "ghost"}
                            onClick={() => setDateRange("30d")}
                            className={dateRange === "30d" ? "bg-purple-600" : ""}
                        >
                            30 dias
                        </Button>
                        <Button
                            size="sm"
                            variant={dateRange === "all" ? "default" : "ghost"}
                            onClick={() => setDateRange("all")}
                            className={dateRange === "all" ? "bg-purple-600" : ""}
                        >
                            Tudo
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadData}
                        className="border-gray-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border-purple-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Sessões</p>
                                <p className="text-2xl font-bold text-white">
                                    {data?.totalSessions || 0}
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-900/20 border-cyan-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Cliques</p>
                                <p className="text-2xl font-bold text-white">
                                    {data?.totalClicks || 0}
                                </p>
                            </div>
                            <MousePointerClick className="w-8 h-8 text-cyan-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/20 border-emerald-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">CTR</p>
                                <p className="text-2xl font-bold text-white">
                                    {data?.ctr || 0}%
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border-yellow-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Top UTM</p>
                                <p className="text-lg font-bold text-white truncate">
                                    {data?.topUtmSources[0]?.source || "N/A"}
                                </p>
                            </div>
                            <Eye className="w-8 h-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
                {/* Button Clicks Chart */}
                <Card className="bg-[#1a1a2e] border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MousePointerClick className="w-5 h-5 text-cyan-400" />
                            Cliques por Botão
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={buttonChartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis type="number" stroke="#888" />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#888"
                                        width={120}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1a1a2e",
                                            border: "1px solid #333",
                                        }}
                                    />
                                    <Bar dataKey="cliques" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Video Retention Chart */}
                <Card className="bg-[#1a1a2e] border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Eye className="w-5 h-5 text-purple-400" />
                            Retenção do Vídeo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={retentionChartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="percent"
                                        stroke="#888"
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1a1a2e",
                                            border: "1px solid #333",
                                        }}
                                        labelFormatter={(v) => `${v}% do vídeo`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sessions"
                                        stroke="#a855f7"
                                        fill="#a855f7"
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mini-Map da VSL */}
            <div className="max-w-7xl mx-auto mb-8">
                <Card className="bg-[#1a1a2e] border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">📍 Mapa da Página VSL</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Page Layout Visualization */}
                            <div className="flex-1">
                                <div className="bg-[#0f0f1a] rounded-lg p-4 space-y-2 text-xs">
                                    {/* Banner */}
                                    <div className="bg-red-500/20 border border-red-500/50 rounded p-2 text-center">
                                        🔴 Banner de Urgência
                                    </div>

                                    {/* Hero */}
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-center">
                                        <div className="text-gray-400">HERO SECTION</div>
                                        <div className="text-white font-semibold">Título + Preço</div>
                                    </div>

                                    {/* Video */}
                                    <div className="bg-gray-800/50 border border-gray-700 rounded p-4 text-center">
                                        <div className="text-2xl mb-2">🎬</div>
                                        <div className="text-gray-400">VÍDEO VSL</div>
                                    </div>

                                    {/* Button 1 */}
                                    <div
                                        className="bg-red-600 hover:bg-red-700 rounded-full py-2 px-4 text-center text-white font-semibold cursor-pointer transition-all hover:scale-105"
                                        title="btn-comprar-13-1"
                                    >
                                        🔘 QUERO O MÉTODO POR R$13,90
                                        <div className="text-xs opacity-75 mt-1">
                                            {buttonChartData.find(b => b.id === "btn-comprar-13-1")?.cliques || 0} cliques
                                        </div>
                                    </div>

                                    {/* Benefits */}
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-center">
                                        <div className="text-gray-400">O QUE VOCÊ RECEBE</div>
                                    </div>

                                    {/* Bonus Section */}
                                    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded p-3 text-center">
                                        <div className="text-gray-400">🎁 BÔNUS EXCLUSIVOS</div>
                                    </div>

                                    {/* Button 2 */}
                                    <div
                                        className="bg-emerald-600 hover:bg-emerald-700 rounded-full py-2 px-4 text-center text-white font-semibold cursor-pointer transition-all hover:scale-105"
                                        title="btn-comprar-24-1"
                                    >
                                        🔘 QUERO MÉTODO + BÔNUS POR R$24,90
                                        <div className="text-xs opacity-75 mt-1">
                                            {buttonChartData.find(b => b.id === "btn-comprar-24-1")?.cliques || 0} cliques
                                        </div>
                                    </div>

                                    {/* Pricing Cards */}
                                    <div className="bg-gray-800/30 border border-gray-700 rounded p-3">
                                        <div className="text-center text-gray-400 mb-2">ESCOLHA SEU PLANO</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded p-2 text-center">
                                                <div className="font-bold text-yellow-400">GOLD</div>
                                                <div className="text-white">R$24,90</div>
                                                <div
                                                    className="bg-yellow-500 text-black text-xs rounded mt-1 py-1 cursor-pointer hover:bg-yellow-400"
                                                    title="btn-comprar-24-2"
                                                >
                                                    {buttonChartData.find(b => b.id === "btn-comprar-24-2")?.cliques || 0} cliques
                                                </div>
                                            </div>
                                            <div className="bg-gray-500/10 border border-gray-500/50 rounded p-2 text-center">
                                                <div className="font-bold text-gray-400">PRATA</div>
                                                <div className="text-white">R$13,90</div>
                                                <div
                                                    className="bg-gray-500 text-white text-xs rounded mt-1 py-1 cursor-pointer hover:bg-gray-400"
                                                    title="btn-comprar-13-2"
                                                >
                                                    {buttonChartData.find(b => b.id === "btn-comprar-13-2")?.cliques || 0} cliques
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guarantee + FAQ */}
                                    <div className="bg-gray-800/30 border border-gray-700 rounded p-2 text-center text-gray-400">
                                        GARANTIA + FAQ + FOOTER
                                    </div>
                                </div>
                            </div>

                            {/* Button Stats */}
                            <div className="md:w-72">
                                <h3 className="text-white font-semibold mb-4">Detalhes dos Botões</h3>
                                <div className="space-y-3">
                                    {buttonChartData.map((button) => (
                                        <div
                                            key={button.id}
                                            className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-gray-300 text-sm">
                                                    {button.name}
                                                </span>
                                                <span className="text-cyan-400 font-bold">
                                                    {button.cliques}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">{button.id}</div>
                                        </div>
                                    ))}
                                    {buttonChartData.length === 0 && (
                                        <div className="text-gray-500 text-sm text-center py-4">
                                            Nenhum clique registrado ainda
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* UTM Sources Table */}
            <div className="max-w-7xl mx-auto">
                <Card className="bg-[#1a1a2e] border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Top Fontes de Tráfego (UTM Source)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left text-gray-400 py-2 px-4">#</th>
                                        <th className="text-left text-gray-400 py-2 px-4">Fonte</th>
                                        <th className="text-right text-gray-400 py-2 px-4">Sessões</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.topUtmSources.map((utm, index) => (
                                        <tr key={utm.source} className="border-b border-gray-800">
                                            <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                                            <td className="py-3 px-4 text-white">{utm.source}</td>
                                            <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                                                {utm.count}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.topUtmSources || data.topUtmSources.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-500">
                                                Nenhuma fonte UTM registrada ainda
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="max-w-7xl mx-auto mt-8 text-center text-gray-500 text-sm">
                <p>
                    Dashboard Admin — VSL Método Lovable Infinito
                </p>
                <p className="mt-1">
                    🌐 VSL: <code className="text-cyan-400">localhost:8080</code> |
                    📊 Dashboard: <code className="text-purple-400">localhost:8080/admin/analytics</code>
                </p>
            </div>
        </div>
    );
}
