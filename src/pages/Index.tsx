import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeaturesDetailed } from "@/components/landing/FeaturesDetailed";
import { FeeSimulator } from "@/components/landing/FeeSimulator";
import { Stats } from "@/components/landing/Stats";
import { PaymentMethods } from "@/components/landing/PaymentMethods";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />                    {/* Dobra 1 - Apresentação */}
      <FeaturesDetailed />        {/* Dobra 2 - Diferenciais */}
      <FeeSimulator />            {/* Dobra 3 - Simulador de Taxas */}
      <Stats />                   {/* Dobra 4 - Resultados */}
      <PaymentMethods />          {/* Dobra 5 - Formas de Pagamento */}
      <Testimonials />            {/* Dobra 7 - Depoimentos */}
      <FinalCTA />                {/* Dobra 8 - Resumo e CTA Final */}
      <Footer />
      <WhatsAppButton />          {/* Botão flutuante WhatsApp */}
    </div>
  );
};

export default Index;
