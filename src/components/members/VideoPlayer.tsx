import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";

interface VideoPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
}

const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

const isDirectVideo = (url: string): boolean => {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
};

export function VideoPlayer({ open, onOpenChange, url, title }: VideoPlayerProps) {
  if (!url) return null;

  const youtubeId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const isDirectUrl = isDirectVideo(url);

  const renderPlayer = () => {
    if (youtubeId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (vimeoId) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
          className="w-full aspect-video rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (isDirectUrl) {
      return (
        <video
          src={url}
          className="w-full aspect-video rounded-lg"
          controls
          autoPlay
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>
      );
    }

    // Fallback - show link to external content
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground text-center">
          Este formato de vídeo não pode ser reproduzido diretamente.
        </p>
        <Button onClick={() => window.open(url, "_blank")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir em nova aba
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="pr-8">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {renderPlayer()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
