import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

type FeeSettings = {
  id: string;
  user_id: string;
  pix_fee_percentage: number;
  pix_fee_fixed: number;
  card_fee_percentage: number;
  card_fee_fixed: number;
  boleto_fee_percentage: number;
  boleto_fee_fixed: number;
  withdrawal_fee: number;
  default_affiliate_commission_rate: number | null;
};

const numberOr = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export function SellerFeeSettings({ paymentMode }: { paymentMode: string | null | undefined }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<FeeSettings | null>(null);

  const isOwnGateway = paymentMode === "own_gateway";

  const hint = useMemo(() => {
    if (isOwnGateway) return "Essas taxas serão usadas para calcular a taxa da plataforma em pagamentos via PIX/cartão/boleto do seu gateway.";
    return "Você está no modo Gateway da Plataforma. As taxas abaixo não serão aplicadas enquanto esse modo estiver ativo.";
  }, [isOwnGateway]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: existing, error } = await supabase
        .from("seller_fee_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[SellerFeeSettings] fetch error", error);
        toast.error("Erro ao carregar suas taxas");
        setLoading(false);
        return;
      }

      if (existing) {
        setData(existing as FeeSettings);
        setLoading(false);
        return;
      }

      // Create defaults on first access
      const { data: created, error: insertError } = await supabase
        .from("seller_fee_settings")
        .insert({ user_id: user.id })
        .select("*")
        .single();

      if (insertError) {
        console.error("[SellerFeeSettings] insert error", insertError);
        toast.error("Erro ao criar suas taxas");
      } else {
        setData(created as FeeSettings);
      }
      setLoading(false);
    };

    load();
  }, []);

  const update = (patch: Partial<FeeSettings>) => {
    setData((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("seller_fee_settings")
        .update({
          pix_fee_percentage: numberOr(data.pix_fee_percentage, 0),
          pix_fee_fixed: numberOr(data.pix_fee_fixed, 0),
          card_fee_percentage: numberOr(data.card_fee_percentage, 0),
          card_fee_fixed: numberOr(data.card_fee_fixed, 0),
          boleto_fee_percentage: numberOr(data.boleto_fee_percentage, 0),
          boleto_fee_fixed: numberOr(data.boleto_fee_fixed, 0),
          withdrawal_fee: numberOr(data.withdrawal_fee, 0),
          default_affiliate_commission_rate:
            data.default_affiliate_commission_rate === null || data.default_affiliate_commission_rate === ("" as any)
              ? null
              : numberOr(data.default_affiliate_commission_rate, 0),
        })
        .eq("id", data.id);

      if (error) {
        console.error("[SellerFeeSettings] save error", error);
        toast.error("Erro ao salvar taxas");
        return;
      }

      toast.success("Taxas atualizadas!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Taxas do seu Gateway
          </CardTitle>
          <CardDescription>Não foi possível carregar suas configurações.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Taxas do seu Gateway
        </CardTitle>
        <CardDescription>Defina suas taxas por método e regras padrão de comissão.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-secondary/50">
          <AlertDescription>{hint}</AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>PIX (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.pix_fee_percentage}
              onChange={(e) => update({ pix_fee_percentage: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>PIX (R$ fixo)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.pix_fee_fixed}
              onChange={(e) => update({ pix_fee_fixed: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Saque (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.withdrawal_fee}
              onChange={(e) => update({ withdrawal_fee: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Cartão (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.card_fee_percentage}
              onChange={(e) => update({ card_fee_percentage: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Cartão (R$ fixo)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.card_fee_fixed}
              onChange={(e) => update({ card_fee_fixed: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Boleto (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.boleto_fee_percentage}
              onChange={(e) => update({ boleto_fee_percentage: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Boleto (R$ fixo)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.boleto_fee_fixed}
              onChange={(e) => update({ boleto_fee_fixed: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Comissão padrão de afiliado (%) (opcional)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.default_affiliate_commission_rate ?? ""}
              onChange={(e) =>
                update({
                  default_affiliate_commission_rate: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="Ex: 10"
            />
            <p className="text-xs text-muted-foreground">
              Por padrão o sistema usa a comissão do produto/afiliado; este campo serve como fallback (vamos ligar isso em seguida, se você quiser).
            </p>
          </div>
        </div>

        <Button variant="gradient" onClick={save} disabled={saving} className="gap-2">
          {saving ? "Salvando..." : "Salvar Taxas"}
        </Button>
      </CardContent>
    </Card>
  );
}
