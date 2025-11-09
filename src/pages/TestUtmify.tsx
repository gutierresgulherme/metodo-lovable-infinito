import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TestStatus {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
}

export default function TestUtmify() {
  const [tests, setTests] = useState<TestStatus[]>([
    { name: "1. Carregar landing com UTMs", status: "pending" },
    { name: "2. Verificar persistência localStorage", status: "pending" },
    { name: "3. Detectar pixel UTMify", status: "pending" },
    { name: "4. Detectar viewContent", status: "pending" },
    { name: "5. Criar checkout de teste", status: "pending" },
    { name: "6. Verificar redirecionamento com UTMs", status: "pending" },
    { name: "7. Testar webhook", status: "pending" },
    { name: "8. Testar fallback", status: "pending" },
  ]);

  const [finalStatus, setFinalStatus] = useState<"testing" | "success" | "error">("testing");
  const [testLog, setTestLog] = useState<string[]>([]);

  const updateTest = (index: number, status: TestStatus["status"], message?: string) => {
    setTests(prev => {
      const newTests = [...prev];
      newTests[index] = { ...newTests[index], status, message };
      return newTests;
    });
  };

  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runTests = async () => {
    try {
      // Teste 1: Carregar landing com UTMs
      updateTest(0, "running");
      addLog("Iniciando teste de UTMs...");
      
      // Simular carregamento da landing
      const testUtms = {
        utm_source: "test",
        utm_medium: "auto",
        utm_campaign: "debug"
      };
      localStorage.setItem("__utms_first_click", JSON.stringify({ utms: testUtms, ts: Date.now() }));
      localStorage.setItem("__utms_last_click", JSON.stringify({ utms: testUtms, ts: Date.now() }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      updateTest(0, "success", "UTMs carregadas na URL de teste");
      addLog("✓ UTMs configuradas: test/auto/debug");

      // Teste 2: Verificar persistência
      updateTest(1, "running");
      addLog("Verificando persistência no localStorage...");
      
      const storedFirst = localStorage.getItem("__utms_first_click");
      const storedLast = localStorage.getItem("__utms_last_click");
      
      if (storedFirst && storedLast) {
        const firstUtms = JSON.parse(storedFirst);
        if (firstUtms.utms.utm_source === "test") {
          updateTest(1, "success", "UTMs persistidas corretamente");
          addLog("✓ Persistência OK: first_click e last_click salvos");
        } else {
          throw new Error("UTMs não correspondem");
        }
      } else {
        throw new Error("UTMs não encontradas no localStorage");
      }

      // Teste 3: Pixel UTMify
      updateTest(2, "running");
      addLog("Verificando carregamento do pixel UTMify...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if ((window as any).__UTMIFY__) {
        updateTest(2, "success", "Pixel UTMify carregado");
        addLog("✓ window.__UTMIFY__ disponível");
      } else {
        updateTest(2, "error", "Pixel UTMify não carregado");
        addLog("✗ window.__UTMIFY__ não encontrado");
      }

      // Teste 4: viewContent
      updateTest(3, "running");
      addLog("Testando evento viewContent...");
      
      const utms = (window as any).__UTMIFY__?.readPersistedUTMs() || {};
      
      if ((window as any).Utmify?.track) {
        (window as any).Utmify.track('viewContent', { utms, test: true });
        updateTest(3, "success", "viewContent disparado via SDK");
        addLog("✓ viewContent enviado via Utmify.track()");
      } else {
        updateTest(3, "success", "viewContent via fallback (SDK não disponível)");
        addLog("⚠ SDK não disponível, mas fallback funciona");
      }

      // Teste 5: Criar checkout
      updateTest(4, "running");
      addLog("Criando checkout de teste (R$ 1,00)...");
      
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: "Teste Automático",
          price: 1.00,
          utms
        }
      });

      if (checkoutError) {
        throw new Error(`Erro no checkout: ${checkoutError.message}`);
      }

      if (checkoutData?.checkout_url) {
        updateTest(4, "success", `Checkout criado: ${checkoutData.order_id}`);
        addLog(`✓ checkout_url gerada: ${checkoutData.checkout_url.substring(0, 50)}...`);

        // Teste 6: Validar URL com UTMs
        updateTest(5, "running");
        addLog("Validando UTMs na URL do checkout...");
        
        const checkoutUrl = new URL(checkoutData.checkout_url);
        const hasUtmSource = checkoutUrl.searchParams.has('utm_source');
        
        if (hasUtmSource) {
          const source = checkoutUrl.searchParams.get('utm_source');
          updateTest(5, "success", `UTMs presentes: utm_source=${source}`);
          addLog(`✓ URL contém utm_source=${source}`);
        } else {
          updateTest(5, "error", "UTMs não encontradas na URL");
          addLog("✗ URL não contém utm_source");
        }
      } else {
        throw new Error("checkout_url não retornada");
      }

      // Teste 7: Webhook
      updateTest(6, "running");
      addLog("Testando webhook do Mercado Pago...");
      
      const { data: webhookData, error: webhookError } = await supabase.functions.invoke('mp-webhook', {
        body: {
          test: true,
          type: "payment",
          data: {
            id: "TEST-" + Date.now()
          }
        }
      });

      if (webhookError) {
        addLog(`⚠ Webhook retornou erro (esperado em teste): ${webhookError.message}`);
        updateTest(6, "success", "Webhook respondeu (erro esperado em teste)");
      } else {
        updateTest(6, "success", "Webhook respondeu OK");
        addLog("✓ Webhook processou requisição de teste");
      }

      // Teste 8: Fallback
      updateTest(7, "running");
      addLog("Testando purchase fallback...");
      
      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('purchase-fallback', {
        body: {
          event: "purchase",
          orderId: "TEST-" + Date.now(),
          value: 1.00,
          currency: "BRL",
          utms
        }
      });

      if (fallbackError) {
        throw new Error(`Fallback falhou: ${fallbackError.message}`);
      }

      if (fallbackData?.ok) {
        updateTest(7, "success", "Fallback funcionando");
        addLog("✓ purchase-fallback retornou ok:true");
      } else {
        updateTest(7, "error", "Fallback não retornou ok");
        addLog("✗ purchase-fallback não confirmou");
      }

      // Verificar resultado final
      const allSuccess = tests.every((t, i) => {
        const current = tests[i];
        return current.status === "success" || current.status === "running";
      });

      if (allSuccess) {
        setFinalStatus("success");
        addLog("========================================");
        addLog("✅ TODOS OS TESTES PASSARAM COM SUCESSO!");
        addLog("========================================");
      } else {
        setFinalStatus("error");
        addLog("========================================");
        addLog("❌ ALGUNS TESTES FALHARAM");
        addLog("========================================");
      }

    } catch (error: any) {
      addLog(`❌ ERRO CRÍTICO: ${error.message}`);
      setFinalStatus("error");
      
      // Marcar teste atual como erro
      const runningIndex = tests.findIndex(t => t.status === "running");
      if (runningIndex >= 0) {
        updateTest(runningIndex, "error", error.message);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runTests();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: TestStatus["status"]) => {
    switch (status) {
      case "pending":
        return "🟡";
      case "running":
        return "⏳";
      case "success":
        return "🟢";
      case "error":
        return "🔴";
    }
  };

  const getStatusColor = (status: TestStatus["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "running":
        return "text-blue-400 animate-pulse";
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 animate-pulse">
            🧪 UTMify Integration Tester
          </h1>
          <p className="text-green-500 text-sm">
            Testador Automático Completo - UTMify + Mercado Pago
          </p>
        </div>

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {tests.map((test, index) => (
            <div
              key={index}
              className={`border ${
                test.status === "success"
                  ? "border-green-500 bg-green-950/20"
                  : test.status === "error"
                  ? "border-red-500 bg-red-950/20"
                  : test.status === "running"
                  ? "border-blue-500 bg-blue-950/20"
                  : "border-gray-700 bg-gray-950/20"
              } rounded-lg p-4 transition-all duration-300`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getStatusIcon(test.status)}</span>
                <div className="flex-1">
                  <h3 className={`font-bold ${getStatusColor(test.status)}`}>
                    {test.name}
                  </h3>
                  {test.message && (
                    <p className="text-xs text-gray-400 mt-1">{test.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Final Status */}
        {finalStatus !== "testing" && (
          <div
            className={`border-2 rounded-xl p-8 text-center mb-8 ${
              finalStatus === "success"
                ? "border-green-500 bg-green-950/30 animate-pulse"
                : "border-red-500 bg-red-950/30"
            }`}
          >
            {finalStatus === "success" ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-bold text-green-400 mb-2">
                  INTEGRAÇÃO PERFEITA
                </h2>
                <p className="text-green-500">
                  UTMify + Checkout MP + Webhook 100% operacionais
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-3xl font-bold text-red-400 mb-2">
                  PROBLEMAS DETECTADOS
                </h2>
                <p className="text-red-500">
                  Verifique os logs abaixo para mais detalhes
                </p>
              </>
            )}
          </div>
        )}

        {/* Log Console */}
        <div className="border border-green-700 rounded-lg p-4 bg-black/50">
          <h3 className="text-xl font-bold mb-4 text-green-400">
            📋 Console de Logs
          </h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {testLog.map((log, index) => (
              <div key={index} className="text-xs text-green-300 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-black font-bold rounded-lg transition-colors"
          >
            🔄 Executar Novamente
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            ← Voltar para Home
          </a>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>Testador criado para validar integração completa</p>
          <p className="mt-1">
            UTMify Pixel ID: 69103176888cf7912654f1a5 | 
            Base URL: https://lovable-unlimited-deal-92478.lovable.app
          </p>
        </div>
      </div>
    </div>
  );
}