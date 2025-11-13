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
  useEffect(() => {
    console.log("[APP] App.tsx carregado — Pixel deve iniciar no index.html");
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
