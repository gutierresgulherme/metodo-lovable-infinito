import { useEffect, useState } from "react";
import {
    listVSLs,
    createVSL,
    updateVSL,
    deleteVSL,
    generateSlug,
    VSLVariant,
    CreateVSLInput,
    listTestCenters,
    createTestCenter,
    updateTestCenter,
    deleteTestCenter,
    VSLTestCenter,
    getVSLMetrics
} from "@/lib/vslService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Plus, FlaskConical, Globe, Trash2,
    RefreshCw, Eye, Rocket, Check, Pause, Play,
    DollarSign, BarChart2, MousePointerClick, Users, Coins,
    Link as LinkIcon,
    Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Components ---

// 1. Metric Box
const MetricBox = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className={cn("p-3 rounded-lg border bg-[#050508]", `border-${color}-500/20`)}>
        <div className="flex items-center gap-2 mb-1">
            <Icon className={cn("w-3 h-3", `text-${color}-400`)} />
            <span className={cn("text-[10px] uppercase font-mono font-bold", `text-${color}-400`)}>{label}</span>
        </div>
        <p className="text-lg font-orbitron text-white">{value}</p>
    </div>
);

// 2. VSL Selection Card (for Modal)
const VSLSelectionCard = ({ vsl, isActive, isSelected, onClick }: { vsl: VSLVariant; isActive: boolean; isSelected: boolean; onClick: () => void }) => (
    <div
        onClick={onClick}
        className={cn(
            "cursor-pointer p-4 rounded-xl border transition-all relative group",
            isSelected ? "bg-blue-500/10 border-blue-500" : "bg-white/5 border-white/10 hover:border-white/30",
            isActive && !isSelected && "border-green-500/50 bg-green-500/5"
        )}
    >
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <h4 className={cn("font-bold font-orbitron text-sm", isSelected ? "text-blue-400" : "text-gray-200")}>
                    {vsl.name}
                </h4>
                <p className="text-xs text-gray-500 font-mono">Slug: /{vsl.slug}</p>
                {vsl.book_reference && (
                    <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400 mt-2">
                        📚 {vsl.book_reference}
                    </Badge>
                )}
            </div>
            <div className="flex flex-col items-end gap-2">
                {isActive && <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-0">EM USO</Badge>}
                {isSelected && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
            </div>
        </div>
    </div>
);

// --- Main Page Component ---

export default function AdminVSLTester() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [testCenters, setTestCenters] = useState<VSLTestCenter[]>([]);
    const [allVSLs, setAllVSLs] = useState<VSLVariant[]>([]);

    // Metrics Cache
    const [metricsCache, setMetricsCache] = useState<Record<string, { sessions: number; clicks: number; ctr: number; revenue: number }>>({});

    // Modals State
    const [createVSLOpen, setCreateVSLOpen] = useState(false);
    const [changeVSLOpen, setChangeVSLOpen] = useState(false);
    const [createDomainOpen, setCreateDomainOpen] = useState(false);

    // Selected items for Modals
    const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
    const [selectedVSLForChange, setSelectedVSLForChange] = useState<string | null>(null);

    // Forms
    const [vslForm, setVslForm] = useState<CreateVSLInput>({
        name: "", slug: "", status: "draft", description: "", is_template: false,
        headline: "", video_url: "", benefits_copy: "", method_explanation_copy: "", pricing_copy: "", guarantee_copy: ""
    });
    const [domainForm, setDomainForm] = useState({ name: "", domain: "", currency: "BRL" });
    const [setupDialogOpen, setSetupDialogOpen] = useState(false);

    // SQL Migration Script for User Copy-Paste
    const MIGRATION_SQL = `
-- 1. Create vsl_variants table
CREATE TABLE IF NOT EXISTS vsl_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  book_reference TEXT,
  headline TEXT,
  hero_subheadline TEXT,
  video_url TEXT,
  benefits_copy TEXT,
  method_explanation_copy TEXT,
  pricing_copy TEXT,
  guarantee_copy TEXT,
  faq_copy JSONB,
  status TEXT DEFAULT 'draft',
  is_control BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create vsl_test_centers table
CREATE TABLE IF NOT EXISTS vsl_test_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  currency TEXT DEFAULT 'BRL',
  bma_name TEXT,
  status TEXT DEFAULT 'active',
  vsl_slug TEXT,
  active_vsl_id UUID REFERENCES vsl_variants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Disable RLS for immediate admin access
ALTER TABLE vsl_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE vsl_test_centers DISABLE ROW LEVEL SECURITY;

-- 4. Add column to tracking tables
ALTER TABLE page_sessions ADD COLUMN IF NOT EXISTS vsl_slug TEXT;
ALTER TABLE button_clicks ADD COLUMN IF NOT EXISTS vsl_slug TEXT;

-- 5. Insert Default Data
INSERT INTO vsl_test_centers (name, domain, currency)
VALUES 
('Brasil Principal', 'metodo-lovable-infinito.vip', 'BRL'),
('USA Principal', 'lovable-app.vip', 'USD')
ON CONFLICT (domain) DO NOTHING;
`;

    // Initial Load
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            // Try to fetch centers first to catch DB errors
            try {
                const centers = await listTestCenters();
                const vsls = await listVSLs();

                setTestCenters(centers);
                setAllVSLs(vsls);

                // Fetch metrics
                const metrics: Record<string, any> = {};
                for (const center of centers) {
                    if (center.active_vsl) {
                        const m = await getVSLMetrics(center.active_vsl.id, center.domain);
                        // Mock revenue calculation (e.g., clicks * Avg Order Value)
                        const ticket = center.currency === 'USD' ? 27 : 13.90;
                        metrics[center.id] = { ...m, revenue: m.clicks * ticket * 0.1 };
                    }
                }
                setMetricsCache(metrics);
            } catch (dbError: any) {
                console.error("Database Error Details:", dbError);
                toast({
                    title: "Erro de Execução no Banco",
                    description: dbError.message || "Tabelas não encontradas ou erro de permissão.",
                    variant: "destructive"
                });
                setSetupDialogOpen(true);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao carregar dados", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleCreateVSL = async () => {
        if (!vslForm.name || !vslForm.slug) return toast({ title: "Nome e Slug são obrigatórios", variant: "destructive" });

        try {
            const res = await createVSL({ ...vslForm });
            if (res) {
                toast({ title: "VSL Criada com sucesso!" });
                setCreateVSLOpen(false);
                refreshData();
                setVslForm({ name: "", slug: "", status: "draft" }); // Reset
            }
        } catch (e) {
            toast({ title: "Erro ao criar VSL", variant: "destructive" });
        }
    };

    const handleCreateDomain = async () => {
        if (!domainForm.name || !domainForm.domain) return;
        try {
            await createTestCenter(domainForm);
            toast({ title: "Domínio adicionado!" });
            setCreateDomainOpen(false);
            refreshData();
        } catch (e: any) {
            console.error("Create Domain Error:", e);
            toast({
                title: "Erro ao adicionar domínio",
                description: e.message || "Verifique se a tabela vsl_test_centers existe.",
                variant: "destructive"
            });
            if (e.message?.includes("relation") || e.message?.includes("does not exist")) {
                setSetupDialogOpen(true);
            }
        }
    };

    const handleChangeActiveVSL = async () => {
        if (!selectedDomainId || !selectedVSLForChange) return;
        try {
            await updateTestCenter(selectedDomainId, { active_vsl_id: selectedVSLForChange });
            toast({ title: "VSL Ativa atualizada no domínio!" });
            setChangeVSLOpen(false);
            refreshData();
        } catch (e) {
            toast({ title: "Erro ao atualizar", variant: "destructive" });
        }
    };

    const toggleDomainStatus = async (center: VSLTestCenter) => {
        const newStatus = center.status === 'active' ? 'paused' : 'active';
        await updateTestCenter(center.id, { status: newStatus });
        refreshData();
        toast({ title: `Domínio ${newStatus === 'active' ? 'Ativado' : 'Pausado'}` });
    };

    const handleDeleteDomain = async (id: string) => {
        if (confirm("Tem certeza que deseja remover este domínio?")) {
            await deleteTestCenter(id);
            refreshData();
        }
    }

    const handleSetAsTemplate = async (id: string) => {
        try {
            // Unset other templates first
            const existing = allVSLs.filter(v => v.is_template);
            for (const v of existing) {
                await updateVSL(v.id, { is_template: false });
            }
            await updateVSL(id, { is_template: true });
            toast({ title: "Template padrão definido!" });
            refreshData();
        } catch (e) {
            toast({ title: "Erro ao definir template", variant: "destructive" });
        }
    };

    const handleDeleteVSL = async (id: string) => {
        if (confirm("Deletar esta VSL permanentemente?")) {
            await deleteVSL(id);
            toast({ title: "VSL removida" });
            refreshData();
        }
    };

    // Helpers
    const formatCurrency = (val: number, currency: string = 'BRL') => {
        return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
            style: 'currency',
            currency: currency
        }).format(val);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-3">
                        <FlaskConical className="w-8 h-8 text-purple-400" />
                        TESTADOR DE VSLs
                    </h1>
                    <p className="text-gray-500 font-mono text-sm tracking-widest uppercase mt-2">
                        GERENCIAMENTO MULTI-DOMÍNIO & COPYWRITING
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 font-mono text-xs" onClick={() => setSetupDialogOpen(true)}>
                        DATABASE SETUP (SQL)
                    </Button>
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 font-mono text-xs" onClick={refreshData}>
                        <RefreshCw className={cn("w-3 h-3 mr-2", loading && "animate-spin")} />
                        ATUALIZAR
                    </Button>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 text-white font-orbitron text-xs tracking-wider"
                        onClick={() => setCreateVSLOpen(true)}
                    >
                        <Plus className="w-3 h-3 mr-2" />
                        NOVA VSL
                    </Button>
                </div>
            </div>

            {/* DOMAINS GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {testCenters.map((center) => {
                    const metrics = metricsCache[center.id];
                    const activeVSL = center.active_vsl;

                    return (
                        <Card key={center.id} className="bg-[#0f0f16] border-white/10 hover:border-purple-500/20 transition-all overflow-hidden relative">
                            {/* Status Stripe */}
                            <div className={cn("absolute top-0 left-0 w-1 h-full", center.status === 'active' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500")} />

                            <CardContent className="p-6 pl-8">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-orbitron text-white font-bold">{center.name}</h3>
                                            <Badge variant="outline" className={cn("text-[10px] uppercase", center.status === 'active' ? "text-green-400 border-green-500/30" : "text-red-400 border-red-500/30")}>
                                                {center.status === 'active' ? 'ONLINE' : 'OFFLINE'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-xs font-mono">
                                            <Globe className="w-3 h-3" />
                                            {center.domain}
                                            <span className="text-white/20">•</span>
                                            <span className="text-yellow-500/80">{center.currency}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5" onClick={() => toggleDomainStatus(center)}>
                                            {center.status === 'active' ? <Pause className="w-4 h-4 text-yellow-500" /> : <Play className="w-4 h-4 text-green-500" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDeleteDomain(center.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Active VSL */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-3 flex items-center gap-2">
                                        <Rocket className="w-3 h-3" /> VSL ATIVA NESTE DOMÍNIO
                                    </h4>

                                    {activeVSL ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-orbitron font-bold text-lg">{activeVSL.name}</p>
                                                {activeVSL.headline && <p className="text-gray-400 text-xs italic mt-1 line-clamp-1">"{activeVSL.headline}"</p>}
                                            </div>
                                            <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-xs font-mono" onClick={() => window.open(`http://${center.domain}/?vsl=${activeVSL.slug}`, '_blank')}>
                                                <Eye className="w-3 h-3 mr-2" /> PREVIEW
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500 text-sm font-mono italic">
                                            Nenhuma VSL selecionada. O domínio usará o template padrão.
                                        </div>
                                    )}

                                    <Button
                                        className="w-full mt-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-orbitron text-xs"
                                        onClick={() => {
                                            setSelectedDomainId(center.id);
                                            setSelectedVSLForChange(center.active_vsl_id || null);
                                            setChangeVSLOpen(true);
                                        }}
                                    >
                                        TROCAR VSL ATIVA
                                    </Button>
                                </div>

                                {/* Metrics */}
                                {metrics ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        <MetricBox label="Sessões" value={metrics.sessions} icon={Users} color="blue" />
                                        <MetricBox label="Cliques" value={metrics.clicks} icon={MousePointerClick} color="purple" />
                                        <MetricBox label="CTR" value={`${metrics.ctr}%`} icon={BarChart2} color="green" />
                                        <MetricBox label="Receita" value={formatCurrency(metrics.revenue, center.currency)} icon={Coins} color="yellow" />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center p-4 border border-dashed border-white/10 rounded-lg">
                                        <p className="text-xs text-gray-500 font-mono">AGUARDANDO DADOS DE TRÁFEGO...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Add Domain Card */}
                <button
                    onClick={() => setCreateDomainOpen(true)}
                    className="group border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all min-h-[300px]"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Globe className="w-8 h-8 text-gray-600 group-hover:text-purple-400" />
                    </div>
                    <p className="font-orbitron text-gray-400 group-hover:text-white">ADICIONAR NOVO DOMÍNIO</p>
                </button>
            </div>

            {/* VSL VARIANTS LIBRARY */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="font-orbitron font-bold text-gray-400 tracking-[0.2em] flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-purple-400" />
                        BIBLIOTECA DE VSLs (VARIANTES)
                    </h2>
                    <span className="text-[10px] font-mono text-gray-600 uppercase">
                        {allVSLs.length} VARIANTES CARREGADAS
                    </span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {allVSLs.map((vsl) => (
                        <Card key={vsl.id} className="min-w-[320px] max-w-[320px] bg-white/5 border-white/5 group hover:border-purple-500/30 transition-all flex flex-col justify-between">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px]",
                                        vsl.is_template ? "text-yellow-400 border-yellow-500/30" : "text-gray-500 border-white/5"
                                    )}>
                                        {vsl.is_template ? "GLOBAL TEMPLATE" : "VARIANTE"}
                                    </Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetAsTemplate(vsl.id)} title="Definir como Padrão Global">
                                            <Zap className={cn("w-3 h-3", vsl.is_template ? "text-yellow-400" : "text-gray-400")} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/50 hover:text-red-400" onClick={() => handleDeleteVSL(vsl.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-orbitron text-lg font-bold text-white group-hover:text-purple-400 transition-colors uppercase truncate">
                                        {vsl.name}
                                    </h3>
                                    <p className="text-[10px] items-center gap-1 font-mono text-gray-500 flex mt-1">
                                        <LinkIcon className="w-3 h-3" /> /{vsl.slug}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-gray-400 uppercase">VIDEO FEED:</p>
                                    <p className="text-xs text-gray-400 truncate font-mono bg-black/30 p-2 rounded border border-white/5">
                                        {vsl.video_url || "SEM VÍDEO CONFIGURADO"}
                                    </p>
                                </div>
                            </CardContent>

                            <div className="p-3 border-t border-white/5 flex gap-2">
                                <Button
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] font-orbitron h-8"
                                    onClick={() => window.open(`/?vsl=${vsl.slug}`, '_blank')}
                                >
                                    <Eye className="w-3 h-3 mr-2" /> TESTAR COPY
                                </Button>
                            </div>
                        </Card>
                    ))}

                    {allVSLs.length === 0 && (
                        <div className="w-full flex items-center justify-center p-12 border border-dashed border-white/5 rounded-xl">
                            <p className="text-gray-600 font-mono text-sm">NENHUMA VSL CRIADA AINDA.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Create VSL Modal */}
            <Dialog open={createVSLOpen} onOpenChange={setCreateVSLOpen}>
                <DialogContent className="bg-[#0f0f16] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-orbitron text-xl text-purple-400">CRIAR NOVA VSL (COPY VARIANTE)</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                        <div className="space-y-4">
                            <h3 className="font-orbitron text-sm text-gray-400 border-b border-white/10 pb-2">DADOS BÁSICOS</h3>
                            <Input
                                placeholder="Nome da Variante (ex: Copy Agressiva - Marçal)"
                                value={vslForm.name}
                                onChange={e => setVslForm({ ...vslForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                                className="bg-[#050508] border-white/10"
                            />
                            <div className="flex gap-2">
                                <span className="flex items-center bg-white/5 border border-white/10 px-3 rounded text-xs text-gray-500 font-mono">/</span>
                                <Input
                                    placeholder="slug-da-url"
                                    value={vslForm.slug}
                                    onChange={e => setVslForm({ ...vslForm, slug: e.target.value })}
                                    className="bg-[#050508] border-white/10 font-mono text-sm"
                                />
                            </div>
                            <Select onValueChange={(val) => setVslForm({ ...vslForm, book_reference: val })}>
                                <SelectTrigger className="bg-[#050508] border-white/10">
                                    <SelectValue placeholder="Selecione um Framework / Livro" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f0f16] border-white/10 text-white">
                                    <SelectItem value="original">Original / Próprio</SelectItem>
                                    <SelectItem value="codigos-milhao">Os Códigos do Milhão (Pablo Marçal)</SelectItem>
                                    <SelectItem value="influence">Influence (Cialdini)</SelectItem>
                                    <SelectItem value="traffic-secrets">Traffic Secrets (Russell Brunson)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="URL do Vídeo (Wistia/Youtube/Vimeo)"
                                value={vslForm.video_url}
                                onChange={e => setVslForm({ ...vslForm, video_url: e.target.value })}
                                className="bg-[#050508] border-white/10"
                            />
                            <div className="flex items-center space-x-2 bg-yellow-500/5 p-3 rounded border border-yellow-500/10">
                                <input
                                    type="checkbox"
                                    id="is_template"
                                    checked={vslForm.is_template}
                                    onChange={e => setVslForm({ ...vslForm, is_template: e.target.checked })}
                                    className="w-4 h-4 bg-black"
                                />
                                <Label htmlFor="is_template" className="text-xs text-yellow-500 font-bold uppercase cursor-pointer">
                                    DEFINIR COMO TEMPLATE GLOBAL (PADRÃO PARA TODOS OS DOMÍNIOS)
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-orbitron text-sm text-gray-400 border-b border-white/10 pb-2">COPYWRITING</h3>
                            <Input
                                placeholder="HEADLINE PRINCIPAL (H1)"
                                value={vslForm.headline}
                                onChange={e => setVslForm({ ...vslForm, headline: e.target.value })}
                                className="bg-[#050508] border-purple-500/30 text-lg font-bold"
                            />
                            <Textarea
                                placeholder="Benefícios (Texto ou Markdown)"
                                value={vslForm.benefits_copy}
                                onChange={e => setVslForm({ ...vslForm, benefits_copy: e.target.value })}
                                className="bg-[#050508] border-white/10 h-20"
                            />
                            <Textarea
                                placeholder="Explicação do Método..."
                                value={vslForm.method_explanation_copy}
                                onChange={e => setVslForm({ ...vslForm, method_explanation_copy: e.target.value })}
                                className="bg-[#050508] border-white/10 h-20"
                            />
                        </div>
                    </div>
                    <Button onClick={handleCreateVSL} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 font-orbitron">
                        SALVAR NOVA VSL
                    </Button>
                </DialogContent>
            </Dialog>

            {/* 2. Change Active VSL Modal */}
            <Dialog open={changeVSLOpen} onOpenChange={setChangeVSLOpen}>
                <DialogContent className="bg-[#0f0f16] border-white/10 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-orbitron text-xl">SELECIONAR VSL ATIVA</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3 mt-4 max-h-[60vh] overflow-y-auto p-1">
                        {allVSLs.map(vsl => (
                            <VSLSelectionCard
                                key={vsl.id}
                                vsl={vsl}
                                isActive={testCenters.find(c => c.id === selectedDomainId)?.active_vsl_id === vsl.id}
                                isSelected={selectedVSLForChange === vsl.id}
                                onClick={() => setSelectedVSLForChange(vsl.id)}
                            />
                        ))}
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button variant="ghost" onClick={() => setChangeVSLOpen(false)}>Cancelar</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 font-orbitron" onClick={handleChangeActiveVSL}>
                            CONFIRMAR TROCA
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 3. Create Domain Modal */}
            <Dialog open={createDomainOpen} onOpenChange={setCreateDomainOpen}>
                <DialogContent className="bg-[#0f0f16] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-orbitron">NOVO DOMÍNIO</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <Input
                            placeholder="Nome (ex: Brasil Principal)"
                            value={domainForm.name}
                            onChange={e => setDomainForm({ ...domainForm, name: e.target.value })}
                            className="bg-[#050508] border-white/10"
                        />
                        <Input
                            placeholder="Domínio (ex: site.com)"
                            value={domainForm.domain}
                            onChange={e => setDomainForm({ ...domainForm, domain: e.target.value })}
                            className="bg-[#050508] border-white/10"
                        />
                        <Select onValueChange={(val) => setDomainForm({ ...domainForm, currency: val })} defaultValue="BRL">
                            <SelectTrigger className="bg-[#050508] border-white/10">
                                <SelectValue placeholder="Moeda" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f0f16] border-white/10 text-white">
                                <SelectItem value="BRL">Real (BRL)</SelectItem>
                                <SelectItem value="USD">Dólar (USD)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 font-orbitron" onClick={handleCreateDomain}>
                            ADICIONAR
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* 4. Database Setup Dialog */}
            <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
                <DialogContent className="bg-[#0f0f16] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-orbitron text-red-400 flex items-center gap-2">
                            ⚠️ CONFIGURAÇÃO DO BANCO DE DADOS NECESSÁRIA
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-gray-400 text-sm">
                            Parece que as tabelas necessárias não existem no seu Supabase.
                            Copie o código SQL abaixo e rode no <strong>SQL Editor</strong> do seu painel Supabase.
                        </p>

                        <div className="relative">
                            <pre className="bg-black/50 p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto border border-white/10">
                                {MIGRATION_SQL}
                            </pre>
                            <Button
                                size="sm"
                                className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                    navigator.clipboard.writeText(MIGRATION_SQL);
                                    toast({ title: "SQL Copiado!", description: "Cole no SQL Editor do Supabase." });
                                }}
                            >
                                COPIAR SQL
                            </Button>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                            <p className="text-yellow-400 text-xs font-bold">INSTRUÇÕES:</p>
                            <ol className="list-decimal list-inside text-gray-400 text-xs mt-2 space-y-1">
                                <li>Acesse o painel do Supabase do seu projeto.</li>
                                <li>Vá até a seção <strong>SQL Editor</strong> no menu lateral.</li>
                                <li>Clique em "New Query".</li>
                                <li>Cole o código acima e clique em <strong>RUN</strong>.</li>
                                <li>Volte aqui e clique no botão abaixo.</li>
                            </ol>
                        </div>

                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 font-orbitron py-6 text-lg"
                            onClick={() => {
                                setSetupDialogOpen(false);
                                refreshData();
                            }}
                        >
                            JÁ EXECUTEI O SQL! REVERIFICAR 🚀
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
