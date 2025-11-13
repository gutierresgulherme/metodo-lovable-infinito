import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

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
      window.pixelId = "691640157bdf7ab356c68277";
      var a = document.createElement("script");
      a.setAttribute("async", "");
      a.setAttribute("defer", "");
      a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
      document.head.appendChild(a);
    `;
    document.head.appendChild(script);

    console.log("[UTMIFY] Pixel carregado no App.tsx");
    console.log(
      "%c[UTMIFY DEBUG] Pixel carregado e execução iniciada",
      "color:#00eaff;font-weight:bold;"
    );

    setTimeout(() => {
      console.log(
        "[UTMIFY DEBUG] UTMs capturadas:",
        (window as any).__UTMIFY__?.readPersistedUTMs?.() || {}
      );
      console.log("[UTMIFY DEBUG] PixelId ativo:", (window as any).pixelId);
    }, 1000);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/thankyou" element={<ThankYou />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/utmify-debug" element={<TestUtmify />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
