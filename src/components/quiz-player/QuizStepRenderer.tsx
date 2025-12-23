import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, AlertCircle, Star, Quote, Loader2, CalendarIcon } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";

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

      case "rating":
        return <RatingElement element={element} value={localResponses[element.id]} onChange={(v) => handleInputChange(element.id, v)} quiz={quiz} />;

      case "slider":
        const sliderValue = localResponses[element.id] ?? content?.defaultValue ?? 50;
        return (
          <div className="space-y-4">
            {content?.label && (
              <p className="text-center font-medium">{content.label}</p>
            )}
            <div className="px-4">
              <Slider
                value={[sliderValue]}
                onValueChange={([v]) => handleInputChange(element.id, v)}
                min={content?.min || 0}
                max={content?.max || 100}
                step={content?.step || 1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{content?.minLabel || content?.min || 0}</span>
                <span className="font-semibold text-foreground">{sliderValue}</span>
                <span>{content?.maxLabel || content?.max || 100}</span>
              </div>
            </div>
          </div>
        );

      case "image_options":
        const imgOptions = content?.options || [];
        const imgMultiple = content?.multiple || false;
        const imgSelectedValue = localResponses[element.id];
        const columns = content?.columns || 2;

        return (
          <div className={cn("grid gap-3", columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4")}>
            {imgOptions.map((option: any) => {
              const isSelected = imgMultiple 
                ? (imgSelectedValue || []).includes(option.value)
                : imgSelectedValue === option.value;
              return (
                <div
                  key={option.id}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 p-2 transition-all hover:scale-105",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleOptionSelect(element.id, option.value, imgMultiple)}
                >
                  {option.imageUrl ? (
                    <img src={option.imageUrl} alt={option.text} className="w-full aspect-square object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Sem imagem</span>
                    </div>
                  )}
                  <p className="text-center text-sm font-medium">{option.text}</p>
                  {isSelected && <Check className="h-4 w-4 text-primary mx-auto mt-1" />}
                </div>
              );
            })}
          </div>
        );

      case "date_picker":
        const dateValue = localResponses[element.id];
        return (
          <div className="space-y-2">
            {content?.label && <Label>{content.label}</Label>}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateValue ? format(new Date(dateValue), "PPP", { locale: ptBR }) : content?.placeholder || "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue ? new Date(dateValue) : undefined}
                  onSelect={(date) => handleInputChange(element.id, date?.toISOString())}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "emoji_rating":
        const emojiValue = localResponses[element.id];
        const emojis = content?.emojis || ["😢", "😕", "😐", "🙂", "😄"];
        return (
          <div className="space-y-4 text-center">
            {content?.label && <p className="font-medium">{content.label}</p>}
            <div className="flex justify-center gap-4">
              {emojis.map((emoji: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleInputChange(element.id, i)}
                  className={cn(
                    "text-4xl transition-transform hover:scale-125 p-2 rounded-lg",
                    emojiValue === i && "bg-primary/20 scale-125"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        );

      case "divider":
        const spacingClasses: Record<string, string> = { sm: "my-2", md: "my-4", lg: "my-6" };
        const styleClasses: Record<string, string> = { solid: "border-solid", dashed: "border-dashed", dotted: "border-dotted" };
        return (
          <hr 
            className={cn(
              "border-t",
              spacingClasses[content?.spacing || "md"],
              styleClasses[content?.style || "solid"]
            )}
          />
        );

      case "icon_list":
        const items = content?.items || [];
        return (
          <div className="space-y-3">
            {items.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        );

      case "countdown":
        return <CountdownElement content={content} />;

      default:
        return null;
    }
  }
}

// Rating component
function RatingElement({ 
  element, 
  value, 
  onChange,
  quiz 
}: { 
  element: QuizElement; 
  value: number | undefined; 
  onChange: (value: number) => void;
  quiz: Quiz;
}) {
  const content = element.content;
  const ratingType = content?.ratingType || "stars";
  const count = content?.count || 5;
  
  return (
    <div className="space-y-4 text-center">
      {content?.label && <p className="font-medium">{content.label}</p>}
      <div className="flex justify-center gap-2">
        {Array.from({ length: count }).map((_, i) => {
          const isSelected = value !== undefined && i <= value;
          if (ratingType === "stars") {
            return (
              <button
                key={i}
                onClick={() => onChange(i)}
                className="transition-transform hover:scale-110"
              >
                <Star 
                  className={cn(
                    "h-8 w-8 transition-colors",
                    isSelected ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                  )} 
                />
              </button>
            );
          } else {
            return (
              <button
                key={i}
                onClick={() => onChange(i)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 font-bold transition-all hover:scale-110",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "border-muted-foreground text-muted-foreground hover:border-primary"
                )}
              >
                {i + 1}
              </button>
            );
          }
        })}
      </div>
    </div>
  );
}

// Countdown component
function CountdownElement({ content }: { content: any }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!content?.targetDate) return;

    const targetDate = new Date(content.targetDate);
    
    const updateCountdown = () => {
      const now = new Date();
      if (now >= targetDate) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = differenceInDays(targetDate, now);
      const hours = differenceInHours(targetDate, now) % 24;
      const minutes = differenceInMinutes(targetDate, now) % 60;
      const seconds = differenceInSeconds(targetDate, now) % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [content?.targetDate]);

  return (
    <div className="text-center space-y-3">
      {content?.text && <p className="font-medium">{content.text}</p>}
      <div className="flex justify-center gap-3">
        {content?.showDays && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 min-w-[70px]">
            <div className="text-2xl font-bold text-primary">{String(timeLeft.days).padStart(2, "0")}</div>
            <div className="text-xs text-muted-foreground">dias</div>
          </div>
        )}
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 min-w-[70px]">
          <div className="text-2xl font-bold text-primary">{String(timeLeft.hours).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground">horas</div>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 min-w-[70px]">
          <div className="text-2xl font-bold text-primary">{String(timeLeft.minutes).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground">min</div>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 min-w-[70px]">
          <div className="text-2xl font-bold text-primary">{String(timeLeft.seconds).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground">seg</div>
        </div>
      </div>
    </div>
  );
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
