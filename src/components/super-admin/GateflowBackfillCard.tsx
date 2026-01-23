import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type BackfillSource = "both" | "transactions" | "gateflow_sales";

const GATEFLOW_PRODUCT_ID = "e5761661-ebb4-4605-a33c-65943686972c";

export const GateflowBackfillCard = () => {
  const [dryRun, setDryRun] = useState(true);
  const [batchSize, setBatchSize] = useState(200);
  const [source, setSource] = useState<BackfillSource>("both");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const parsedBatchSize = useMemo(() => {
    const n = Number(batchSize);
    if (!Number.isFinite(n)) return 200;
    return Math.min(500, Math.max(1, Math.floor(n)));
  }, [batchSize]);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-gateflow-buyers", {
        body: {
          product_id: GATEFLOW_PRODUCT_ID,
          dry_run: dryRun,
          limit: parsedBatchSize,
          source,
        },
      });

      if (error) throw error;
      setResult(data);

      if (dryRun) {
        toast.success("Dry-run concluído");
      } else {
        toast.success("Backfill executado com sucesso");
      }
    } catch (e: any) {
      console.error("Backfill error:", e);
      toast.error(e?.message || "Erro ao executar backfill");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backfill compradores do Gateflow</CardTitle>
        <CardDescription>
          Cria/regulariza usuários Admin (revenda), tenant e produto vinculado para compras antigas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Dry-run</Label>
            <div className="flex items-center gap-3">
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
              <span className="text-sm text-muted-foreground">
                {dryRun ? "Não cria nada, só simula" : "Executa de verdade"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Batch size</Label>
            <Input
              inputMode="numeric"
              value={String(batchSize)}
              onChange={(e) => setBatchSize(Number(e.target.value || 0))}
              placeholder="200"
            />
          </div>

          <div className="space-y-2">
            <Label>Fonte</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={source === "both" ? "default" : "outline"}
                onClick={() => setSource("both")}
              >
                Ambas
              </Button>
              <Button
                type="button"
                variant={source === "transactions" ? "default" : "outline"}
                onClick={() => setSource("transactions")}
              >
                Transactions
              </Button>
              <Button
                type="button"
                variant={source === "gateflow_sales" ? "default" : "outline"}
                onClick={() => setSource("gateflow_sales")}
              >
                Gateflow Sales
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={run} disabled={running}>
            {running ? "Executando..." : dryRun ? "Rodar dry-run" : "Executar backfill"}
          </Button>
          {!dryRun && (
            <p className="text-sm text-muted-foreground">
              Dica: execute em lotes (ex.: 200) até zerar.
            </p>
          )}
        </div>

        {result && (
          <pre className="max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};
