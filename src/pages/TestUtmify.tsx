import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function TestUtmify() {
  const navigate = useNavigate();
  const [utms, setUtms] = useState<any>({});
  const [pixelId, setPixelId] = useState<string>("");
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [yampiButtons, setYampiButtons] = useState<number>(0);
  const [lastEvents, setLastEvents] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[DEBUG] window.pixelId =", (window as any).pixelId);
      console.log("[DEBUG] UTMIFY SDK =", (window as any).Utmify);
      console.log("[DEBUG] UTMIFY Internal =", (window as any).__UTMIFY__);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const simulateEvent = (eventName: string) => {
    if ((window as any).Utmify?.track) {
      (window as any).Utmify.track(eventName, utms);
      setLastEvents((prev) => [...prev, `${eventName} - ${new Date().toLocaleTimeString()}`]);
      console.log(`[UTMIFY DEBUG] Evento simulado: ${eventName}`);
    } else {
      alert("SDK da UTMify não está carregado!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🔍 UTMify Debug Panel
          </h1>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black"
          >
            Voltar
          </Button>
        </div>

        {/* Status do Script */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Script da UTMify
              <Badge variant={scriptLoaded ? "default" : "destructive"}>
                {scriptLoaded ? "✅ Carregado" : "❌ Não Carregado"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              {scriptLoaded
                ? "O script da UTMify foi carregado com sucesso."
                : "O script da UTMify NÃO foi detectado. Verifique o index.html."}
            </p>
          </CardContent>
        </Card>

        {/* PixelID */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>PixelID Detectado</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="bg-black p-3 rounded block text-cyan-400">
              {pixelId || "Nenhum PixelID detectado"}
            </code>
          </CardContent>
        </Card>

        {/* UTMs Capturadas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>UTMs Capturadas</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-black p-4 rounded overflow-auto text-sm text-green-400">
              {Object.keys(utms).length > 0
                ? JSON.stringify(utms, null, 2)
                : "Nenhuma UTM capturada"}
            </pre>
          </CardContent>
        </Card>

        {/* Botões Yampi */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Botões Yampi Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">{yampiButtons}</p>
            <p className="text-gray-400 text-sm mt-2">
              {yampiButtons > 0
                ? "Botões de checkout detectados na página inicial."
                : "Nenhum botão detectado. Verifique a página inicial."}
            </p>
          </CardContent>
        </Card>

        {/* Simulador de Eventos */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Simulador de Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => simulateEvent("pageView")}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Simular pageView
              </Button>
              <Button
                onClick={() => simulateEvent("viewContent")}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Simular viewContent
              </Button>
              <Button
                onClick={() => simulateEvent("initiateCheckout")}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                Simular initiateCheckout
              </Button>
              <Button
                onClick={() => simulateEvent("purchase")}
                variant="default"
                className="bg-pink-600 hover:bg-pink-700"
              >
                Simular purchase
              </Button>
            </div>

            {/* Últimos Eventos */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Últimos Eventos Enviados:</h3>
              <div className="bg-black p-4 rounded max-h-40 overflow-auto">
                {lastEvents.length > 0 ? (
                  lastEvents.map((event, index) => (
                    <p key={index} className="text-cyan-400 text-sm">
                      {event}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500">Nenhum evento enviado ainda.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Console Debug */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>💡 Dica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Abra o <strong>Console do Navegador</strong> (F12) para ver todos os logs
              detalhados da UTMify em tempo real.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
