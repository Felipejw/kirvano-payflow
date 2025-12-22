import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { 
  CreditCard, 
  Settings, 
  Check, 
  ArrowRight, 
  Zap, 
  Shield, 
  Wallet,
  Building2,
  Percent,
  Clock
} from "lucide-react";

const platformGatewayFeatures = [
  "Pronto para usar imediatamente",
  "Sem necessidade de configuração",
  "Suporte completo da plataforma",
  "Ideal para iniciantes",
  "PIX, Cartão e Boleto",
  "Roda Black e White",
];

const ownGatewayFeatures = [
  "Taxas reduzidas",
  "Dinheiro direto na sua conta",
  "Integração com Asaas ou Mercado Pago",
  "Ideal para quem já tem volume",
  "Maior controle financeiro",
];

export function PaymentModes() {
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  return (
    <section ref={ref} id="payment-modes" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Duas Formas de Vender</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Escolha a modalidade{" "}
            <span className="gradient-text">ideal para você</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Oferecemos duas opções de integração para atender diferentes necessidades e volumes de vendas
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Gateway da Plataforma */}
          <Card 
            className={`relative bg-background/80 backdrop-blur-sm border-border/50 overflow-hidden transition-all duration-700 hover:shadow-xl hover:shadow-primary/10 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Zap className="h-3 w-3 mr-1" />
                Recomendado
              </Badge>
            </div>
            
            <CardContent className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold mb-2">Gateway da Plataforma</h3>
              <p className="text-muted-foreground mb-6">
                Use nossa infraestrutura de pagamentos pronta para uso
              </p>
              
              {/* Pricing */}
              <div className="bg-primary/5 rounded-2xl p-6 mb-6 border border-primary/10">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary">5,99%</span>
                  <span className="text-muted-foreground">+</span>
                  <span className="text-2xl font-bold text-primary">R$1,00</span>
                </div>
                <p className="text-sm text-muted-foreground">por transação aprovada</p>
              </div>
              
              {/* Features */}
              <ul className="space-y-3 mb-8">
                {platformGatewayFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* CTA */}
              <Link to={getPageUrl("auth")} className="block">
                <Button className="w-full" variant="default" size="lg">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gateway Próprio */}
          <Card 
            className={`relative bg-background/80 backdrop-blur-sm border-border/50 overflow-hidden transition-all duration-700 hover:shadow-xl hover:shadow-accent/10 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            {/* Pro Badge */}
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="border-accent/50 text-accent">
                <Percent className="h-3 w-3 mr-1" />
                Menor Taxa
              </Badge>
            </div>
            
            <CardContent className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-6">
                <Settings className="h-8 w-8 text-accent" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold mb-2">Seu Próprio Gateway</h3>
              <p className="text-muted-foreground mb-6">
                Conecte seu Asaas ou Mercado Pago e pague menos
              </p>
              
              {/* Pricing */}
              <div className="bg-accent/5 rounded-2xl p-6 mb-6 border border-accent/10">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-accent">4,99%</span>
                  <span className="text-muted-foreground">+</span>
                  <span className="text-2xl font-bold text-accent">R$1,00</span>
                </div>
                <p className="text-sm text-muted-foreground">+ taxa do seu gateway (ex: Asaas ~1,99%)</p>
              </div>
              
              {/* Features */}
              <ul className="space-y-3 mb-8">
                {ownGatewayFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-accent" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* CTA */}
              <Link to={getPageUrl("auth")} className="block">
                <Button className="w-full" variant="outline" size="lg">
                  Configurar Gateway
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className={`mt-16 max-w-4xl mx-auto transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Card className="bg-background/60 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 md:p-8">
              <h4 className="text-lg font-semibold text-center mb-6">Comparativo Rápido</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Característica</th>
                      <th className="text-center py-3 px-4 font-medium text-primary">Gateway Plataforma</th>
                      <th className="text-center py-3 px-4 font-medium text-accent">Gateway Próprio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        Taxa da Plataforma
                      </td>
                      <td className="text-center py-3 px-4 font-semibold">5,99% + R$1,00</td>
                      <td className="text-center py-3 px-4 font-semibold text-accent">4,99% + R$1,00</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Taxa do Gateway
                      </td>
                      <td className="text-center py-3 px-4">Inclusa</td>
                      <td className="text-center py-3 px-4">~1,99% (Asaas)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Configuração
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Imediato</Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="outline">5 minutos</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Melhor Para
                      </td>
                      <td className="text-center py-3 px-4">Iniciantes</td>
                      <td className="text-center py-3 px-4">Alto Volume</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Example calculation */}
              <div className="mt-6 p-4 bg-muted/30 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  💡 <strong>Exemplo:</strong> Vendendo um produto de R$ 197,00
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Gateway Plataforma:</span>
                    <span className="font-semibold">R$ 12,80 de taxa</span>
                  </div>
                  <span className="hidden sm:inline text-muted-foreground">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Gateway Próprio:</span>
                    <span className="font-semibold text-accent">R$ 10,83 de taxa*</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">*Considerando Asaas com taxa de 1,99%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
