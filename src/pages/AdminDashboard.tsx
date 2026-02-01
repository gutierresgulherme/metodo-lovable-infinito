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
    ExternalLink,
    ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPrimaryVSLSlug } from "@/lib/vslService";

interface QuickStats {
    sessions: number;
    clicks: number;
    ctr: number;
    avgWatchTime: number;
}

const quickLinks = [
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics", color: "from-blue-500 to-cyan-500" },
    { icon: Video, label: "Vídeos", path: "/admin/videos", color: "from-purple-500 to-pink-500" },
    { icon: FlaskConical, label: "Testador VSLs", path: "/admin/vsl-tester", color: "from-orange-500 to-yellow-500" },
    { icon: Zap, label: "UTMify Debug", path: "/utmify-debug", color: "from-yellow-500 to-red-500" },
    { icon: Gift, label: "Obrigado", path: "/thankyou", color: "from-green-500 to-emerald-500", external: true },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<QuickStats>({ sessions: 0, clicks: 0, ctr: 0, avgWatchTime: 0 });
    const [loading, setLoading] = useState(true);
    const primarySlug = getPrimaryVSLSlug();

    useEffect(() => {
        loadQuickStats();
    }, []);

    const loadQuickStats = async () => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Sessions
            const { count: sessionsCount } = await (supabase as any)
                .from("page_sessions")
                .select("*", { count: "exact", head: true })
                .gte("created_at", sevenDaysAgo.toISOString());

            // Clicks
            const { count: clicksCount } = await (supabase as any)
                .from("button_clicks")
                .select("*", { count: "exact", head: true })
                .gte("clicked_at", sevenDaysAgo.toISOString());

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1">Visão geral do seu projeto</p>
                </div>
                <a href={`/?vsl=${primarySlug}`} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 gap-2">
                        <Eye className="w-4 h-4" />
                        Ver VSL Ativa
                        <ExternalLink className="w-3 h-3" />
                    </Button>
                </a>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide">Sessões (7d)</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {loading ? "..." : stats.sessions.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Eye className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide">Cliques (7d)</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {loading ? "..." : stats.clicks.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <MousePointer className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide">CTR</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {loading ? "..." : `${stats.ctr.toFixed(1)}%`}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide">VSL Ativa</p>
                                <p className="text-lg font-bold text-white mt-1 truncate max-w-[120px]">
                                    {primarySlug || "default"}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Acesso Rápido</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {quickLinks.map((link) => (
                        <Link key={link.path} to={link.path}>
                            <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-600 transition-all hover:scale-[1.02] cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <link.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-white text-sm font-medium">{link.label}</p>
                                    <ArrowRight className="w-4 h-4 text-gray-500 mt-2 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                            Performance Rápida
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">Acesse o módulo <Link to="/admin/analytics" className="text-cyan-400 hover:underline">Analytics</Link> para ver gráficos detalhados</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-purple-400" />
                            Testes A/B Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">Acesse o <Link to="/admin/vsl-tester" className="text-purple-400 hover:underline">Testador de VSLs</Link> para gerenciar variantes</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
