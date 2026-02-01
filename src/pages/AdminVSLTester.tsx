import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    listVSLsWithMetrics,
    createVSL,
    updateVSL,
    deleteVSL,
    generateSlug,
    BOOK_REFERENCES,
    VSLVariantWithMetrics,
    CreateVSLInput,
} from "@/lib/vslService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Plus,
    ArrowLeft,
    FlaskConical,
    Users,
    MousePointerClick,
    TrendingUp,
    Trophy,
    Pause,
    Play,
    Trash2,
    BookOpen,
    RefreshCw,
    Copy,
    ExternalLink,
    Upload,
    FileText,
    ChevronLeft,
    ChevronRight,
    GripHorizontal,
    Video,
    Star,
    Hash,
    Globe,
    Check,
    Rocket,
    Pencil,
    Eye,
    ClipboardCopy,
    Lock,
    X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface estendida
interface VSLVariantExtended extends VSLVariantWithMetrics {
    screenshot_url?: string | null;
    copy_text?: string | null;
    buttonClicks?: Array<{ button_id: string; button_label: string; count: number }>;
    index?: number;
}

// Chave do localStorage para VSL Principal
const PRIMARY_VSL_KEY = "primary_vsl_slug";

const getPrimaryVSLSlug = (): string => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem(PRIMARY_VSL_KEY) || "default";
};

const setPrimaryVSLSlug = (slug: string): void => {
    localStorage.setItem(PRIMARY_VSL_KEY, slug);
};

// Copy da VSL Original (Controle) - NÃO EDITÁVEL
const ORIGINAL_VSL_COPY = `VOCÊ AINDA PAGA PRA USAR O LOVABLE?

Peraí... você tá me dizendo que ainda paga a partir de 20 dólares por mês pra usar a ferramenta que mais está revolucionando o mercado de criação de apps com IA?

Olha, se você não sabe do que eu tô falando, deixa eu te explicar rapidinho:

O Lovable é uma plataforma que permite criar aplicativos, sites e sistemas completos usando apenas comandos de texto. Você descreve o que quer, e a IA constrói pra você.

Mas até agora, você precisava pagar uma mensalidade em dólar pra usar isso...

Até agora.

Porque eu descobri um método que me dá acesso ILIMITADO ao Lovable.

Sem pagar 20 dólares por mês.
Sem limite de uso.
Sem precisar de cartão internacional.

E o melhor: por um valor único de apenas R$13,90.

É isso mesmo. Por menos de 15 reais, você nunca mais vai precisar se preocupar com limite de créditos, assinaturas em dólar, ou qualquer coisa do tipo.

O QUE VOCÊ RECEBE:

✅ Método completo e atualizado
✅ Passo a passo em vídeo
✅ Acesso vitalício
✅ Suporte via comunidade
✅ Atualizações gratuitas

BÔNUS EXCLUSIVOS (Plano Gold):

🎁 Comunidade VIP no Discord
🎁 Templates prontos para usar
🎁 Suporte prioritário
🎁 Lives exclusivas

GARANTIA DE 7 DIAS

Se por qualquer motivo você não gostar, é só pedir seu dinheiro de volta. Simples assim.

Clique no botão abaixo e libere seu acesso agora!`;

