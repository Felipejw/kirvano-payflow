import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConditionModalProps {
  open: boolean;
  onClose: () => void;
  connection: {
    id: string;
    source_step_id: string;
    target_step_id: string;
    condition: any;
    is_default: boolean;
  } | null;
  sourceStepName: string;
  targetStepName: string;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function ConditionModal({
  open,
  onClose,
  connection,
  sourceStepName,
  targetStepName,
  onUpdate,
  onDelete,
}: ConditionModalProps) {
  const [isDefault, setIsDefault] = useState(true);
  const [conditionType, setConditionType] = useState<string>("equals");
  const [conditionValue, setConditionValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (connection) {
      setIsDefault(connection.is_default ?? true);
      if (connection.condition) {
        setConditionType(connection.condition.type || "equals");
        setConditionValue(connection.condition.value || "");
      } else {
        setConditionType("equals");
        setConditionValue("");
      }
    }
  }, [connection]);

  async function handleSave() {
    if (!connection) return;

    setSaving(true);
    try {
      const condition = isDefault ? null : {
        type: conditionType,
        value: conditionValue,
      };

      const { error } = await supabase
        .from("quiz_connections")
        .update({
          is_default: isDefault,
          condition,
        })
        .eq("id", connection.id);

      if (error) throw error;

      toast.success("Conexão atualizada!");
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error updating connection:", error);
      toast.error("Erro ao atualizar conexão");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!connection) return;

    try {
      const { error } = await supabase
        .from("quiz_connections")
        .delete()
        .eq("id", connection.id);

      if (error) throw error;

      toast.success("Conexão removida!");
      onDelete();
      onClose();
    } catch (error: any) {
      console.error("Error deleting connection:", error);
      toast.error("Erro ao remover conexão");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Conexão</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Connection info */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{sourceStepName}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{targetStepName}</span>
            </div>
          </div>

          {/* Default connection toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is-default">Conexão padrão</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Usada quando nenhuma condição é atendida
              </p>
            </div>
            <Switch
              id="is-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          {/* Condition settings (only if not default) */}
          {!isDefault && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label>Tipo de condição</Label>
                <Select value={conditionType} onValueChange={setConditionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Igual a</SelectItem>
                    <SelectItem value="contains">Contém</SelectItem>
                    <SelectItem value="not_equals">Diferente de</SelectItem>
                    <SelectItem value="greater_than">Maior que</SelectItem>
                    <SelectItem value="less_than">Menor que</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  placeholder="Ex: opção A, sim, 10..."
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A resposta da etapa anterior será comparada com este valor
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
