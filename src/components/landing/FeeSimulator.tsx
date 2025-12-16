import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Calculator, ArrowRight, Check, TrendingDown, Sparkles } from "lucide-react";

const competitors = [
  { name: "Kiwify", percentageFee: 8.99, fixedFee: 2.49, color: "bg-red-500/10 border-red-500/20" },
  { name: "Cakto", percentageFee: 4.99, fixedFee: 2.49, color: "bg-orange-500/10 border-orange-500/20" },
  { name: "Hotmart", percentageFee: 9.9, fixedFee: 1, color: "bg-yellow-500/10 border-yellow-500/20" },
  { name: "Ticto", percentageFee: 6.99, fixedFee: 2.49, color: "bg-purple-500/10 border-purple-500/20" },
];

const gatteflow = { name: "Gatteflow", percentageFee: 4.99, fixedFee: 1 };

function calculateFee(price: number, percentageFee: number, fixedFee: number): number {
  return (price * percentageFee) / 100 + fixedFee;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function FeeSimulator() {
  const [productPrice, setProductPrice] = useState<number>(197);
  const [salesQuantity, setSalesQuantity] = useState<number>(100);
  const { ref, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  const gatteflowFee = calculateFee(productPrice, gatteflow.percentageFee, gatteflow.fixedFee);
  const gatteflowTotal = gatteflowFee * salesQuantity;

  return (
    <section ref={ref} id="pricing" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Calculator className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Simulador de Economia</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Veja quanto você{" "}
            <span className="gradient-text">vai economizar</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare nossas taxas com a concorrência e descubra sua economia real
          </p>
        </div>

        {/* Simulator */}
        <div className={`max-w-5xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Input Section */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50 mb-8">
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="price" className="text-base font-medium mb-2 block">
                    Valor do produto
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      id="price"
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(Number(e.target.value) || 0)}
                      className="pl-12 h-14 text-xl font-semibold"
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="quantity" className="text-base font-medium mb-2 block">
                    Vendas por mês
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={salesQuantity}
                    onChange={(e) => setSalesQuantity(Number(e.target.value) || 0)}
                    className="h-14 text-xl font-semibold"
                    min={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gatteflow Card - Highlighted */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/30 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-bl-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Menor taxa
            </div>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-1">Gatteflow</h3>
                  <p className="text-lg text-muted-foreground">
                    {gatteflow.percentageFee}% + {formatCurrency(gatteflow.fixedFee)} por venda
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Taxa por venda</div>
                  <div className="text-3xl font-bold text-primary">{formatCurrency(gatteflowFee)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Total mensal: <span className="font-semibold text-foreground">{formatCurrency(gatteflowTotal)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competitors Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {competitors.map((competitor, index) => {
              const competitorFee = calculateFee(productPrice, competitor.percentageFee, competitor.fixedFee);
              const savings = competitorFee - gatteflowFee;
              const totalSavings = savings * salesQuantity;

              return (
                <Card 
                  key={competitor.name}
                  className={`${competitor.color} border transition-all duration-300 hover:scale-[1.02] ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">{competitor.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {competitor.percentageFee}% + {formatCurrency(competitor.fixedFee)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">{formatCurrency(competitorFee)}</div>
                        <div className="text-xs text-muted-foreground">por venda</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-accent">
                        <TrendingDown className="h-5 w-5" />
                        <span className="font-semibold">Economia</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-accent">
                          {formatCurrency(savings)}/venda
                        </div>
                        <div className="text-sm text-accent/80">
                          {formatCurrency(totalSavings)}/mês
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary & CTA */}
          <div className={`text-center transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-accent/10 border border-accent/20 mb-8">
              <Check className="h-6 w-6 text-accent" />
              <span className="text-lg">
                Com <span className="font-bold text-accent">{salesQuantity} vendas</span>, você economiza até{" "}
                <span className="font-bold text-accent">
                  {formatCurrency((calculateFee(productPrice, 9.9, 1) - gatteflowFee) * salesQuantity)}
                </span>
                /mês
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Link to={getPageUrl("auth")}>
                <Button variant="gradient" size="xl" className="group">
                  Economize Agora - Criar Conta
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                Sem taxas ocultas. Sem surpresas. Você só paga quando vender.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