// MOCK DATA para demonstração
const MOCK_VSLS: VSLVariantExtended[] = [
    {
        id: "mock-1",
        name: "VSL Original (Controle)",
        slug: "default",
        book_reference: "Original",
        description: ORIGINAL_VSL_COPY,
        headline: "VOCÊ AINDA PAGA PRA USAR O LOVABLE?",
        status: "active",
        is_control: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sessions: 1245,
        clicks: 56,
        ctr: 4.5,
        index: 1,
        buttonClicks: [
            { button_id: "btn-comprar-13-1", button_label: "Plano Prata - Abaixo do Vídeo", count: 23 },
            { button_id: "btn-comprar-24-1", button_label: "Plano Gold - Seção Bônus", count: 18 },
            { button_id: "btn-comprar-24-2", button_label: "Plano Gold - Tabela de Preços", count: 9 },
            { button_id: "btn-comprar-13-2", button_label: "Plano Prata - Tabela de Preços", count: 6 },
        ],
    },
    {
        id: "mock-2",
        name: "VSL Expert Secrets v1",
        slug: "expert-secrets-v1",
        book_reference: "Expert Secrets - Russell Brunson",
        description: "",
        headline: "DESCUBRA O SEGREDO QUE OS GRINGOS USAM",
        status: "active",
        is_control: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sessions: 1180,
        clicks: 72,
        ctr: 6.1,
        index: 2,
        buttonClicks: [
            { button_id: "btn-comprar-13-1", button_label: "Plano Prata - Abaixo do Vídeo", count: 31 },
            { button_id: "btn-comprar-24-1", button_label: "Plano Gold - Seção Bônus", count: 25 },
            { button_id: "btn-comprar-24-2", button_label: "Plano Gold - Tabela de Preços", count: 10 },
            { button_id: "btn-comprar-13-2", button_label: "Plano Prata - Tabela de Preços", count: 6 },
        ],
    },
    {
        id: "mock-3",
        name: "VSL Cashvertising v1",
        slug: "cashvertising-v1",
        book_reference: "Cashvertising - Drew Eric Whitman",
        description: "",
        headline: "PARE DE PERDER DINHEIRO COM ASSINATURAS",
        status: "paused",
        is_control: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sessions: 980,
        clicks: 41,
        ctr: 4.2,
        index: 3,
        buttonClicks: [
            { button_id: "btn-comprar-13-1", button_label: "Plano Prata - Abaixo do Vídeo", count: 18 },
            { button_id: "btn-comprar-24-1", button_label: "Plano Gold - Seção Bônus", count: 12 },
            { button_id: "btn-comprar-24-2", button_label: "Plano Gold - Tabela de Preços", count: 7 },
            { button_id: "btn-comprar-13-2", button_label: "Plano Prata - Tabela de Preços", count: 4 },
        ],
    },
];

