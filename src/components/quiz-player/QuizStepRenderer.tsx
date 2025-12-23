import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, AlertCircle, Star, Quote, Loader2 } from "lucide-react";

interface QuizStep {
  id: string;
  name: string;
  step_type: string;
  settings: any;
}

interface QuizElement {
  id: string;
  element_type: string;
  order_index: number;
  content: any;
  styles: any;
}

interface Quiz {
  primary_color: string | null;
  button_color: string | null;
  text_color: string | null;
}

interface QuizStepRendererProps {
  step: QuizStep;
  elements: QuizElement[];
  responses: Record<string, any>;
  onResponse: (stepId: string, elementId: string | null, value: any) => void;
  onNext: () => void;
  onUpdateLeadInfo: (info: { name?: string; email?: string; phone?: string }) => void;
  quiz: Quiz;
}

export default function QuizStepRenderer({
  step,
  elements,
  responses,
  onResponse,
  onNext,
  onUpdateLeadInfo,
  quiz,
}: QuizStepRendererProps) {
  const [localResponses, setLocalResponses] = useState<Record<string, any>>(responses);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Reset local responses when step changes
  useEffect(() => {
    setLocalResponses(responses);
  }, [step.id, responses]);

  // Handle confetti element
  useEffect(() => {
    const confettiElement = elements.find(e => e.element_type === "confetti");
    if (confettiElement && confettiElement.content?.trigger === "onLoad") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), confettiElement.content?.duration || 3000);
    }
  }, [elements, step.id]);

  // Handle loading element
  useEffect(() => {
    const loadingElement = elements.find(e => e.element_type === "loading");
    if (loadingElement) {
      setShowLoading(true);
      const duration = loadingElement.content?.duration || 2000;
      const interval = duration / 100;
      let progress = 0;

      const timer = setInterval(() => {
        progress += 1;
        setLoadingProgress(progress);
        if (progress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setShowLoading(false);
            onNext();
          }, 200);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [elements, step.id]);

  const handleInputChange = useCallback(
    (elementId: string, value: any) => {
      setLocalResponses((prev) => ({ ...prev, [elementId]: value }));
      onResponse(step.id, elementId, value);

      // Check if it's a form field for lead info
      const element = elements.find((e) => e.id === elementId);
      if (element?.element_type === "input") {
        const inputType = element.content?.type;
        if (inputType === "email") {
          onUpdateLeadInfo({ email: value });
        } else if (inputType === "tel") {
          onUpdateLeadInfo({ phone: value });
        } else if (element.content?.label?.toLowerCase().includes("nome")) {
          onUpdateLeadInfo({ name: value });
        }
      }
    },
    [step.id, elements, onResponse, onUpdateLeadInfo]
  );

  const handleOptionSelect = useCallback(
    (elementId: string, value: string, multiple: boolean) => {
      if (multiple) {
        const current = localResponses[elementId] || [];
        const newValue = current.includes(value)
          ? current.filter((v: string) => v !== value)
          : [...current, value];
        handleInputChange(elementId, newValue);
      } else {
        handleInputChange(elementId, value);
      }
    },
    [localResponses, handleInputChange]
  );

  const handleButtonClick = useCallback(
    (element: QuizElement) => {
      const action = element.content?.action || "next";
      
      if (action === "next") {
        onNext();
      } else if (action === "redirect" && element.content?.url) {
        window.location.href = element.content.url;
      }
    },
    [onNext]
  );

  const buttonStyle = quiz.button_color
    ? { backgroundColor: quiz.button_color, borderColor: quiz.button_color }
    : undefined;

  // Show loading screen if loading element is active
  if (showLoading) {
    const loadingElement = elements.find(e => e.element_type === "loading");
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium mb-4">{loadingElement?.content?.text || "Carregando..."}</p>
        <div className="w-64">
          <Progress value={loadingProgress} className="h-2" />
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Confetti effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {/* Simple confetti animation using CSS */}
            <div className="confetti-container">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'][Math.floor(Math.random() * 14)],
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {elements.map((element) => (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: element.order_index * 0.1 }}
          >
            {renderElement(element)}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );

  function renderElement(element: QuizElement) {
    const { element_type, content, styles } = element;

    switch (element_type) {
      case "title":
        return (
          <h1
            className="text-2xl md:text-3xl font-bold text-center"
            style={{ color: quiz.text_color || undefined }}
          >
            {content?.text || "Título"}
          </h1>
        );

      case "text":
        return (
          <p className="text-center text-muted-foreground leading-relaxed">
            {content?.text || "Texto"}
          </p>
        );

      case "image":
        return content?.url ? (
          <div className="flex justify-center">
            <img
              src={content.url}
              alt={content.alt || "Imagem"}
              className="max-w-full h-auto rounded-lg shadow-md"
              style={{ maxHeight: "400px" }}
            />
          </div>
        ) : null;

      case "video":
        if (!content?.url) return null;
        const videoUrl = content.url;
        let embedUrl = videoUrl;

        // Convert YouTube URL to embed
        if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
          const videoId = videoUrl.includes("youtu.be")
            ? videoUrl.split("/").pop()
            : new URLSearchParams(new URL(videoUrl).search).get("v");
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }

        return (
          <div className="aspect-video rounded-lg overflow-hidden shadow-md">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );

      case "options":
        const options = content?.options || [];
        const multiple = content?.multiple || false;
        const selectedValue = localResponses[element.id];

        return (
          <div className="space-y-3">
            {multiple ? (
              options.map((option: any) => {
                const isSelected = (selectedValue || []).includes(option.value);
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleOptionSelect(element.id, option.value, true)}
                  >
                    <Checkbox checked={isSelected} />
                    <span className="flex-1">{option.text}</span>
                    {isSelected && <Check className="h-5 w-5 text-primary" />}
                  </div>
                );
              })
            ) : (
              <RadioGroup
                value={selectedValue || ""}
                onValueChange={(value) => handleOptionSelect(element.id, value, false)}
              >
                {options.map((option: any) => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleOptionSelect(element.id, option.value, false)}
                    >
                      <RadioGroupItem value={option.value} />
                      <span className="flex-1">{option.text}</span>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          </div>
        );

      case "button":
        return (
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="min-w-[200px] text-lg"
              style={buttonStyle}
              onClick={() => handleButtonClick(element)}
            >
              {content?.text || "Continuar"}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );

      case "input":
        const inputType = content?.type || "text";
        const inputValue = localResponses[element.id] || "";

        return (
          <div className="space-y-2">
            {content?.label && <Label>{content.label}</Label>}
            {inputType === "textarea" ? (
              <Textarea
                placeholder={content?.placeholder}
                value={inputValue}
                onChange={(e) => handleInputChange(element.id, e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <Input
                type={inputType}
                placeholder={content?.placeholder}
                value={inputValue}
                onChange={(e) => handleInputChange(element.id, e.target.value)}
                required={content?.required}
              />
            )}
          </div>
        );

      case "timer":
        return <TimerElement duration={content?.duration || 60} onComplete={onNext} />;

      case "testimonial":
        return (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <Quote className="h-8 w-8 mx-auto mb-4 text-primary opacity-50" />
            <p className="text-lg italic mb-4">{content?.text || "Depoimento"}</p>
            <div className="flex items-center justify-center gap-3">
              {content?.avatar && (
                <img
                  src={content.avatar}
                  alt={content.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="text-left">
                <p className="font-semibold">{content?.name || "Nome"}</p>
                <p className="text-sm text-muted-foreground">{content?.role || "Cliente"}</p>
              </div>
            </div>
          </div>
        );

      case "alert":
        const alertTypes: Record<string, string> = {
          info: "bg-blue-500/10 border-blue-500/50 text-blue-400",
          warning: "bg-amber-500/10 border-amber-500/50 text-amber-400",
          error: "bg-red-500/10 border-red-500/50 text-red-400",
          success: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400",
        };
        const alertClass = alertTypes[content?.type || "info"] || alertTypes.info;

        return (
          <div className={cn("flex items-center gap-3 p-4 rounded-lg border", alertClass)}>
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{content?.text || "Mensagem"}</p>
          </div>
        );

      case "progress":
        return (
          <div className="space-y-2">
            {content?.showLabel && (
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{content?.value || 0}%</span>
              </div>
            )}
            <Progress value={content?.value || 0} />
          </div>
        );

      case "confetti":
      case "loading":
        // These are handled separately
        return null;

      default:
        return null;
    }
  }
}

// Timer component
function TimerElement({ duration, onComplete }: { duration: number; onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex justify-center">
      <div className="bg-primary/10 border border-primary/30 rounded-lg px-6 py-3">
        <p className="text-2xl font-mono font-bold text-primary">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
