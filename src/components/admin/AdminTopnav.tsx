import { useLocation, Link } from "react-router-dom";
import { Eye, ExternalLink, Bell, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPrimaryVSLSlug } from "@/lib/vslService";

const routeTitles: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/analytics": "Analytics",
    "/admin/videos": "Gerenciar Vídeos",
    "/admin/vsl-tester": "Testador de VSLs",
    "/admin/ofertas": "Ofertas",
    "/admin/usuarios": "Usuários",
    "/admin/config": "Configurações",
};

export function AdminTopnav() {
    const location = useLocation();
    const primarySlug = getPrimaryVSLSlug();
    const pageTitle = routeTitles[location.pathname] || "Admin";

    return (
        <header className="h-14 bg-[#0d0d1a]/95 backdrop-blur border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-30">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link to="/admin" className="text-gray-500 hover:text-gray-300 flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-white font-medium">{pageTitle}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-white relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>

            </div>
        </header>
    );
}
