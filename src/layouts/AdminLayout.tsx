import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopnav } from "@/components/admin/AdminTopnav";
import { cn } from "@/lib/utils";

export function AdminLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[#0A0A0F]">
            {/* Sidebar */}
            <AdminSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content */}
            <div
                className={cn(
                    "transition-all duration-300",
                    sidebarCollapsed ? "ml-16" : "ml-56"
                )}
            >
                {/* Topnav */}
                <AdminTopnav />

                {/* Page Content */}
                <main className="p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
