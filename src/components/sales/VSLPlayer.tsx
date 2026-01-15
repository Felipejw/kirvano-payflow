import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VSLPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  onProgress?: (percent: number) => void;
}

export const VSLPlayer = ({ 
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ", 
  thumbnailUrl,
  onProgress 
}: VSLPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
      onProgress?.(currentProgress);
    }
  };

  // Default thumbnail with play button overlay
  const defaultThumbnail = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop";

  return (
    <div className="relative w-full max-w-[720px] mx-auto">
      <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-border/50">
        <AnimatePresence mode="wait">
          {!isPlaying ? (
            <motion.div
              key="thumbnail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer group"
              onClick={handlePlay}
            >
              {/* Thumbnail */}
              <img
                src={thumbnailUrl || defaultThumbnail}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Play button */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-accent flex items-center justify-center shadow-xl group-hover:bg-accent/90 transition-colors">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-accent-foreground fill-current ml-1" />
                </div>
              </motion.div>

              {/* Text overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm md:text-base font-medium opacity-90">
                  Clique para assistir
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full"
            >
              {/* For demo, using iframe. In production, use video element */}
              <iframe
                src={`${videoUrl}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress indicator (optional, for native video) */}
      {isPlaying && progress > 0 && (
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
