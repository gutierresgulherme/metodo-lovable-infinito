export default function CheckoutButton({
  href,
  children,
  className = "",
}: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "block w-full max-w-[360px] mx-auto rounded-full px-6 py-3 " +
        "text-base sm:text-lg font-semibold text-white text-center leading-snug " +
        "whitespace-normal break-words bg-red-600 hover:bg-red-700 " +
        "shadow-md active:scale-[0.99] transition-all duration-150 " +
        "focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 " +
        "pointer-events-auto z-10 " +
        className
      }
    >
      {children}
    </a>
  );
}
