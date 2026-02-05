
import { useEffect, useState } from "react";
import { VSLElement, calculateTicket } from "@/lib/vslAnalyzer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, ExternalLink, Loader2, DollarSign } from "lucide-react";

interface CheckoutLinksManagerProps {
    vslType: 'home' | 'thankyou';
    elements: VSLElement[];
}

interface LinkConfig {
    id?: string;
    button_index: number;
    button_text: string;
    offer_value: number | null;
    checkout_url: string;
}

export default function CheckoutLinksManager({ vslType, elements }: CheckoutLinksManagerProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [links, setLinks] = useState<LinkConfig[]>([]);

    // Filtra apenas os elementos que são botões (CTA)
    const ctaElements = elements.filter(el => el.type === 'cta');

    useEffect(() => {
        if (ctaElements.length > 0) {
            loadSavedLinks();
        }
    }, [vslType, elements]); // Recarrega se a VSL ou elementos mudarem

    const loadSavedLinks = async () => {
        setLoading(true);
        try {
            // Busca links salvos do banco
            const { data, error } = await supabase
                .from('checkout_links')
                .select('*')
                .eq('vsl_type', vslType);

            if (error) throw error;

            // Mescla os dados salvos com os botões detectados na página
            const mergedLinks: LinkConfig[] = ctaElements.map((el, index) => {
                // Tenta achar configuração salva para este botão (pelo índice)
                const saved = data?.find(d => d.button_index === index + 1);

                return {
                    id: saved?.id,
                    button_index: index + 1,
                    button_text: el.text || `Botão ${index + 1}`,
                    offer_value: el.value || null,
                    checkout_url: saved?.checkout_url || ''
                };
            });

            setLinks(mergedLinks);

        } catch (error) {
            console.error("Error loading links:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar links",
                description: "Não foi possível buscar as configurações salvas."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUrlChange = (index: number, newUrl: string) => {
        const newLinks = [...links];
        newLinks[index].checkout_url = newUrl;
        setLinks(newLinks);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Validação simples
            const invalidLinks = links.filter(l => l.checkout_url && !l.checkout_url.startsWith('http'));
            if (invalidLinks.length > 0) {
                toast({
                    variant: "destructive",
                    title: "URL Inválida",
                    description: "Todos os links devem começar com http:// ou https://"
                });
                setSaving(false);
                return;
            }

            // Prepara dados para upsert
            const updates = links.map(link => ({
                vsl_type: vslType,
                button_index: link.button_index,
                button_text: link.button_text,
                offer_value: link.offer_value,
                checkout_url: link.checkout_url
            }));

            // Upsert no Supabase
            // Usamos onConflict: 'vsl_type, button_index' (definido na migration)
            const { error } = await supabase
                .from('checkout_links')
                .upsert(updates, { onConflict: 'vsl_type,button_index' });

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Links de checkout atualizados e salvos.",
                className: "bg-green-500 text-white border-none"
            });

        } catch (error) {
            console.error("Error saving links:", error);
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Falha ao persistir as alterações."
            });
        } finally {
            setSaving(false);
        }
    };

    // Calcula ticket médio baseado nas ofertas detectadas (ou salvas)
    const activeOffers = links.map(l => l.offer_value).filter((v): v is number => v !== null);
    const ticketAverage = calculateTicket(activeOffers);

    if (loading) {
        return <div className="p-4 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
    }

    if (ctaElements.length === 0) {
        return null; // Não mostra nada se não tiver botões
    }

    return (
        <div className="space-y-4 bg-[#0a0a0f] border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-orbitron text-gray-200">LINKS DE CHECKOUT</h3>
            </div>

            <div className="space-y-4">
                {links.map((link, idx) => (
                    <div key={link.button_index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-mono">
                                🟢 BOTÃO {link.button_index}: <span className="text-white">{link.button_text}</span>
                            </span>
                            {link.offer_value && (
                                <span className="text-green-400 font-bold">
                                    R$ {link.offer_value.toFixed(2).replace('.', ',')}
                                </span>
                            )}
                        </div>
                        <Input
                            value={link.checkout_url}
                            onChange={(e) => handleUrlChange(idx, e.target.value)}
                            placeholder="https://exemplo.com/checkout..."
                            className="h-8 text-xs bg-black/40 border-white/10 text-gray-300 focus:border-green-500/50 placeholder:text-gray-700"
                        />
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-white/5 mt-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-xs text-gray-500 font-mono uppercase">Ticket Médio (Est.)</div>
                    <div className="flex items-center gap-1 text-green-400 font-bold font-orbitron">
                        <DollarSign className="w-4 h-4" />
                        {ticketAverage.toFixed(2).replace('.', ',')}
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-mono text-xs h-9"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    SALVAR CONFIGURAÇÕES
                </Button>
            </div>
        </div>
    );
}
