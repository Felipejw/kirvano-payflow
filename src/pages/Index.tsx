import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeaturesDetailed } from "@/components/landing/FeaturesDetailed";
import { PaymentModes } from "@/components/landing/PaymentModes";
import { FeeSimulator } from "@/components/landing/FeeSimulator";
import { Stats } from "@/components/landing/Stats";
import { PaymentMethods } from "@/components/landing/PaymentMethods";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { ParallaxBackground } from "@/components/landing/ParallaxEffects";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      {/* Dobra 1 - Hero com parallax background */}
      <div className="relative">
        <ParallaxBackground 
          className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" 
          speed={0.2} 
        />
        <Hero />
      </div>
      
      {/* Dobra 2 - Features */}
      <div className="relative">
        <ParallaxBackground 
          className="bg-gradient-to-br from-accent/5 to-transparent" 
          speed={0.15} 
        />
        <FeaturesDetailed />
      </div>
      
      {/* Dobra 3 - Duas Modalidades de Pagamento */}
      <PaymentModes />
      
      {/* Dobra 4 - Simulador de Taxas com gráfico */}
      <FeeSimulator />
      
      {/* Dobra 4 - Resultados */}
      <div className="relative">
        <ParallaxBackground 
          className="bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" 
          speed={0.1} 
        />
        <Stats />
      </div>
      
      {/* Dobra 5 - Formas de Pagamento */}
      <div className="relative">
        <ParallaxBackground 
          className="bg-gradient-to-tl from-accent/5 to-primary/5" 
          speed={0.2} 
        />
        <PaymentMethods />
      </div>
      
      {/* Dobra 7 - Depoimentos */}
      <Testimonials />
      
      {/* Dobra 8 - CTA Final */}
      <div className="relative">
        <ParallaxBackground 
          className="bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" 
          speed={0.15} 
        />
        <FinalCTA />
      </div>
      
      {/* FAQ - Última dobra */}
      <FAQ />
      
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
