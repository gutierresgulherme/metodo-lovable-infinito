import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("[LOGIN] Tentativa de login iniciada...");

        // 1. PRIORIDADE MÁXIMA: LOGIN HARDCODED (Para o dono do projeto entrar sempre)
        const masterEmails = ["joaomelloair40@gmail.com", "developerslimitada@gmail.com"];
        const isMasterEmail = masterEmails.some(msg => msg.toLowerCase() === email.toLowerCase());

        if (isMasterEmail && password === "Relogios40@") {
            console.log("[LOGIN] Acesso via modo MESTRE liberado para:", email);
            localStorage.setItem("admin_authenticated", "true");
            toast.success("Bem-vindo de volta, Admin!");
            // Redirecionamento forçado e imediato
            window.location.href = "/admin";
            return;
        }

        try {
            // 2. BUSCA SECUNDÁRIA: Supabase (Para outros usuários se houver)
            console.log("[LOGIN] Tentando Supabase Auth...");
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!error && data?.user) {
                console.log("[LOGIN] Autenticação Supabase OK");
                localStorage.setItem("admin_authenticated", "true");
                toast.success("Acesso concedido via Supabase.");
                window.location.href = "/admin";
                return;
            }

            // Se falhou ambos
            console.warn("[LOGIN] Falha total no acesso.");
            toast.error("Credenciais inválidas. Verifique seu email e senha.");
            setLoading(false);
        } catch (err) {
            console.error("[LOGIN] Erro crítico:", err);
            toast.error("Erro interno. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Mesh Gradient */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] rounded-full bg-purple-900 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900 blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 w-full max-w-md bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-900/20">
                <div className="mb-8 text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Admin Console</h1>
                    <p className="text-gray-400 text-sm">Acesso restrito a pessoal autorizado</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-gray-300 text-xs uppercase tracking-wider font-semibold ml-1">Email</Label>
                        <Input
                            type="email"
                            placeholder="admin@lovable.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500 h-12 transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300 text-xs uppercase tracking-wider font-semibold ml-1">Senha</Label>
                        <Input
                            type="password"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500 h-12 transition-all"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                Acessar Painel <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/" className="text-xs text-gray-500 hover:text-white transition-colors">
                        ← Voltar para o site
                    </Link>
                </div>
            </div>
        </div>
    );
}