export default function AdminVSLTester() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [vsls, setVsls] = useState<VSLVariantExtended[]>(MOCK_VSLS);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedVSL, setSelectedVSL] = useState<VSLVariantExtended | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [copyText, setCopyText] = useState("");
    const [customBookName, setCustomBookName] = useState("");
    const [useCustomBook, setUseCustomBook] = useState(false);
    const [primaryVSL, setPrimaryVSL] = useState<string>(getPrimaryVSLSlug());
    const [formData, setFormData] = useState<CreateVSLInput>({
        name: "",
        slug: "",
        book_reference: "",
        headline: "",
        description: "",
        status: "draft",
    });

    // Carousel state
    const carouselRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [scrollStartX, setScrollStartX] = useState(0);

    const loadVSLs = async () => {
        setLoading(true);
        try {
            const data = await listVSLsWithMetrics();
            if (data.length === 0) {
                setVsls(MOCK_VSLS);
            } else {
                const vslsWithClicks = await Promise.all(
                    data.map(async (vsl, idx) => {
                        const buttonClicks = await fetchButtonClicksForVSL(vsl.id);
                        return { ...vsl, buttonClicks, index: idx + 1 };
                    })
                );
                setVsls(vslsWithClicks as VSLVariantExtended[]);
            }
        } catch (error) {
            setVsls(MOCK_VSLS);
        }
        setLoading(false);
    };

    const fetchButtonClicksForVSL = async (vslId: string) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const db = supabase as any;
            const { data } = await db.from("button_clicks").select("button_id, button_label").eq("vsl_id", vslId);
            if (!data) return [];
            const clicksByButton: Record<string, { label: string; count: number }> = {};
            data.forEach((click: { button_id: string; button_label: string }) => {
                if (!clicksByButton[click.button_id]) {
                    clicksByButton[click.button_id] = { label: click.button_label || click.button_id, count: 0 };
                }
                clicksByButton[click.button_id].count++;
            });
            return Object.entries(clicksByButton).map(([id, info]) => ({ button_id: id, button_label: info.label, count: info.count }));
        } catch (error) {
            return [];
        }
    };

    useEffect(() => {
        loadVSLs();
    }, []);

    const handleNameChange = (name: string) => {
        setFormData({ ...formData, name, slug: generateSlug(name) });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);

        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setCopyText(text);
                const lines = text.split('\n').filter(l => l.trim());
                if (lines.length > 0) {
                    const potentialHeadline = lines.find(l => l.toUpperCase() === l && l.length > 10);
                    if (potentialHeadline) {
                        setFormData(prev => ({ ...prev, headline: potentialHeadline.trim() }));
                    }
                }
                toast({ title: "Documento carregado!", description: `${lines.length} linhas de copy extraídas.` });
            };
            reader.readAsText(file);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.slug) {
            toast({ title: "Erro", description: "Nome e slug são obrigatórios", variant: "destructive" });
            return;
        }

        const bookRef = useCustomBook ? customBookName : formData.book_reference;
        const newIndex = vsls.length + 1;

        const result = await createVSL({
            ...formData,
            book_reference: bookRef,
            description: copyText || formData.description,
        });

        if (result) {
            toast({ title: "VSL Criada!", description: `VSL #${newIndex} "${result.name}" criada.` });
            setDialogOpen(false);
            resetForm();
            loadVSLs();
        } else {
            const mockNew: VSLVariantExtended = {
                id: `mock-${Date.now()}`,
                name: formData.name,
                slug: formData.slug,
                book_reference: bookRef || null,
                description: copyText || null,
                headline: formData.headline || null,
                status: formData.status || "draft",
                is_control: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                sessions: 0,
                clicks: 0,
                ctr: 0,
                index: newIndex,
                buttonClicks: [],
            };
            setVsls(prev => [...prev, mockNew]);
            toast({ title: "VSL Criada!", description: `VSL #${newIndex} adicionada.` });
            setDialogOpen(false);
            resetForm();
        }
    };

    const handleEditSubmit = async () => {
        if (!selectedVSL) return;

        const bookRef = useCustomBook ? customBookName : formData.book_reference;

        if (selectedVSL.id.startsWith("mock-")) {
            setVsls(prev => prev.map(v => v.id === selectedVSL.id ? {
                ...v,
                name: formData.name || v.name,
                slug: formData.slug || v.slug,
                book_reference: bookRef || v.book_reference,
                headline: formData.headline || v.headline,
                description: copyText || v.description,
                status: formData.status || v.status,
            } : v));
            toast({ title: "VSL Atualizada!" });
            setEditDialogOpen(false);
            resetForm();
            return;
        }

        const success = await updateVSL(selectedVSL.id, {
            name: formData.name,
            slug: formData.slug,
            book_reference: bookRef,
            headline: formData.headline,
            description: copyText || formData.description,
            status: formData.status,
        });

        if (success) {
            toast({ title: "VSL Atualizada!" });
            setEditDialogOpen(false);
            resetForm();
            loadVSLs();
        }
    };

    const resetForm = () => {
        setFormData({ name: "", slug: "", book_reference: "", headline: "", description: "", status: "draft" });
        setSelectedFile(null);
        setCopyText("");
        setCustomBookName("");
        setUseCustomBook(false);
        setSelectedVSL(null);
    };

    const openEditDialog = (vsl: VSLVariantExtended) => {
        setSelectedVSL(vsl);
        setFormData({
            name: vsl.name,
            slug: vsl.slug,
            book_reference: vsl.book_reference || "",
            headline: vsl.headline || "",
            description: vsl.description || "",
            status: vsl.status as "draft" | "active",
        });
        setCopyText(vsl.description || "");
        setEditDialogOpen(true);
    };

    const openViewDialog = (vsl: VSLVariantExtended) => {
        setSelectedVSL(vsl);
        setViewDialogOpen(true);
    };

    const openPreviewDialog = (vsl: VSLVariantExtended) => {
        setSelectedVSL(vsl);
        setPreviewDialogOpen(true);
    };

    const copyCopyText = (vsl: VSLVariantExtended) => {
        const text = vsl.description || ORIGINAL_VSL_COPY;
        navigator.clipboard.writeText(text);
        toast({ title: "Copy copiada!", description: "Texto da VSL copiado para a área de transferência." });
    };

    const handleStatusChange = async (id: string, status: "active" | "paused" | "winner") => {
        if (id.startsWith("mock-")) {
            setVsls(prev => prev.map(v => v.id === id ? { ...v, status } : v));
            toast({ title: "Status atualizado!" });
            return;
        }
        const success = await updateVSL(id, { status });
        if (success) {
            toast({ title: "Status atualizado!" });
            loadVSLs();
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
        if (id.startsWith("mock-")) {
            setVsls(prev => prev.filter(v => v.id !== id));
            toast({ title: "VSL excluída!" });
            return;
        }
        const success = await deleteVSL(id);
        if (success) {
            toast({ title: "VSL excluída!" });
            loadVSLs();
        }
    };

    const handleSetPrimary = (slug: string, name: string) => {
        setPrimaryVSLSlug(slug);
        setPrimaryVSL(slug);
        toast({ title: "🚀 VSL Principal Definida!", description: `"${name}" será exibida na página inicial.` });
    };

    const copyLink = (slug: string) => {
        const link = `${window.location.origin}/?vsl=${slug}`;
        navigator.clipboard.writeText(link);
        toast({ title: "Link copiado!" });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
            case "winner": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
            case "paused": return "bg-gray-500/20 text-gray-400 border-gray-500/50";
            default: return "bg-purple-500/20 text-purple-400 border-purple-500/50";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "active": return "Ativo";
            case "winner": return "🏆 Vencedor";
            case "paused": return "Pausado";
            default: return "Rascunho";
        }
    };

    const scrollToIndex = (index: number) => {
        if (!carouselRef.current) return;
        const cardWidth = carouselRef.current.offsetWidth;
        carouselRef.current.scrollTo({ left: index * (cardWidth * 0.85 + 24), behavior: 'smooth' });
        setActiveIndex(index);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        setScrollStartX(carouselRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !carouselRef.current) return;
        e.preventDefault();
        carouselRef.current.scrollLeft = scrollStartX - (e.clientX - dragStartX);
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (carouselRef.current) {
            const cardWidth = carouselRef.current.offsetWidth * 0.85 + 24;
            const nearestIndex = Math.round(carouselRef.current.scrollLeft / cardWidth);
            scrollToIndex(Math.max(0, Math.min(vsls.length - 1, nearestIndex)));
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setDragStartX(e.touches[0].clientX);
        setScrollStartX(carouselRef.current?.scrollLeft || 0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !carouselRef.current) return;
        carouselRef.current.scrollLeft = scrollStartX - (e.touches[0].clientX - dragStartX);
    };

    const winnerVSL = vsls.filter(v => v.status !== "draft" && v.sessions >= 10).sort((a, b) => b.ctr - a.ctr)[0];
    const chartData = vsls.filter(v => v.status !== "draft").map(v => ({ name: `#${v.index}`, CTR: v.ctr }));
    const currentPrimaryVSL = vsls.find(v => v.slug === primaryVSL);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                        <FlaskConical className="w-7 h-7 text-purple-400" />
                        Testador de VSLs
                    </h1>
                    <p className="text-gray-400 text-sm">Arraste para comparar • {vsls.length} VSLs</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={loadVSLs} className="border-gray-700">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova VSL #{vsls.length + 1}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1a1a2e] border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Hash className="w-5 h-5 text-purple-400" />
                                    Criar VSL #{vsls.length + 1}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Documento da Copy</Label>
                                    <div className="mt-2 border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-purple-500 transition-colors cursor-pointer">
                                        <input type="file" accept=".txt,.md,text/plain" onChange={(e) => handleFileChange(e)} className="hidden" id="copy-doc" />
                                        <label htmlFor="copy-doc" className="cursor-pointer">
                                            {selectedFile ? (
                                                <div className="space-y-1">
                                                    <FileText className="w-8 h-8 mx-auto text-purple-400" />
                                                    <p className="text-sm text-purple-400">{selectedFile.name}</p>
                                                    <p className="text-xs text-gray-500">{copyText.split('\n').length} linhas</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <Upload className="w-8 h-8 mx-auto text-gray-500" />
                                                    <p className="text-sm text-gray-400">Upload da copy (.txt ou .md)</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <Label>Nome da VSL</Label>
                                    <Input placeholder="Ex: VSL Expert Secrets v1" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} className="bg-white/5 border-gray-700 mt-1" />
                                </div>
                                <div>
                                    <Label>Slug (URL)</Label>
                                    <Input placeholder="ex: expert-secrets-v1" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="bg-white/5 border-gray-700 mt-1" />
                                </div>
                                <div>
                                    <Label className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Livro de Referência</Label>
                                    <div className="flex items-center gap-2 mt-1 mb-2">
                                        <input type="checkbox" id="custom-book-new" checked={useCustomBook} onChange={(e) => setUseCustomBook(e.target.checked)} className="rounded" />
                                        <label htmlFor="custom-book-new" className="text-sm text-gray-400">Digitar manualmente</label>
                                    </div>
                                    {useCustomBook ? (
                                        <Input placeholder="Nome do livro..." value={customBookName} onChange={(e) => setCustomBookName(e.target.value)} className="bg-white/5 border-gray-700" />
                                    ) : (
                                        <Select value={formData.book_reference} onValueChange={(v) => setFormData({ ...formData, book_reference: v })}>
                                            <SelectTrigger className="bg-white/5 border-gray-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent className="bg-[#1a1a2e] border-gray-700">
                                                {BOOK_REFERENCES.map((book) => (<SelectItem key={book.value} value={book.label}>{book.label}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div>
                                    <Label>Headline Principal</Label>
                                    <Textarea placeholder="Ex: VOCÊ AINDA PAGA PRA USAR O LOVABLE?" value={formData.headline || ""} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} className="bg-white/5 border-gray-700 mt-1 min-h-[60px]" />
                                </div>
                                <div>
                                    <Label>Status Inicial</Label>
                                    <Select value={formData.status} onValueChange={(v: "draft" | "active") => setFormData({ ...formData, status: v })}>
                                        <SelectTrigger className="bg-white/5 border-gray-700 mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-[#1a1a2e] border-gray-700">
                                            <SelectItem value="draft">Rascunho</SelectItem>
                                            <SelectItem value="active">Ativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700">Criar VSL #{vsls.length + 1}</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* SELETOR VSL PRINCIPAL */}
            <div>
                <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/50">
                    <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-cyan-500/20 p-2 rounded-lg"><Globe className="w-6 h-6 text-cyan-400" /></div>
                                <div>
                                    <h3 className="text-white font-semibold">🚀 VSL Principal (Vercel)</h3>
                                    <p className="text-gray-400 text-sm">Esta VSL será exibida na página inicial</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={primaryVSL} onValueChange={(slug) => {
                                    const vsl = vsls.find(v => v.slug === slug);
                                    if (vsl) handleSetPrimary(slug, vsl.name);
                                }}>
                                    <SelectTrigger className="bg-white/10 border-cyan-500/50 min-w-[200px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="bg-[#1a1a2e] border-gray-700">
                                        {vsls.filter(v => v.status === "active" || v.status === "winner").map((vsl) => (
                                            <SelectItem key={vsl.slug} value={vsl.slug}>#{vsl.index} {vsl.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {currentPrimaryVSL && (
                                    <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium">
                                        <Rocket className="w-4 h-4" /> Ver
                                    </a>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Winner Banner */}
            {
                winnerVSL && (
                    <div className="max-w-7xl mx-auto mb-4">
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-3 flex items-center gap-3">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            <div>
                                <p className="text-yellow-400 font-semibold text-sm">🏆 Provável Vencedor: #{winnerVSL.index}</p>
                                <p className="text-white text-sm"><strong>{winnerVSL.name}</strong> — CTR {winnerVSL.ctr}%</p>
                            </div>
                            {winnerVSL.slug !== primaryVSL && (
                                <Button size="sm" onClick={() => handleSetPrimary(winnerVSL.slug, winnerVSL.name)} className="ml-auto bg-yellow-500 hover:bg-yellow-600 text-black">
                                    <Globe className="w-3 h-3 mr-1" /> Definir Principal
                                </Button>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Carousel Navigation */}
            <div className="max-w-7xl mx-auto mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <GripHorizontal className="w-5 h-5 text-cyan-400" /> VSLs em Teste
                </h2>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} className="border-gray-700 h-8 w-8 p-0">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-white font-medium min-w-[60px] text-center">{activeIndex + 1} / {vsls.length}</span>
                    <Button variant="outline" size="sm" onClick={() => scrollToIndex(Math.min(vsls.length - 1, activeIndex + 1))} disabled={activeIndex === vsls.length - 1} className="border-gray-700 h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Carousel */}
            <div className="max-w-7xl mx-auto mb-6 relative">
                <div
                    ref={carouselRef}
                    className="flex gap-6 overflow-x-scroll pb-4 scroll-smooth select-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => handleMouseUp()}
                >
                    {vsls.map((vsl, index) => {
                        const buttonClicks = vsl.buttonClicks || [];
                        const isControl = vsl.is_control;
                        const isPrimary = vsl.slug === primaryVSL;

                        return (
                            <div key={vsl.id} className="flex-shrink-0" style={{ width: '85%', maxWidth: '520px', scrollSnapAlign: 'start' }}>
                                <Card className={`h-full transition-all ${isPrimary ? 'bg-gradient-to-br from-[#0a1a3e] to-[#1a2a4e] border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : isControl ? 'bg-gradient-to-br from-[#1a1a2e] to-[#2a1a3e] border-2 border-yellow-500/50' : 'bg-[#1a1a2e] border-gray-800'}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {isPrimary && <Globe className="w-5 h-5 text-cyan-400" />}
                                                {isControl && !isPrimary && <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                                                <div>
                                                    <CardTitle className="text-base text-white flex items-center gap-2">
                                                        <span className={`text-white text-xs px-2 py-0.5 rounded-full ${isPrimary ? 'bg-cyan-600' : 'bg-purple-600'}`}>#{vsl.index || index + 1}</span>
                                                        {vsl.name}
                                                        {isControl && <Lock className="w-3 h-3 text-yellow-400" />}
                                                    </CardTitle>
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <BookOpen className="w-3 h-3" />
                                                        {vsl.book_reference || "Sem referência"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isPrimary && <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 px-2 py-0.5 rounded-full text-[10px] font-medium">PRINCIPAL</span>}
                                                <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(vsl.status)}`}>{getStatusLabel(vsl.status)}</span>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        {/* Metrics */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-white/5 rounded-lg p-2 text-center">
                                                <Users className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                                                <p className="text-lg font-bold text-white">{vsl.sessions}</p>
                                                <p className="text-[10px] text-gray-500">Sessões</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2 text-center">
                                                <MousePointerClick className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
                                                <p className="text-lg font-bold text-white">{vsl.clicks}</p>
                                                <p className="text-[10px] text-gray-500">Cliques</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2 text-center">
                                                <TrendingUp className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                                                <p className="text-lg font-bold text-white">{vsl.ctr}%</p>
                                                <p className="text-[10px] text-gray-500">CTR</p>
                                            </div>
                                        </div>

                                        {/* Page Map */}
                                        <div className="bg-black/40 rounded-lg p-3 border border-gray-800">
                                            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1">📍 Mapa da Página</h4>
                                            <div className="space-y-1.5 text-[10px]">
                                                <div className="bg-red-600/80 rounded py-1.5 px-2 text-center border border-red-500"><span className="text-white font-medium">🔴 Banner de Urgência</span></div>
                                                <div className="bg-gray-800/60 rounded py-2 px-2 text-center border border-gray-700">
                                                    <p className="text-gray-400">HERO SECTION</p>
                                                    <p className="text-white text-[9px] font-medium truncate mt-0.5">{vsl.headline || "Título + Preço"}</p>
                                                </div>
                                                <div className="bg-gray-800/60 rounded py-2 px-2 text-center border border-gray-700"><Video className="w-4 h-4 mx-auto text-gray-500" /><p className="text-gray-400">VÍDEO VSL</p></div>
                                                <div className="bg-red-500/90 rounded py-1.5 px-2 text-center border-2 border-yellow-500"><p className="text-white font-bold">🔘 QUERO O MÉTODO POR R$13,90</p><p className="text-yellow-300">{buttonClicks.find(b => b.button_id === 'btn-comprar-13-1')?.count || 0} cliques</p></div>
                                                <div className="bg-gray-800/40 rounded py-1 px-2 text-center border border-gray-700"><p className="text-gray-500">O QUE VOCÊ RECEBE</p></div>
                                                <div className="bg-gray-800/40 rounded py-1 px-2 text-center border border-gray-700"><p className="text-gray-500">🎁 BÔNUS EXCLUSIVOS</p></div>
                                                <div className="bg-emerald-500/90 rounded py-1.5 px-2 text-center border-2 border-emerald-300"><p className="text-white font-bold">🔘 MÉTODO + BÔNUS POR R$24,90</p><p className="text-emerald-200">{buttonClicks.find(b => b.button_id === 'btn-comprar-24-1')?.count || 0} cliques</p></div>
                                                <div className="bg-gray-800/40 rounded py-1 px-2 border border-gray-700">
                                                    <p className="text-gray-500 text-center mb-1">ESCOLHA SEU PLANO</p>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        <div className="bg-yellow-600/60 rounded p-1 border border-yellow-500 text-center"><p className="text-yellow-300 font-bold">GOLD</p><p className="text-white">R$24,90</p><p className="text-yellow-200">{buttonClicks.find(b => b.button_id === 'btn-comprar-24-2')?.count || 0} cliques</p></div>
                                                        <div className="bg-gray-600/60 rounded p-1 border border-gray-500 text-center"><p className="text-gray-300 font-bold">PRATA</p><p className="text-white">R$13,90</p><p className="text-gray-300">{buttonClicks.find(b => b.button_id === 'btn-comprar-13-2')?.count || 0} cliques</p></div>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-800/30 rounded py-1 px-2 text-center border border-gray-800"><p className="text-gray-600">GARANTIA + FAQ + FOOTER</p></div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-800">
                                            {/* Editar (apenas VSLs que não são controle) */}
                                            {!isControl && (
                                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(vsl)} className="text-purple-400 hover:text-purple-300 h-7 text-xs">
                                                    <Pencil className="w-3 h-3 mr-1" /> Editar
                                                </Button>
                                            )}

                                            {/* Ver Copy - TODAS as VSLs */}
                                            <Button size="sm" variant="ghost" onClick={() => openViewDialog(vsl)} className="text-yellow-400 hover:text-yellow-300 h-7 text-xs">
                                                <Eye className="w-3 h-3 mr-1" /> Ver Copy
                                            </Button>

                                            {/* Link */}
                                            <Button size="sm" variant="ghost" onClick={() => copyLink(vsl.slug)} className="text-gray-400 hover:text-white h-7 text-xs">
                                                <Copy className="w-3 h-3 mr-1" /> Link
                                            </Button>

                                            {/* Abrir Preview */}
                                            <Button size="sm" variant="ghost" onClick={() => openPreviewDialog(vsl)} className="text-cyan-400 hover:text-cyan-300 h-7 text-xs">
                                                <ExternalLink className="w-3 h-3 mr-1" /> Abrir
                                            </Button>

                                            {/* Status */}
                                            {!isControl && (
                                                <>
                                                    {vsl.status === "active" ? (
                                                        <Button size="sm" variant="ghost" onClick={() => handleStatusChange(vsl.id, "paused")} className="text-gray-400 hover:text-yellow-400 h-7 text-xs">
                                                            <Pause className="w-3 h-3 mr-1" /> Pausar
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="ghost" onClick={() => handleStatusChange(vsl.id, "active")} className="text-gray-400 hover:text-emerald-400 h-7 text-xs">
                                                            <Play className="w-3 h-3 mr-1" /> Ativar
                                                        </Button>
                                                    )}
                                                </>
                                            )}

                                            {/* Delete */}
                                            {!isControl && !isPrimary && (
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(vsl.id, vsl.name)} className="text-gray-400 hover:text-red-400 h-7 text-xs ml-auto">
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
                <p className="text-center text-gray-500 text-xs mt-2 flex items-center justify-center gap-1">
                    <GripHorizontal className="w-3 h-3" /> Clique e arraste para navegar
                </p>
            </div>

            {/* Comparador */}
            {
                chartData.length >= 2 && (
                    <div className="max-w-7xl mx-auto mb-6">
                        <Card className="bg-[#1a1a2e] border-gray-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white text-base flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Comparador A/B — CTR
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 10 }} />
                                            <YAxis stroke="#888" />
                                            <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                                            <Bar dataKey="CTR" fill="#10b981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setEditDialogOpen(open); }}>
                <DialogContent className="bg-[#1a1a2e] border-gray-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-purple-400" />
                            Editar VSL #{selectedVSL?.index}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Atualizar Copy</Label>
                            <div className="mt-2 border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-purple-500 transition-colors cursor-pointer">
                                <input type="file" accept=".txt,.md,text/plain" onChange={(e) => handleFileChange(e, true)} className="hidden" id="copy-doc-edit" />
                                <label htmlFor="copy-doc-edit" className="cursor-pointer">
                                    {selectedFile ? (
                                        <div className="space-y-1">
                                            <FileText className="w-8 h-8 mx-auto text-purple-400" />
                                            <p className="text-sm text-purple-400">{selectedFile.name}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Upload className="w-8 h-8 mx-auto text-gray-500" />
                                            <p className="text-sm text-gray-400">Upload nova copy</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                        <div>
                            <Label>Nome</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-gray-700 mt-1" />
                        </div>
                        <div>
                            <Label>Slug</Label>
                            <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="bg-white/5 border-gray-700 mt-1" />
                        </div>
                        <div>
                            <Label>Livro de Referência</Label>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                                <input type="checkbox" id="custom-book-edit" checked={useCustomBook} onChange={(e) => setUseCustomBook(e.target.checked)} className="rounded" />
                                <label htmlFor="custom-book-edit" className="text-sm text-gray-400">Digitar manualmente</label>
                            </div>
                            {useCustomBook ? (
                                <Input placeholder="Nome do livro..." value={customBookName} onChange={(e) => setCustomBookName(e.target.value)} className="bg-white/5 border-gray-700" />
                            ) : (
                                <Select value={formData.book_reference} onValueChange={(v) => setFormData({ ...formData, book_reference: v })}>
                                    <SelectTrigger className="bg-white/5 border-gray-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="bg-[#1a1a2e] border-gray-700">
                                        {BOOK_REFERENCES.map((book) => (<SelectItem key={book.value} value={book.label}>{book.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div>
                            <Label>Headline</Label>
                            <Textarea value={formData.headline || ""} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} className="bg-white/5 border-gray-700 mt-1" />
                        </div>
                        <Button onClick={handleEditSubmit} className="w-full bg-purple-600 hover:bg-purple-700">Salvar Alterações</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Dialog - TODAS as VSLs */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="bg-[#1a1a2e] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-yellow-400" />
                            #{selectedVSL?.index} {selectedVSL?.name}
                            {selectedVSL?.is_control && <Lock className="w-4 h-4 text-yellow-400" />}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {selectedVSL?.is_control && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-yellow-400" />
                                <p className="text-yellow-300 text-sm">VSL Original - não pode ser editada.</p>
                            </div>
                        )}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Copy Completa</Label>
                                <Button size="sm" variant="outline" onClick={() => copyCopyText(selectedVSL!)} className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                                    <ClipboardCopy className="w-3 h-3 mr-1" /> Copiar Tudo
                                </Button>
                            </div>
                            <div className="bg-black/40 rounded-lg p-4 border border-gray-800 max-h-80 overflow-y-auto">
                                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">
                                    {selectedVSL?.description || (selectedVSL?.is_control ? ORIGINAL_VSL_COPY : "(Nenhuma copy carregada. Use o botão Editar para fazer upload.)")}
                                </pre>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-gray-500 text-xs">Headline</Label>
                                <p className="text-white text-sm">{selectedVSL?.headline || "—"}</p>
                            </div>
                            <div>
                                <Label className="text-gray-500 text-xs">Livro de Referência</Label>
                                <p className="text-white text-sm">{selectedVSL?.book_reference || "—"}</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog - Compacto e Responsivo */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="bg-[#0A0A0F] border-gray-700 text-white p-0 overflow-hidden w-[390px] max-w-[95vw] h-[700px] max-h-[85vh] flex flex-col gap-0">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#1a1a2e] shrink-0">
                        <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium">#{selectedVSL?.index} {selectedVSL?.name?.substring(0, 20)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <a
                                href={`/?vsl=${selectedVSL?.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                            <Button size="sm" variant="ghost" onClick={() => setPreviewDialogOpen(false)} className="h-7 w-7 p-0 hover:bg-gray-700">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <iframe
                        src={`/?vsl=${selectedVSL?.slug}`}
                        className="w-full flex-1 border-0 bg-white"
                        title={`Preview ${selectedVSL?.name}`}
                    />
                </DialogContent>
            </Dialog>

            <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
}
