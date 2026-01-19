import { SalesHero } from "@/components/sales/SalesHero";
import { FixedCTA } from "@/components/sales/FixedCTA";
import { UseOwnSection } from "@/components/sales/UseOwnSection";
import { SystemShowcaseSection } from "@/components/sales/SystemShowcaseSection";
import { CompleteSystemSection } from "@/components/sales/CompleteSystemSection";
import { WhiteLabelSection } from "@/components/sales/WhiteLabelSection";
import { EarningModelsSection } from "@/components/sales/EarningModelsSection";
import { ClosingOffer } from "@/components/sales/ClosingOffer";
import { SalesFAQ } from "@/components/sales/SalesFAQ";
import { SalesTestimonials } from "@/components/sales/SalesTestimonials";
import { SalesWhatsAppButton } from "@/components/sales/SalesWhatsAppButton";
import { useMetaPixel } from "@/hooks/useMetaPixel";

const SalesPage = () => {
  const { trackAddToCart } = useMetaPixel('2873946036127913');

  const handleBuyClick = () => {
    trackAddToCart();
    window.open("https://gatteflow.store/?s=gatteflow", "_blank");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero with VSL */}
      <SalesHero onBuyClick={handleBuyClick} />
      
      {/* Section 1 - Use for yourself */}
      <UseOwnSection onBuyClick={handleBuyClick} />
      
      {/* Section 2 - System Showcase with real screenshots */}
      <SystemShowcaseSection />
      
      {/* Section 3 - Complete System features list */}
      <CompleteSystemSection onBuyClick={handleBuyClick} />
      
      {/* Section 4 - White Label */}
      <WhiteLabelSection />
      
      {/* Section 5 - Earning Models */}
      <EarningModelsSection onBuyClick={handleBuyClick} />
      
      {/* Section 6 - Testimonials */}
      <SalesTestimonials />
      
      {/* Section 7 - Closing Offer */}
      <ClosingOffer onBuyClick={handleBuyClick} />
      
      {/* Section 8 - FAQ */}
      <SalesFAQ onBuyClick={handleBuyClick} />
      
      {/* WhatsApp Floating Button */}
      <SalesWhatsAppButton />
      
      {/* Fixed CTA Bar */}
      <FixedCTA onBuyClick={handleBuyClick} />
    </div>
  );
};

export default SalesPage;
