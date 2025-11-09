import { PricingCard } from "@/components/PricingCard";
import { FAQItem } from "@/components/FAQItem";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import lovableInfinitoTitle from "@/assets/lovable-infinito-title.png";
import feedback1 from "@/assets/feedback-1.png";
import feedback2 from "@/assets/feedback-2.png";
import feedback3 from "@/assets/feedback-3.png";
import chatgptBonus from "@/assets/chatgpt-bonus.png";
import canvaBonus from "@/assets/canva-bonus.png";
import garantia7dias from "@/assets/garantia-7dias.png";

const Index = () => {
  useEffect(() => {
    // Track viewContent quando a página carregar
    const trackViewContent = () => {
      const utms = (window as any).__UTMIFY__?.readPersistedUTMs() || {};
      if ((window as any).Utmify && typeof (window as any).Utmify.track === 'function') {
        (window as any).Utmify.track('viewContent', { utms });
        console.log('[UTMIFY] viewContent (SDK)', utms);
      } else {
        console.log('[UTMIFY] viewContent (fallback)', utms);
      }
    };

    // Aguardar o pixel carregar
    if (document.readyState === 'complete') {
      trackViewContent();
    } else {
      window.addEventListener('load', trackViewContent);
      return () => window.removeEventListener('load', trackViewContent);
    }
  }, []);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-[hsl(240,10%,3.9%)] via-[hsl(267,50%,10%)] to-[hsl(190,50%,10%)] text-foreground relative">
      {/* Top Banner */}
      <div className="bg-[hsl(0,100%,50%)] py-2 text-center sticky top-0 z-50 shadow-[0_8px_30px_rgba(255,0,0,0.5)] animate-pulse-glow">
        <p className="text-white font-bold text-xs md:text-sm">
          🎯 DESCONTO VÁLIDO SOMENTE HOJE — {getCurrentDate()}
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 px-6 md:px-4 overflow-hidden z-0">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4 mb-8">
          <img src={lovableInfinitoTitle} alt="Lovable Infinito" className="w-[60%] md:w-[75%] max-w-[340px] md:max-w-[450px] mx-auto rounded-xl shadow-[0_0_18px_rgba(255,255,255,0.15)] animate-pulse-glow" style={{
          filter: 'contrast(1.05) saturate(1.1)'
        }} />
          <h2 className="text-2xl md:text-4xl font-bold text-[hsl(267,100%,65%)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            VOCÊ AINDA PAGA PRA USAR O LOVABLE?
          </h2>
          <p className="text-base md:text-2xl text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            até quando você vai continuar
          </p>
          <p className="text-lg md:text-3xl font-bold text-foreground uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            ESPERANDO VIRAR O DIA PARA CONTINUAR SEU PROJETO…
          </p>
          <p className="text-base md:text-2xl text-[hsl(var(--neon-gold))] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Tenha acesso ao Método Lovable Ilimitado
          </p>
          <div className="space-y-2">
            <p className="text-lg md:text-2xl text-[#ff2d2d] line-through font-semibold">
              De: R$49,90
            </p>
            <p className="text-2xl md:text-5xl font-black drop-shadow-[0_0_15px_rgba(0,255,115,0.6)]">
              Por apenas <span className="text-[#00ff73]">R$13,90</span>
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-4 mt-4 relative z-10 pointer-events-auto">
            <button 
              id="btn-comprar-13"
              onClick={async () => {
                try {
                  const utms = (window as any).__UTMIFY__?.readPersistedUTMs() || {};
                  
                  // Track initiateCheckout
                  if ((window as any).Utmify?.track) {
                    (window as any).Utmify.track('initiateCheckout', { 
                      productName: 'Método Lovable Ilimitado', 
                      price: 13.90, 
                      utms 
                    });
                  } else {
                    await supabase.functions.invoke('init-fallback', {
                      body: { productName: 'Método Lovable Ilimitado', price: 13.90, utms }
                    });
                  }

                  const { data, error } = await supabase.functions.invoke('create-checkout', {
                    body: { 
                      plan: 'Método Lovable Ilimitado', 
                      price: 13.90,
                      utms 
                    }
                  });
                  if (error) throw error;
                  if (data?.checkout_url) {
                    const finalUrl = (window as any).__UTMIFY__?.withUTMs(data.checkout_url, utms) || data.checkout_url;
                    window.location.href = finalUrl;
                  }
                } catch (err) {
                  console.error('Erro ao criar checkout:', err);
                }
              }}
              className="block w-full max-w-[360px] mx-auto rounded-full px-6 py-3 text-base sm:text-lg font-semibold text-white text-center leading-snug whitespace-normal break-words bg-red-600 hover:bg-red-700 shadow-md active:scale-[0.99] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 cursor-pointer"
            >
              QUERO O MÉTODO LOVABLE ILIMITADO POR R$13,90
            </button>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30 mt-6 relative z-0">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            ASSISTA AO VÍDEO DA OFERTA
          </h2>
          <div style={{ position: 'relative', width: '100%', maxWidth: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <iframe 
              width="100%" 
              height="360"
              src="https://www.youtube.com/embed/9lW79rbjyjk?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0"
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen>
            </iframe>
          </div>
        </div>
      </section>

      {/* What You'll Receive Section */}
      <section className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            O QUE VOU RECEBER:
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {["Acesso ILIMITADO ao Lovable", "Criar SITES E APLICATIVOS ilimitadas com IA", "Sem bloqueio, sem limite, sem trava", "Método testado e aprovado pelos GRINGOS", "Suporte se tiver qualquer dúvida", "Chegou o fim da palhaçada"].map((feature, index) => <div key={index} className="flex items-start gap-3 bg-black/40 p-4 md:p-5 rounded-lg border border-[hsl(267,100%,65%,0.3)] hover:border-[hsl(267,100%,65%)] transition-colors">
                <Check className="w-5 md:w-6 h-5 md:h-6 text-[hsl(94,100%,73%)] shrink-0 mt-1" />
                <span className="text-base md:text-lg text-foreground font-medium">{feature}</span>
              </div>)}
          </div>
          
          <div className="bg-gradient-to-br from-[hsl(267,100%,65%,0.1)] to-[hsl(190,100%,50%,0.1)] p-6 md:p-8 rounded-xl border border-[hsl(267,100%,65%,0.3)] mb-8">
            <p className="text-base md:text-lg mb-4 text-foreground">
              A gente descobriu uma brecha limpa no sistema do Lovable.
            </p>
            <p className="text-base md:text-lg text-foreground">
              E agora você pode ter acesso completo, vitalício, sem limite de páginas, sem pagar NADA todo mês.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-center mb-8">
            <div className="bg-black/40 p-4 md:p-6 rounded-lg border border-[hsl(190,100%,50%)] shadow-[0_0_20px_hsl(190,100%,50%/0.3)]">
              <p className="text-base md:text-lg font-bold text-[hsl(190,100%,50%)]">📌 Não precisa cartão internacional</p>
            </div>
            <div className="bg-black/40 p-4 md:p-6 rounded-lg border border-[hsl(190,100%,50%)] shadow-[0_0_20px_hsl(190,100%,50%/0.3)]">
              <p className="text-base md:text-lg font-bold text-[hsl(190,100%,50%)]">📌 Não é pirataria</p>
            </div>
            <div className="bg-black/40 p-4 md:p-6 rounded-lg border border-[hsl(190,100%,50%)] shadow-[0_0_20px_hsl(190,100%,50%/0.3)]">
              <p className="text-base md:text-lg font-bold text-[hsl(190,100%,50%)]">📌 Funciona AGORA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bonus Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Por apenas <span className="text-[#00ff73] font-black">R$24,90</span> receba o Método Lovable Infinito<br className="hidden md:block" />e de BRINDE VÃO MAIS 2 BÔNUS EXCLUSIVOS…
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
            <div className="bg-black/50 p-6 md:p-8 rounded-xl border-2 border-[hsl(267,100%,65%)] hover:border-[hsl(267,100%,75%)] transition-colors shadow-[0_0_30px_hsl(267,100%,65%/0.3)]">
              <div className="w-24 md:w-32 h-24 md:h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                <img src={chatgptBonus} alt="ChatGPT 5 Plus" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">ChatGPT 5 Plus</h3>
            </div>
            <div className="bg-black/50 p-6 md:p-8 rounded-xl border-2 border-[hsl(190,100%,50%)] hover:border-[hsl(190,100%,60%)] transition-colors shadow-[0_0_30px_hsl(190,100%,50%/0.3)]">
              <div className="w-24 md:w-32 h-24 md:h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                <img src={canvaBonus} alt="Canva PRO" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">Canva PRO</h3>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[hsl(45,100%,60%)] to-[hsl(36,100%,50%)] p-1 md:p-2 rounded-xl shadow-[0_0_40px_hsl(45,100%,60%/0.5)] mb-8 animate-pulse-glow">
            <div className="bg-[hsl(240,10%,8%)] p-6 md:p-8 rounded-lg">
              <div className="inline-block bg-gradient-to-r from-[hsl(45,100%,60%)] to-[hsl(36,100%,50%)] text-black px-4 py-2 rounded-full font-bold mb-4 text-sm md:text-base">
                🎁 BÔNUS EXCLUSIVO
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Aula Bônus: Como remover a marca d'água do Lovable
              </h3>
              <p className="text-muted-foreground">(Grátis)</p>
            </div>
          </div>

          <div className="relative z-10 pointer-events-auto">
            <button 
              id="btn-comprar-24"
              onClick={async () => {
                try {
                  const utms = (window as any).__UTMIFY__?.readPersistedUTMs() || {};
                  
                  // Track initiateCheckout
                  if ((window as any).Utmify?.track) {
                    (window as any).Utmify.track('initiateCheckout', { 
                      productName: 'Método + 2 Bônus e Aula Exclusiva', 
                      price: 24.90, 
                      utms 
                    });
                  } else {
                    await supabase.functions.invoke('init-fallback', {
                      body: { productName: 'Método + 2 Bônus e Aula Exclusiva', price: 24.90, utms }
                    });
                  }

                  const { data, error } = await supabase.functions.invoke('create-checkout', {
                    body: { 
                      plan: 'Método + 2 Bônus e Aula Exclusiva', 
                      price: 24.90,
                      utms 
                    }
                  });
                  if (error) throw error;
                  if (data?.checkout_url) {
                    const finalUrl = (window as any).__UTMIFY__?.withUTMs(data.checkout_url, utms) || data.checkout_url;
                    window.location.href = finalUrl;
                  }
                } catch (err) {
                  console.error('Erro ao criar checkout:', err);
                }
              }}
              className="block w-full max-w-[360px] mx-auto rounded-full px-6 py-3 text-base sm:text-lg font-semibold text-white text-center leading-snug whitespace-normal break-words bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-[0.99] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 cursor-pointer"
            >
              QUERO O MÉTODO + 2 BÔNUS E AULA EXCLUSIVA POR R$24,90
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            FEEDBACK DA GALERA QUE COMPROU:
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[feedback1, feedback2, feedback3].map((imageUrl, index) => <div key={index} className="overflow-hidden rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-105">
                <img src={imageUrl} alt={`Feedback ${index + 1}`} className="w-full h-full object-cover max-h-[360px] md:max-h-[360px]" style={{
              maxHeight: "280px"
            }} loading="eager" />
              </div>)}
          </div>
        </div>
      </section>

      {/* Decision Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            SÓ EXISTEM 2 TIPOS DE PESSOAS AQUI:
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-12">
            <div className="bg-gradient-to-br from-[hsl(190,100%,50%,0.2)] to-[hsl(267,100%,65%,0.2)] p-4 md:p-6 rounded-xl border-2 border-[hsl(190,100%,50%)]">
              <p className="text-base md:text-lg text-foreground">
                ✅ As que pegam agora esse método e desbloqueiam o Lovable de forma ilimitada
              </p>
            </div>
            <div className="bg-muted/10 p-4 md:p-6 rounded-xl border-2 border-muted">
              <p className="text-base md:text-lg text-muted-foreground">
                ❌ As que vão continuar presas no plano gratuito, empacadas nos projetos sem poder testar logo
              </p>
            </div>
          </div>

          <div className="bg-black/50 p-6 md:p-8 rounded-xl border-2 border-[hsl(267,100%,65%,0.3)]">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-center text-foreground">
              SE FOSSE PAGAR O PREÇO REAL POR TUDO ISSO…
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-base md:text-lg text-foreground">💰 <span className="text-[hsl(0,100%,59%)]">US$20</span> por mês só pra ter acesso ao Lovable</p>
              <p className="text-base md:text-lg text-foreground">💰 <span className="text-[hsl(0,100%,59%)]">US$15</span> mensais pra usar o Gamma PRO sem limitações</p>
              <p className="text-base md:text-lg text-foreground">💰 <span className="text-[hsl(0,100%,59%)]">US$20</span> mensais pra liberar o verdadeiro poder do ChatGPT PRO</p>
              <p className="text-base md:text-lg text-foreground">💰 <span className="text-[hsl(0,100%,59%)]">US$58</span> mensais pra liberar todos os recursos do Canva PRO ANUAL</p>
            </div>
            <div className="border-t border-[hsl(267,100%,65%,0.3)] pt-6 mb-6">
              <p className="text-xl md:text-2xl font-bold text-center text-foreground mb-2">Soma total? <span className="text-[hsl(0,100%,59%)]">US$103/mês</span></p>
              <p className="text-lg md:text-xl text-center text-muted-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">(+ de <span className="text-[#00ff73] font-bold">R$570</span> por mês, fácil.)</p>
            </div>
            <div className="text-center">
              <p className="text-lg md:text-xl mb-2 text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">E o que você vai pagar aqui?</p>
              <p className="text-4xl md:text-5xl font-black drop-shadow-[0_0_20px_rgba(0,255,115,0.6)]">
                Apenas <span className="text-[#00ff73]">R$13,90</span>
              </p>
              <p className="text-xl md:text-2xl font-bold text-[hsl(45,100%,60%)] mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Uma Única Vez.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            ESCOLHA SEU PLANO
          </h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <PricingCard title="🟡 PLANO GOLD" price="R$24,90" features={["Método Lovable Infinito", "Acesso ilimitado Lovable", "Bônus ChatGPT 5 Plus", "Bônus Canva PRO", "🎁 Aula: Como remover a marca d'água do Lovable", "Suporte premium"]} variant="gold" buttonText="QUERO PLANO GOLD" checkoutLink="LINK_CHECKOUT_GOLD" />
            <PricingCard title="⚙️ PLANO PRATA" price="R$13,90" features={["Método Lovable Infinito", "Acesso ilimitado Lovable", "Suporte básico"]} variant="silver" buttonText="QUERO PLANO PRATA" checkoutLink="LINK_CHECKOUT_PRATA" />
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-8 md:py-12 px-6 md:px-4 bg-black/30">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-block mb-6">
            <img src={garantia7dias} alt="Garantia 7 dias" className="w-auto max-w-[200px] md:max-w-[200px] mx-auto rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-6 text-foreground">
            Garantia de 7 dias ou seu dinheiro de volta
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-4">
            Se não funcionar pra você, devolvemos seu dinheiro.
          </p>
          <p className="text-base md:text-lg text-foreground">
            Sem desculpa, sem enrolação.<br />
            Ou funciona, ou o dinheiro volta. Simples assim.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 md:py-12 px-6 md:px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-foreground">
            PERGUNTAS FREQUENTES
          </h2>
          <div className="space-y-4">
            <FAQItem question="Isso é golpe?" answer="Não. O método é legítimo e validado por diversos usuários reais." />
            <FAQItem question="Precisa baixar algo?" answer="Não, tudo é feito online, direto no Lovable." />
            <FAQItem question="Posso tomar ban?" answer="Não. O método é uma brecha limpa, 100% segura." />
            <FAQItem question="E se não funcionar?" answer="Funciona. Mas se não funcionar com você, devolvemos seu dinheiro. Simples." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-4 border-t border-[hsl(267,100%,65%,0.3)] bg-black/40">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            © 2025 — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;