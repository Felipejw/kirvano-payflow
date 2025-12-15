import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Settings, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  instructions: string | null;
}

interface SellerCredential {
  id: string;
  gateway_id: string;
  is_active: boolean;
  is_default: boolean;
}

interface GatewayCardProps {
  gateway: Gateway;
  credential?: SellerCredential;
  onConfigure: (gateway: Gateway) => void;
  onSetDefault: (gatewayId: string) => void;
}

const gatewayLogos: Record<string, string> = {
  mercado_pago: "https://logopng.com.br/logos/mercado-pago-icone-1024.png",
  pagbank: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/PagBank.svg/512px-PagBank.svg.png",
  bspay: "",
  getnet: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Getnet_logo.svg/512px-Getnet_logo.svg.png",
  picpay: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/PicPay_logo.svg/512px-PicPay_logo.svg.png",
};

export function GatewayCard({ gateway, credential, onConfigure, onSetDefault }: GatewayCardProps) {
  const isConfigured = !!credential;
  const isDefault = credential?.is_default;
  const logoUrl = gateway.logo_url || gatewayLogos[gateway.slug] || "";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg",
        isConfigured && "border-primary/50",
        isDefault && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-secondary/50 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={gateway.name} className="w-12 h-12 object-contain" />
            ) : (
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{gateway.name}</h3>
              {isDefault && (
                <Badge variant="default" className="shrink-0">Padrão</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isConfigured ? (
                <span className="text-sm text-green-500 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Configurado
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Não configurado
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant={isConfigured ? "outline" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => onConfigure(gateway)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isConfigured ? "Editar" : "Configurar"}
          </Button>
          {isConfigured && !isDefault && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSetDefault(gateway.id)}
            >
              Tornar padrão
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
