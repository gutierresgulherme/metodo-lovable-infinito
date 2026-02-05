import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BarChart3,
    Video,
    FlaskConical,
    Gift,
    Zap,
    Eye,
    TrendingUp,
    MousePointer,
    Clock,
    ArrowRight,
    Activity,
    DollarSign,
    RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentVSLInfo, getThankYouMedia, VSLVariant } from "@/lib/vslService";
import { cn } from "@/lib/utils";
import { APP_VERSION, BUILD_DATE } from "@/version";

const db = supabase as any;

interface QuickStats {
    sessions: number;
    clicks: number;
    ctr: number;
    avgWatchTime: number;
}

const quickLinks = [
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { icon: Video, label: "Gestão Mídias", path: "/admin/videos", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },

    { icon: Zap, label: "UTM Debug", path: "/utmify-debug", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { icon: Gift, label: "Página Obrigado", path: "/thankyou", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", external: true },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<QuickStats>({ sessions: 0, clicks: 0, ctr: 0, avgWatchTime: 0 });
    const [activeVsl, setActiveVsl] = useState<VSLVariant | null>(null);
    const [thankYouMedia, setThankYouMedia] = useState<{ videoUrl: string | null, bannerUrl: string | null }>({ videoUrl: null, bannerUrl: null });
    const [loading, setLoading] = useState(true);
    const primarySlug = "home-vsl";

    useEffect(() => {
        loadQuickStats();
    }, []);

    const loadQuickStats = async () => {
        try {
            const [{ vsl }, tyMedia] = await Promise.all([
                getCurrentVSLInfo(),
                getThankYouMedia()
            ]);

            setActiveVsl(vsl);
            setThankYouMedia(tyMedia);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Sessions
            const { count: sessionsCount } = await db
                .from("page_sessions")
                .select("*", { count: "exact", head: true })
                .gte("created_at", sevenDaysAgo.toISOString());

            // Clicks
            const { count: clicksCount } = await db
                .from("button_clicks")
                .select("*", { count: "exact", head: true })
                .gte("created_at", sevenDaysAgo.toISOString());

            const sessions = sessionsCount || 0;
            const clicks = clicksCount || 0;
            const ctr = sessions > 0 ? ((clicks / sessions) * 100) : 0;

            setStats({
                sessions,
                clicks,
                ctr,
                avgWatchTime: 0,
            });
        } catch (error) {
            console.error("Error loading stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        COMANDO CENTRAL
                    </h1>
                    <p className="text-gray-500 font-mono text-sm tracking-wider">
                        SISTEMA OPERACIONAL V2.0 // <span className="text-green-500">ONLINE</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-[10px] font-mono text-gray-500 uppercase">Versão do Sistema</span>
                        <span className="text-xs font-mono text-purple-400 font-bold">v{APP_VERSION}</span>
                    </div>
                    <a href={`/?vsl=${primarySlug}`} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-mono text-xs tracking-wider gap-2">
                            <Eye className="w-4 h-4" />
                            LIVE PREVIEW
                        </Button>
                    </a>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-orbitron text-xs tracking-wider shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all hover:scale-105"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        SINCRONIZAR
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="SESSÕES (7D)"
                    value={loading ? "..." : stats.sessions.toLocaleString()}
                    icon={Eye}
                    trend="+12%"
                    color="cyan"
                />
                <KPICard
                    title="CLIQUES (7D)"
                    value={loading ? "..." : stats.clicks.toLocaleString()}
                    icon={MousePointer}
                    trend="+5.2%"
                    color="purple"
                />
                <KPICard
                    title="CTR GLOBAL"
                    value={loading ? "..." : `${stats.ctr.toFixed(1)}%`}
                    icon={TrendingUp}
                    trend="-2.1%"
                    color="pink"
                />
                <KPICard
                    title="RECEITA EST."
                    value="R$ 12.4K"
                    icon={DollarSign}
                    trend="+8.4%"
                    color="green"
                    isCurrency
                />
            </div>

            {/* Strategic Map - VSL Cards */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-2 border-purple-500 pl-4">
                    <h2 className="text-lg font-orbitron font-bold text-gray-200">MAPA ESTRATÉGICO</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active VSL Card - HOME */}
                    <Card className="bg-[#0f0f16] border-white/5 overflow-hidden group relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardContent className="p-6 space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="font-orbitron text-sm text-gray-400 tracking-widest uppercase">VSL HOME (VENDAS)</h3>
                                <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono font-bold animate-pulse">
                                    ATIVA
                                </span>
                            </div>

                            <div className="aspect-video rounded-lg bg-black/50 border border-white/10 relative overflow-hidden flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
                                {activeVsl?.video_url ? (
                                    <video
                                        src={activeVsl.video_url}
                                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover opacity-20" />
                                )}
                                <Clock className="w-8 h-8 text-purple-500 opacity-50" />
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white font-orbitron font-bold truncate">{activeVsl?.name || "CARREGANDO..."}</p>
                                    <p className="text-gray-500 text-xs font-mono mt-1">SLUG: home_vsl</p>
                                </div>
                                <Link to="/admin/videos">
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-white/10 hover:bg-white/5">
                                        EDITAR MÍDIAS
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active VSL Card - THANK YOU */}
                    <Card className="bg-[#0f0f16] border-white/5 overflow-hidden group relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardContent className="p-6 space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <h3 className="font-orbitron text-sm text-gray-400 tracking-widest uppercase">VSL THANK YOU (OBRIGADO)</h3>
                                <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold animate-pulse">
                                    UPSERLL
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="aspect-video rounded-lg bg-black/50 border border-white/10 relative overflow-hidden flex items-center justify-center group-hover:border-pink-500/30 transition-colors">
                                    {thankYouMedia.videoUrl ? (
                                        <video
                                            src={thankYouMedia.videoUrl}
                                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover opacity-20" />
                                    )}
                                    <Video className="w-6 h-6 text-pink-500 opacity-50" />
                                </div>
                                <div className="aspect-video rounded-lg bg-black/50 border border-white/10 relative overflow-hidden flex items-center justify-center group-hover:border-pink-500/30 transition-colors">
                                    {thankYouMedia.bannerUrl ? (
                                        <img
                                            src={thankYouMedia.bannerUrl}
                                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                                            alt="Banner Preview"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover opacity-20" />
                                    )}
                                    <Gift className="w-6 h-6 text-pink-500 opacity-50" />
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white font-orbitron font-bold">Página de Obrigado</p>
                                    <p className="text-gray-500 text-xs font-mono mt-1">SLUG: thankyou_upsell</p>
                                </div>
                                <Link to="/admin/videos">
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-mono border-white/10 hover:bg-white/5">
                                        EDITAR MÍDIAS
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Actions Sections */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-2 border-cyan-500 pl-4">
                    <h2 className="text-lg font-orbitron font-bold text-gray-200">AÇÕES RÁPIDAS</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickLinks.map((link) => (
                        <Link key={link.path} to={link.path} target={link.external ? "_blank" : undefined}>
                            <Card className={cn(
                                "bg-[#0f0f16] border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 group h-full",
                                "hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                            )}>
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                                        link.bg, link.border, "border"
                                    )}>
                                        <link.icon className={cn("w-6 h-6", link.color)} />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-200 font-orbitron text-sm font-bold group-hover:text-white transition-colors">
                                            {link.label}
                                        </h3>
                                        <p className="text-gray-600 text-[10px] font-mono mt-1 uppercase tracking-wider group-hover:text-gray-400">
                                            Acessar
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, trend, color, isCurrency }: any) {
    const colorMap: Record<string, string> = {
        cyan: "text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
        purple: "text-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.2)]",
        pink: "text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]",
        green: "text-green-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    };

    const isPositive = trend.startsWith("+");

    return (
        <Card className="bg-[#0f0f16] border-white/5 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
            <div className={`absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity ${colorMap[color]}`}>
                <Icon className="w-16 h-16" />
            </div>

            <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">{title}</p>
                    <Icon className={`w-5 h-5 ${colorMap[color].split(' ')[0]}`} />
                </div>

                <div className="space-y-1">
                    <h2 className="text-3xl font-orbitron font-bold text-white tracking-tight">
                        {value}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                            isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        )}>
                            {trend}
                        </span>
                        <span className="text-gray-600 text-[10px] uppercase">vs semana anterior</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
