import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { getPageUrl } from "@/lib/routes";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Calculator, ArrowRight, Check, TrendingDown, Sparkles } from "lucide-react";

const competitors = [
  { name: "Kiwify", percentageFee: 8.99, fixedFee: 2.49, color: "bg-red-500" },
  { name: "Cakto", percentageFee: 4.99, fixedFee: 2.49, color: "bg-orange-500" },
  { name: "Hotmart", percentageFee: 9.9, fixedFee: 1, color: "bg-yellow-500" },
  { name: "Ticto", percentageFee: 6.99, fixedFee: 2.49, color: "bg-purple-500" },
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

  // Calculate all fees for chart
  const chartData = useMemo(() => {
    const allPlatforms = [
      { ...gatteflow, color: "bg-primary", isGatteflow: true },
      ...competitors.map(c => ({ ...c, isGatteflow: false })),
    ];
    
    const fees = allPlatforms.map(platform => ({
      ...platform,
      fee: calculateFee(productPrice, platform.percentageFee, platform.fixedFee),
      totalMonthly: calculateFee(productPrice, platform.percentageFee, platform.fixedFee) * salesQuantity,
    }));
    
    const maxFee = Math.max(...fees.map(f => f.fee));
    
    return fees.map(f => ({
      ...f,
      percentage: (f.fee / maxFee) * 100,
    }));
  }, [productPrice, salesQuantity]);

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

          {/* Visual Bar Chart */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50 mb-8">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-6 text-center">Taxa por venda de {formatCurrency(productPrice)}</h3>
              <div className="space-y-4">
                {chartData.map((platform, index) => (
                  <div 
                    key={platform.name}
                    className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                    style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${platform.isGatteflow ? 'text-primary' : 'text-foreground'}`}>
                          {platform.name}
                        </span>
                        {platform.isGatteflow && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-full">
                            Menor taxa
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${platform.isGatteflow ? 'text-primary' : 'text-foreground'}`}>
                          {formatCurrency(platform.fee)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({platform.percentageFee}% + {formatCurrency(platform.fixedFee)})
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-muted/50 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 ${
                          platform.isGatteflow 
                            ? 'bg-gradient-to-r from-primary to-accent' 
                            : platform.color + '/70'
                        }`}
                        style={{ 
                          width: isVisible ? `${platform.percentage}%` : '0%',
                          transitionDelay: `${400 + index * 100}ms`
                        }}
                      >
                        {!platform.isGatteflow && platform.fee > gatteflowFee && (
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            +{formatCurrency(platform.fee - gatteflowFee)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Monthly Total Comparison */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Total mensal com {salesQuantity} vendas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {chartData.map((platform) => (
                    <div 
                      key={platform.name}
                      className={`text-center p-3 rounded-xl ${
                        platform.isGatteflow 
                          ? 'bg-primary/10 border-2 border-primary/30' 
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${platform.isGatteflow ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {platform.name}
                      </div>
                      <div className={`font-bold ${platform.isGatteflow ? 'text-primary' : 'text-foreground'}`}>
                        {formatCurrency(platform.totalMonthly)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savings Cards Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {competitors.map((competitor, index) => {
              const competitorFee = calculateFee(productPrice, competitor.percentageFee, competitor.fixedFee);
              const savings = competitorFee - gatteflowFee;
              const totalSavings = savings * salesQuantity;

              return (
                <Card 
                  key={competitor.name}
                  className={`bg-background/60 border-border/50 transition-all duration-300 hover:scale-[1.02] ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${600 + index * 100}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-muted-foreground text-sm">vs {competitor.name}</h4>
                        <div className="text-2xl font-bold text-accent">
                          {formatCurrency(savings)}<span className="text-sm font-normal">/venda</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-accent">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-sm font-medium">Economia</span>
                        </div>
                        <div className="text-lg font-bold text-accent">
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
