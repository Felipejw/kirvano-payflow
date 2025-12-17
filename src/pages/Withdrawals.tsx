import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WithdrawalManagement } from "@/components/dashboard/WithdrawalManagement";
import { usePaymentMode } from "@/hooks/usePaymentMode";
import { useToast } from "@/hooks/use-toast";
import { useAppNavigate } from "@/lib/routes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Withdrawals() {
  const { paymentMode, loading } = usePaymentMode();
  const { toast } = useToast();
  const navigate = useAppNavigate();

  useEffect(() => {
    if (!loading && paymentMode === 'own_gateway') {
      toast({
        title: "Acesso não disponível",
        description: "Esta página é apenas para vendedores usando o Gateway da Plataforma",
        variant: "destructive"
      });
      navigate("dashboard");
    }
  }, [paymentMode, loading, navigate, toast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (paymentMode === 'own_gateway') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Saques</h1>
          <p className="text-muted-foreground">
            Gerencie seus saques e acompanhe seu saldo
          </p>
        </div>

        <Alert className="border-primary/50 bg-primary/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Gateway Gateflow (BSPAY)</AlertTitle>
          <AlertDescription>
            Seus pagamentos são processados pela BSPAY. Taxa de saque: R$ 5,00 por solicitação. 
            Prazo de processamento: 1-2 dias úteis.
          </AlertDescription>
        </Alert>

        <WithdrawalManagement />
      </div>
    </DashboardLayout>
  );
}
