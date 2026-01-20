import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileVideo, FileText, File, Archive } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  accept = "video/mp4,video/webm,application/pdf,application/zip,application/x-zip-compressed,.zip",
  maxSizeMB = 100,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("video/")) return <FileVideo className="h-8 w-8" />;
    if (type === "application/pdf") return <FileText className="h-8 w-8" />;
    if (type.includes("zip") || type === "application/x-zip-compressed") return <Archive className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const uploadFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      // Simulate progress (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from("lesson-content")
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("lesson-content")
        .getPublicUrl(filePath);

      setProgress(100);
      onUploadComplete(urlData.publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo: " + (error.message || "Tente novamente"));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={uploading}
      />

      {uploading ? (
        <div className="space-y-3">
          <div className="animate-pulse">
            <Upload className="h-8 w-8 mx-auto text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Enviando...</p>
          <Progress value={progress} className="h-2" />
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Arraste um arquivo ou{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-primary hover:underline"
              >
                clique para selecionar
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vídeos (MP4, WebM), PDFs ou arquivos ZIP até {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
