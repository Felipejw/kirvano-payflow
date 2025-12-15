import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  duration?: number;
  startOnMount?: boolean;
}

export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {}
) {
  const { duration = 1000, startOnMount = true } = options;
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      countRef.current = easeOutQuart * endValue;
      setCount(countRef.current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    // Reset and start animation
    startTimeRef.current = null;
    countRef.current = 0;
    setCount(0);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration, startOnMount]);

  return count;
}

export function formatAnimatedValue(
  value: number,
  type: "currency" | "number" | "percent"
): string {
  switch (type) {
    case "currency":
      return `R$ ${value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
    default:
      return Math.round(value).toString();
  }
}