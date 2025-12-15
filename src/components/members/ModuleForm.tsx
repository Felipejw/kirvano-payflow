import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Module {
  id: string;
  name: string;
  description: string | null;
}

interface ModuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
  onSave: (data: { name: string; description: string }) => void;
}

export function ModuleForm({ open, onOpenChange, module, onSave }: ModuleFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    name: string;
    description: string;
  }>();

  useEffect(() => {
    if (open) {
      reset({
        name: module?.name || "",
        description: module?.description || "",
      });
    }
  }, [open, module, reset]);

  const onSubmit = (data: { name: string; description: string }) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Módulo *</Label>
            <Input
              id="name"
              {...register("name", { required: "Nome é obrigatório" })}
              placeholder="Ex: Introdução ao Curso"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descrição opcional do módulo"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {module ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
