import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    BarChart3,
    Video,
    FlaskConical,
    Zap,
    Gift,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Video, label: "Gestão de Mídias", path: "/admin/videos" },
    { icon: FlaskConical, label: "VSL Tester", path: "/admin/vsl-tester" },
    { icon: Zap, label: "UTM Debug", path: "/utmify-debug" },
    { icon: Gift, label: "Página Obrigado", path: "/thankyou", external: true },
];

interface AdminSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("admin_authenticated");
        window.location.href = "/login";
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col pointer-events-auto",
                "bg-[#0a0a0f] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.4)]",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header / Logo */}
            <div className="h-20 flex items-center px-6 border-b border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center gap-3 relative z-10 w-full overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] shrink-0">
                        <span className="font-orbitron font-bold text-white text-lg">L</span>
                    </div>

                    <div className={cn("transition-all duration-300", collapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
                        <h1 className="font-orbitron font-bold text-white tracking-widest text-lg whitespace-nowrap">LOVABLE<span className="text-cyan-400">∞</span></h1>
                        <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Admin Console</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                {!collapsed && <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Navegação</div>}

                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            target={item.external ? "_blank" : undefined}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-white/5 text-white shadow-[inset_0_0_0_1px_rgba(147,51,234,0.3)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-cyan-500 shadow-[0_0_10px_purple]" />
                            )}

                            <item.icon className={cn(
                                "w-5 h-5 shrink-0 transition-colors duration-300",
                                isActive ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" : "group-hover:text-purple-400"
                            )} />

                            <span className={cn(
                                "whitespace-nowrap font-medium transition-all duration-300",
                                collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                            )}>
                                {item.label}
                            </span>

                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_cyan]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer */}
            <div className="p-4 border-t border-white/5 relative bg-[#050508]">
                <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 border border-white/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className={cn("overflow-hidden transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                        <p className="text-sm font-bold text-white truncate">Admin User</p>
                        <p className="text-xs text-purple-400 truncate flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Super Admin
                        </p>
                    </div>

                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto hover:bg-red-500/10 hover:text-red-400 text-gray-500"
                            onClick={handleLogout}
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0a0a0f] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500 transition-all z-50 shadow-lg"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </div>
        </aside>
    );
}
