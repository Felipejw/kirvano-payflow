import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "./FileUpload";
import { Link, Upload } from "lucide-react";

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  duration_minutes: number | null;
  is_free: boolean;
}

interface LessonFormData {
  name: string;
  description: string;
  content_type: string;
  content_url: string;
  duration_minutes: number | null;
  is_free: boolean;
}

interface LessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSave: (data: LessonFormData) => void;
}

export function LessonForm({ open, onOpenChange, lesson, onSave }: LessonFormProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<LessonFormData>({
    defaultValues: {
      content_type: "video",
      is_free: false,
    }
  });

  const [inputMethod, setInputMethod] = useState<"url" | "upload">("url");

  const contentType = watch("content_type");
  const isFree = watch("is_free");
  const contentUrl = watch("content_url");

  useEffect(() => {
    if (open) {
      reset({
        name: lesson?.name || "",
        description: lesson?.description || "",
        content_type: lesson?.content_type || "video",
        content_url: lesson?.content_url || "",
        duration_minutes: lesson?.duration_minutes || null,
        is_free: lesson?.is_free || false,
      });
      setInputMethod("url");
    }
  }, [open, lesson, reset]);

  const onSubmit = (data: LessonFormData) => {
    onSave(data);
  };

  const handleFileUpload = (url: string) => {
    setValue("content_url", url);
  };

  const getContentUrlLabel = () => {
    switch (contentType) {
      case "video":
        return "URL do Vídeo (YouTube, Vimeo, etc.)";
      case "pdf":
        return "URL do PDF";
      case "link":
        return "URL do Link Externo";
      default:
        return "URL do Arquivo";
    }
  };

  const getContentUrlPlaceholder = () => {
    switch (contentType) {
      case "video":
        return "https://youtube.com/watch?v=...";
      case "pdf":
        return "https://exemplo.com/arquivo.pdf";
      case "link":
        return "https://exemplo.com/conteudo";
      default:
        return "https://exemplo.com/arquivo";
    }
  };

  const showUploadOption = contentType === "video" || contentType === "pdf" || contentType === "file";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lesson ? "Editar Aula" : "Nova Aula"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Aula *</Label>
            <Input
              id="name"
              {...register("name", { required: "Nome é obrigatório" })}
              placeholder="Ex: Aula 1 - Boas-vindas"
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
              placeholder="Descrição opcional da aula"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_type">Tipo de Conteúdo</Label>
            <Select
              value={contentType}
              onValueChange={(value) => setValue("content_type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="link">Link Externo</SelectItem>
                <SelectItem value="file">Arquivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            {showUploadOption ? (
              <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "url" | "upload")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-2">
                  <Input
                    {...register("content_url")}
                    placeholder={getContentUrlPlaceholder()}
                  />
                </TabsContent>
                <TabsContent value="upload" className="mt-2">
                  <FileUpload
                    onUploadComplete={handleFileUpload}
                    accept={
                      contentType === "pdf" 
                        ? "application/pdf" 
                        : contentType === "file"
                        ? "application/pdf,application/zip,application/x-zip-compressed,.zip"
                        : "video/mp4,video/webm"
                    }
                  />
                  {contentUrl && (
                    <p className="text-sm text-muted-foreground mt-2 truncate">
                      Arquivo: {contentUrl.split('/').pop()}
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Input
                {...register("content_url")}
                placeholder={getContentUrlPlaceholder()}
              />
            )}
          </div>

          {contentType === "video" && (
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (minutos)</Label>
              <Input
                id="duration_minutes"
                type="number"
                {...register("duration_minutes", { valueAsNumber: true })}
                placeholder="Ex: 15"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch
              id="is_free"
              checked={isFree}
              onCheckedChange={(checked) => setValue("is_free", checked)}
            />
            <Label htmlFor="is_free" className="cursor-pointer">
              Aula gratuita (preview)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {lesson ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
