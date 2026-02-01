import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    BarChart3,
    Video,
    FlaskConical,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    Zap,
    Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPrimaryVSLSlug } from "@/lib/vslService";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin", external: false },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics", external: false },
    { icon: Video, label: "Vídeos", path: "/admin/videos", external: false },
    { icon: FlaskConical, label: "Testador VSLs", path: "/admin/vsl-tester", external: false },
    { icon: Zap, label: "UTMify Debug", path: "/utmify-debug", external: false },
    { icon: Gift, label: "Obrigado", path: "/thankyou", external: true },
];

interface AdminSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
    const location = useLocation();
    const primarySlug = getPrimaryVSLSlug();

    return (
        <aside
            className={cn(
                "h-screen bg-[#0d0d1a] border-r border-gray-800 flex flex-col transition-all duration-300 fixed left-0 top-0 z-40",
                collapsed ? "w-16" : "w-56"
            )}
        >
            {/* Logo */}
            <div className="h-14 flex items-center justify-between px-3 border-b border-gray-800">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">M</span>
                        </div>
                        <span className="font-bold text-white text-sm">Admin</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            {/* Menu */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const linkClass = cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                        isActive
                            ? "bg-purple-600/20 text-purple-400 border-l-2 border-purple-500"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    );

                    if (item.external) {
                        return (
                            <a
                                key={item.path}
                                href={item.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkClass}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-purple-400")} />
                                {!collapsed && (
                                    <>
                                        <span>{item.label}</span>
                                        <ExternalLink className="w-3 h-3 ml-auto text-gray-500" />
                                    </>
                                )}
                            </a>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={linkClass}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-purple-400")} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* VSL Preview Button */}
            <div className="p-2 border-t border-gray-800">
                <a
                    href={`/?vsl=${primarySlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-all text-sm font-medium",
                        collapsed && "justify-center"
                    )}
                >
                    <Eye className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                        <>
                            <span>Ver VSL Ativa</span>
                            <ExternalLink className="w-3 h-3 ml-auto" />
                        </>
                    )}
                </a>
            </div>
        </aside>
    );
}
