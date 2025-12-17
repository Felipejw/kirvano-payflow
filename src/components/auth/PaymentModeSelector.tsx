import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2, CreditCard, Check, ArrowRight, Wallet, Clock, Zap } from "lucide-react";

interface PaymentModeSelectorProps {
  value: "platform_gateway" | "own_gateway";
  onChange: (mode: "platform_gateway" | "own_gateway") => void;
  platformFees: {
    platformGatewayFeePercentage: number;
    platformGatewayFeeFixed: number;
    platformGatewayWithdrawalFee: number;
    ownGatewayFeePercentage: number;
    ownGatewayFeeFixed: number;
  };
}

export function PaymentModeSelector({ value, onChange, platformFees }: PaymentModeSelectorProps) {
  const options = [
    {
      id: "platform_gateway" as const,
      title: "Gateway Gateflow",
      subtitle: "Use nosso sistema de pagamento",
      icon: Building2,
      badge: "Recomendado para iniciantes",
      badgeVariant: "default" as const,
      features: [
        { icon: Zap, text: "Configuração instantânea" },
        { icon: CreditCard, text: `Taxa: ${platformFees.platformGatewayFeePercentage}% + R$ ${platformFees.platformGatewayFeeFixed.toFixed(2)}/venda` },
        { icon: Wallet, text: `Saque: R$ ${platformFees.platformGatewayWithdrawalFee.toFixed(2)}/solicitação` },
        { icon: Clock, text: "Saque manual em até 24h" },
      ],
      description: "Ideal para quem está começando. Não precisa configurar nada, nós processamos seus pagamentos.",
    },
    {
      id: "own_gateway" as const,
      title: "Seu Gateway/Banco",
      subtitle: "Configure seu próprio processador",
      icon: CreditCard,
      badge: "Maior controle",
      badgeVariant: "secondary" as const,
      features: [
        { icon: ArrowRight, text: "Receba direto na sua conta" },
        { icon: CreditCard, text: `Taxa: ${platformFees.ownGatewayFeePercentage}% + R$ ${platformFees.ownGatewayFeeFixed.toFixed(2)}/venda` },
        { icon: Clock, text: "Pague taxas semanalmente" },
        { icon: Wallet, text: "Sem taxa de saque" },
      ],
      description: "Ideal para quem já tem estrutura. Configure Asaas, Mercado Pago, PagBank ou outro gateway.",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Como deseja receber seus pagamentos?</h3>
        <p className="text-sm text-muted-foreground">
          Escolha a opção que melhor se adapta ao seu negócio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((option) => (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg relative overflow-hidden",
              value === option.id
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onChange(option.id)}
          >
            {value === option.id && (
              <div className="absolute top-3 right-3">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  value === option.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}>
                  <option.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{option.title}</CardTitle>
                  <CardDescription className="text-xs">{option.subtitle}</CardDescription>
                </div>
              </div>
              <Badge variant={option.badgeVariant} className="w-fit mt-2">
                {option.badge}
              </Badge>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{option.description}</p>
              
              <div className="space-y-2">
                {option.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <feature.icon className={cn(
                      "h-3.5 w-3.5",
                      value === option.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
        <p>
          💡 <strong>Dica:</strong> Você pode alterar o modo de pagamento posteriormente nas configurações,
          desde que não tenha valores pendentes.
        </p>
      </div>
    </div>
  );
}
