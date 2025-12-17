import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Clock, CheckCircle, AlertTriangle, XCircle, QrCode, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface Invoice {
  id: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_amount: number;
  fee_percentage: number;
  fee_fixed: number;
  fee_total: number;
  status: string;
  due_date: string;
  pix_code: string | null;
  pix_qr_code: string | null;
  paid_at: string | null;
}

interface InvoicesListProps {
  invoices: Invoice[];
  loading: boolean;
}

export function InvoicesList({ invoices, loading }: InvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Vencida
          </Badge>
        );
      case "blocked":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Bloqueado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM", { locale: ptBR });
  };

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código PIX copiado!");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Faturas da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma fatura gerada ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                As faturas são geradas toda segunda-feira
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Período</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Vendas</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Total Vendas</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Taxa</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Vencimento</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/50 hover:bg-secondary/50">
                      <td className="p-4 font-medium">
                        {formatDate(invoice.period_start)} a {formatDate(invoice.period_end)}
                      </td>
                      <td className="p-4">{invoice.total_sales}</td>
                      <td className="p-4">{formatCurrency(invoice.total_amount)}</td>
                      <td className="p-4 font-semibold text-primary">
                        {formatCurrency(invoice.fee_total)}
                      </td>
                      <td className="p-4">
                        {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="p-4">{getStatusBadge(invoice.status)}</td>
                      <td className="p-4">
                        {invoice.status === "pending" || invoice.status === "overdue" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            Pagar
                          </Button>
                        ) : invoice.paid_at ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(invoice.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar Fatura</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Período</span>
                  <span className="font-medium">
                    {formatDate(selectedInvoice.period_start)} - {formatDate(selectedInvoice.period_end)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Vendas</span>
                  <span className="font-medium">{selectedInvoice.total_sales}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Taxa</span>
                  <span className="font-medium">
                    {selectedInvoice.fee_percentage}% + {formatCurrency(selectedInvoice.fee_fixed)}/venda
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-semibold">Total a Pagar</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedInvoice.fee_total)}
                  </span>
                </div>
              </div>

              {selectedInvoice.pix_code ? (
                <div className="space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={selectedInvoice.pix_code} size={200} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Escaneie o QR Code ou copie o código PIX
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-secondary rounded-lg text-sm font-mono break-all">
                        {selectedInvoice.pix_code.substring(0, 50)}...
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyPix(selectedInvoice.pix_code!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                  <p className="text-muted-foreground">
                    QR Code PIX não disponível. Entre em contato com o suporte.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
