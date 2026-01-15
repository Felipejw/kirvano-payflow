import { SalesHero } from "@/components/sales/SalesHero";
import { FixedCTA } from "@/components/sales/FixedCTA";
import { UseOwnSection } from "@/components/sales/UseOwnSection";
import { CompleteSystemSection } from "@/components/sales/CompleteSystemSection";
import { WhiteLabelSection } from "@/components/sales/WhiteLabelSection";
import { EarningModelsSection } from "@/components/sales/EarningModelsSection";
import { SalesFAQ } from "@/components/sales/SalesFAQ";
import { FinalClosing } from "@/components/sales/FinalClosing";

const SalesPage = () => {
  const handleBuyClick = () => {
    // Scroll to checkout or open payment modal
    // For now, redirect to auth page for registration
    window.location.href = "/?page=auth";
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero with VSL */}
      <SalesHero onBuyClick={handleBuyClick} />
      
      {/* Section 1 - Use for yourself */}
      <UseOwnSection onBuyClick={handleBuyClick} />
      
      {/* Section 2 - Complete System */}
      <CompleteSystemSection />
      
      {/* Section 3 - White Label */}
      <WhiteLabelSection />
      
      {/* Section 4 - Earning Models */}
      <EarningModelsSection />
      
      {/* Section 5 - FAQ */}
      <SalesFAQ />
      
      {/* Final Closing - NO FOOTER AFTER THIS */}
      <FinalClosing onBuyClick={handleBuyClick} />
      
      {/* Fixed CTA Bar */}
      <FixedCTA onBuyClick={handleBuyClick} />
    </div>
  );
};

export default SalesPage;
