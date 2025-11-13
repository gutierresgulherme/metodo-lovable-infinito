import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ThankYou from "./pages/ThankYou";
import Pending from "./pages/Pending";
import TestUtmify from "./pages/TestUtmify";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // -------------------------
  // UTMIFY PIXEL GLOBAL
  // -------------------------
  useEffect(() => {
    const script = document.createElement("script");
    script.innerHTML = `
      window.pixelId = "6915ff46aafbea3d9f52e4b4";
      var a = document.createElement("script");
      a.setAttribute("async", "");
      a.setAttribute("defer", "");
      a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
      document.head.appendChild(a);
    `;
    document.head.appendChild(script);

    console.log("[UTMIFY] Pixel carregado no App.tsx");
    console.log("%c[UTMIFY DEBUG] Pixel carregado e execução iniciada", "color:#00eaff;font-weight:bold;");
    
    // Aguarda um momento para o pixel carregar
    setTimeout(() => {
      console.log("[UTMIFY DEBUG] UTMs capturadas:", (window as any).__UTMIFY__?.readPersistedUTMs?.() || {});
      console.log("[UTMIFY DEBUG] PixelId ativo:", (window as any).pixelId);
    }, 1000);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/thankyou" element={<ThankYou />} />
            <Route path="/test-utmify" element={<TestUtmify />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
