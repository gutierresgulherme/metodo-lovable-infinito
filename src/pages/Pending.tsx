import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Pending() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment');
        
        if (error) {
          console.error("❌ Erro ao verificar pagamento:", error);
          return;
        }

        if (data?.status === "approved") {
          window.location.href = "/thankyou";
        }
      } catch (err) {
        console.error("❌ Erro ao verificar pagamento:", err);
      }
    };

    // Verificar imediatamente
    checkPayment();

    // Verificar a cada 5 segundos
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 5);
      checkPayment();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white text-center p-8">
      <h1 className="text-3xl font-bold text-yellow-400 animate-pulse mb-6">
        ⏳ Aguardando confirmação do seu pagamento...
      </h1>
      <div className="border-4 border-yellow-400 border-t-transparent rounded-full w-16 h-16 animate-spin mb-4"></div>
      <p className="text-gray-300 text-lg">
        Isso pode levar alguns segundos...<br />
        Tempo decorrido: {seconds}s
      </p>
      <p className="text-gray-400 text-sm mt-8">
        Não feche esta página. Você será redirecionado automaticamente.
      </p>
    </div>
  );
}
