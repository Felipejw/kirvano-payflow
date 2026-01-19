import { useState, useRef } from "react";
import { Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VSLPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  onProgress?: (percent: number) => void;
}

export const VSLPlayer = ({ 
  videoUrl = "https://www.youtube.com/embed/XNTSK5Coja4", 
  thumbnailUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
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
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
      onProgress?.(percent);
    }
  };

  return (
    <div className="relative w-full max-w-full md:max-w-4xl mx-auto">
      <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-border/50">
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
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              
              {/* Play button */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 20px rgba(var(--accent), 0.3)",
                      "0 0 40px rgba(var(--accent), 0.5)",
                      "0 0 20px rgba(var(--accent), 0.3)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-accent-foreground ml-0.5" />
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            >
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

      {/* Progress bar */}
      {isPlaying && progress > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-border/50 rounded-b-xl md:rounded-b-2xl overflow-hidden"
        >
          <div 
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      )}
    </div>
  );
};
