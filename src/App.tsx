import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { AdminLayout } from "@/layouts/AdminLayout";

import Index from "./pages/Index";
import ThankYou from "./pages/ThankYou";
import Pending from "./pages/Pending";
import TestUtmify from "./pages/TestUtmify";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVideos from "./pages/AdminVideos";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminVSLTester from "./pages/AdminVSLTester";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    console.log("[APP] App.tsx carregado — Pixel deve iniciar no index.html");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/thankyou" element={<ThankYou />} />
              <Route path="/pending" element={<Pending />} />
              <Route path="/utmify-debug" element={<TestUtmify />} />

              {/* Admin Routes with Layout */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="videos" element={<AdminVideos />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="vsl-tester" element={<AdminVSLTester />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>

          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

