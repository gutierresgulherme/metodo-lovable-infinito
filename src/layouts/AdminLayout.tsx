import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopnav } from "@/components/admin/AdminTopnav";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";

export function AdminLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const isHardcodedAuth = localStorage.getItem("admin_authenticated");

            // Se já tem o flag no localStorage, permite o acesso imediato
            if (isHardcodedAuth === "true") {
                return;
            }

            // Caso contrário, tenta ver se tem uma sessão real no Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log("[ADMIN] Sem autenticação Detectada, redirecionando...");
                navigate("/login");
            }
        };

        checkAuth();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#000000] text-gray-100 font-sans selection:bg-purple-500/30">
            {/* Background Mesh Gradient */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-purple-900 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900 blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* Sidebar */}
            <AdminSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content */}
            <div
                className={cn(
                    "transition-all duration-300 relative z-10",
                    sidebarCollapsed ? "ml-16" : "ml-0 md:ml-64"
                )}
            >
                {/* Topnav */}
                {/* <AdminTopnav />  -- We might redesign Topnav or keep it simple */}

                {/* Page Content */}
                <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
