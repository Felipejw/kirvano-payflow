import { AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppNavigate } from "@/lib/routes";

interface BlockedBannerProps {
  invoiceAmount?: number;
  invoicePeriod?: string;
  dueDate?: string;
}

export function BlockedBanner({ invoiceAmount, invoicePeriod, dueDate }: BlockedBannerProps) {
  const navigate = useAppNavigate();

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-full bg-destructive/20">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Sua Conta Está Bloqueada
          </h3>
          {invoiceAmount && (
            <p className="text-sm text-muted-foreground mt-1">
              Você possui uma fatura em atraso de{" "}
              <span className="font-semibold text-destructive">{formatCurrency(invoiceAmount)}</span>
              {invoicePeriod && <span> | Período: {invoicePeriod}</span>}
              {dueDate && <span> | Vencimento: {dueDate}</span>}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Enquanto não regularizar, seus clientes não terão acesso à área de membros e você não poderá fazer alterações na plataforma.
          </p>
          <Button
            variant="destructive"
            className="mt-4"
            onClick={() => navigate("dashboard/finance")}
          >
            Pagar Agora
          </Button>
        </div>
      </div>
    </div>
  );
}
