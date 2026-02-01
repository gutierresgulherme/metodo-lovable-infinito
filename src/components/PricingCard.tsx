import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  variant: "gold" | "silver";
  buttonText: string;
  checkoutLink: string;
  buttonId?: string;
}

export const PricingCard = ({ title, price, features, variant, buttonText, checkoutLink, buttonId }: PricingCardProps) => {
  const bgClass = variant === "gold" 
    ? "bg-[hsl(45,100%,60%,0.05)]"
    : "bg-[hsl(190,100%,50%,0.05)]";
  
  const borderClass = variant === "gold"
    ? "border-[hsl(45,100%,60%)]"
    : "border-[hsl(190,100%,50%)]";
    
  const shadowClass = variant === "gold"
    ? "shadow-[0_0_40px_hsl(45,100%,60%/0.4)]"
    : "shadow-[0_0_30px_hsl(190,100%,50%/0.3)]";

  return (
    <div className={`relative ${bgClass} border-2 ${borderClass} rounded-xl p-6 md:p-8 ${shadowClass} md:hover:scale-105 md:transition-transform md:duration-300`}>
      <div className="relative z-10">
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
          {title}
        </h3>
        <div className="mb-6">
          <span className="text-4xl md:text-5xl font-bold text-[#00ff73]">
            {price}
          </span>
        </div>
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-[hsl(94,100%,73%)] shrink-0 mt-0.5" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        <a
          id={buttonId}
          href={checkoutLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-checkout-yampi block w-full max-w-[360px] mx-auto rounded-full px-6 py-3 text-base sm:text-lg font-semibold text-white text-center leading-snug whitespace-normal break-words shadow-md active:scale-[0.99] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${
            variant === "gold" 
              ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-400" 
              : "bg-red-600 hover:bg-red-700 focus:ring-red-400"
          }`}
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
};
