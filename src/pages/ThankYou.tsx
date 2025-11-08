export default function ThankYou() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white px-6 text-center">
      <h1 className="text-3xl font-bold mb-4 text-green-600">🎉 Obrigado pela sua compra!</h1>
      <p className="text-gray-700 mb-4 text-base leading-relaxed">
        Seu pagamento foi confirmado e o acesso foi enviado para o seu e-mail.
      </p>
      <p className="text-gray-600 mb-8 text-sm">
        Se o e-mail não aparecer em alguns minutos, verifique a pasta de <strong>spam</strong> ou <strong>promoções</strong>.
      </p>
      <a
        href="https://wa.me/5511992361771?text=Olá%20acabei%20de%20adquirir%20o%20método%20Lovable%20Infinito!%20Gostaria%20de%20receber%20meu%20acesso%20agora."
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-green-600 hover:bg-green-700 text-white text-lg font-semibold text-center rounded-full px-6 py-3 w-full max-w-[360px] mx-auto leading-snug"
      >
        💬 Falar com suporte
      </a>
      <p className="text-gray-400 text-xs mt-10">© 2025 — Todos os direitos reservados.</p>
    </div>
  );
}
