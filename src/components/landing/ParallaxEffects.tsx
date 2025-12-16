import { useEffect, useState, useRef, ReactNode } from "react";

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  direction?: "up" | "down";
}

export function ParallaxSection({ 
  children, 
  speed = 0.3, 
  className = "",
  direction = "up" 
}: ParallaxSectionProps) {
  const [offset, setOffset] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Only apply parallax when section is in view
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrolled = windowHeight - rect.top;
        const parallaxOffset = scrolled * speed * (direction === "up" ? -1 : 1);
        setOffset(parallaxOffset);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, direction]);

  return (
    <div ref={sectionRef} className={`relative overflow-hidden ${className}`}>
      <div 
        style={{ transform: `translateY(${offset}px)` }}
        className="transition-transform duration-100 ease-out"
      >
        {children}
      </div>
    </div>
  );
}

interface ParallaxBackgroundProps {
  className?: string;
  speed?: number;
}

export function ParallaxBackground({ className = "", speed = 0.5 }: ParallaxBackgroundProps) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrolled = window.scrollY;
        setOffset(scrolled * speed);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div 
      ref={ref}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ transform: `translateY(${offset}px)` }}
    />
  );
}

interface FloatingElementProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  amplitude?: number;
  className?: string;
}

export function FloatingElement({ 
  children, 
  delay = 0, 
  duration = 6, 
  amplitude = 20,
  className = "" 
}: FloatingElementProps) {
  return (
    <div 
      className={`animate-float ${className}`}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        '--float-amplitude': `${amplitude}px`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
