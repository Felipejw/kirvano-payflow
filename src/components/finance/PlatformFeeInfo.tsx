import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Percent, Calendar, AlertTriangle } from "lucide-react";

interface PlatformFeeInfoProps {
  feePercentage: number;
  feeFixed: number;
}

export function PlatformFeeInfo({ feePercentage, feeFixed }: PlatformFeeInfoProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Calculate example fee for R$100 sale
  const exampleSale = 100;
  const exampleFee = (exampleSale * feePercentage / 100) + feeFixed;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          Taxa da Plataforma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div>
            <p className="font-semibold text-lg">Taxa por venda</p>
            <p className="text-sm text-muted-foreground">Calculada sobre o valor da venda</p>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            {feePercentage}% + {formatCurrency(feeFixed)}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Cobrança Semanal</p>
              <p className="text-sm text-muted-foreground">Toda segunda-feira via PIX</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-200">Importante</p>
              <p className="text-sm text-yellow-200/80">
                O não pagamento da fatura resulta em bloqueio da área de membros de todos os seus clientes e impossibilidade de editar produtos/checkouts.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary/30 text-center">
          <p className="text-sm text-muted-foreground">
            Exemplo: Para uma venda de {formatCurrency(exampleSale)}, a taxa será de{" "}
            <span className="font-semibold text-primary">{formatCurrency(exampleFee)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
