import { useState } from "react";
import { Smartphone, Monitor, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuizStep {
  id: string;
  quiz_id: string;
  name: string;
  order_index: number;
  step_type: string;
  settings: any;
  created_at: string;
}

interface QuizElement {
  id: string;
  step_id: string;
  element_type: string;
  order_index: number;
  content: any;
  styles: any;
  created_at: string;
}

interface Quiz {
  id: string;
  name: string;
  primary_color?: string;
  background_color?: string;
  text_color?: string;
  button_color?: string;
  font_family?: string;
  logo_url?: string;
  show_logo?: boolean;
  show_progress_bar?: boolean;
}

interface LivePreviewProps {
  quiz?: Quiz;
  steps: QuizStep[];
  elements: Record<string, QuizElement[]>;
  selectedStep: QuizStep | null;
}

export default function LivePreview({
  quiz,
  steps,
  elements,
  selectedStep,
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [previewStepIndex, setPreviewStepIndex] = useState(0);

  const currentStep = steps[previewStepIndex];
  const currentElements = currentStep ? elements[currentStep.id] || [] : [];
  const progress = steps.length > 0 ? ((previewStepIndex + 1) / steps.length) * 100 : 0;

  const handlePrevStep = () => {
    setPreviewStepIndex(Math.max(0, previewStepIndex - 1));
  };

  const handleNextStep = () => {
    setPreviewStepIndex(Math.min(steps.length - 1, previewStepIndex + 1));
  };

  // Sync preview with selected step in editor
  const syncedIndex = selectedStep
    ? steps.findIndex((s) => s.id === selectedStep.id)
    : -1;
  if (syncedIndex !== -1 && syncedIndex !== previewStepIndex) {
    setPreviewStepIndex(syncedIndex);
  }

  const quizStyles = {
    backgroundColor: quiz?.background_color || "#0f0f0f",
    color: quiz?.text_color || "#ffffff",
    fontFamily: quiz?.font_family || "inherit",
  };

  const buttonStyle = {
    backgroundColor: quiz?.button_color || quiz?.primary_color || "#8B5CF6",
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Preview header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Preview</h3>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={viewMode === "mobile" ? "default" : "ghost"}
            className="h-7 w-7"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "desktop" ? "default" : "ghost"}
            className="h-7 w-7"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview container */}
      <div className="flex-1 p-4 overflow-auto flex items-start justify-center">
        <div
          className={cn(
            "rounded-2xl border-4 border-border shadow-xl overflow-hidden transition-all duration-300",
            viewMode === "mobile" ? "w-80" : "w-full max-w-2xl"
          )}
          style={quizStyles}
        >
          {/* Phone notch for mobile */}
          {viewMode === "mobile" && (
            <div className="h-6 bg-black flex items-center justify-center">
              <div className="w-20 h-4 bg-black rounded-b-xl" />
            </div>
          )}

          {/* Quiz content */}
          <div className="min-h-[500px] p-4">
            {/* Logo */}
            {quiz?.show_logo && quiz?.logo_url && (
              <div className="flex justify-center mb-4">
                <img src={quiz.logo_url} alt="Logo" className="h-8 object-contain" />
              </div>
            )}

            {/* Progress bar */}
            {quiz?.show_progress_bar !== false && steps.length > 0 && (
              <div className="mb-6">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: quiz?.primary_color || "#8B5CF6" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-center mt-1 opacity-50">
                  Etapa {previewStepIndex + 1} de {steps.length}
                </p>
              </div>
            )}

            {/* Step content */}
            {currentStep ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {currentElements.map((element) => (
                    <PreviewElement
                      key={element.id}
                      element={element}
                      buttonStyle={buttonStyle}
                      primaryColor={quiz?.primary_color}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="h-full flex items-center justify-center text-white/30">
                <p className="text-sm">Nenhuma etapa para exibir</p>
              </div>
            )}
          </div>

          {/* Navigation controls */}
          {steps.length > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePrevStep}
                disabled={previewStepIndex === 0}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNextStep}
                disabled={previewStepIndex === steps.length - 1}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Preview element renderer
function PreviewElement({
  element,
  buttonStyle,
  primaryColor,
}: {
  element: QuizElement;
  buttonStyle: React.CSSProperties;
  primaryColor?: string;
}) {
  const content = element.content || {};

  switch (element.element_type) {
    case "title":
      return <h2 className="text-xl font-bold text-center">{content.text || "Título"}</h2>;

    case "text":
      return <p className="text-white/70 text-center">{content.text || "Texto"}</p>;

    case "image":
      return content.url ? (
        <img src={content.url} alt={content.alt || ""} className="w-full rounded-lg" />
      ) : (
        <div className="aspect-video bg-white/10 rounded-lg flex items-center justify-center">
          <span className="text-white/30 text-sm">Imagem</span>
        </div>
      );

    case "options":
      return (
        <div className="space-y-2">
          {(content.options || []).map((option: any, i: number) => (
            <div
              key={option.id || i}
              className="p-3 border border-white/20 rounded-lg hover:border-white/40 transition-colors cursor-pointer text-center"
            >
              {option.text}
            </div>
          ))}
        </div>
      );

    case "button":
      return (
        <button
          className="w-full py-3 rounded-lg font-medium text-white"
          style={buttonStyle}
        >
          {content.text || "Continuar"}
        </button>
      );

    case "input":
      return (
        <div className="space-y-2">
          {content.label && <label className="text-sm text-white/70">{content.label}</label>}
          <input
            type={content.type || "text"}
            placeholder={content.placeholder || "Digite aqui..."}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/30"
          />
        </div>
      );

    case "rating":
      return (
        <div className="text-center space-y-2">
          {content.label && <p className="text-sm text-white/70">{content.label}</p>}
          <div className="flex justify-center gap-2">
            {Array.from({ length: content.count || 5 }).map((_, i) => (
              <span key={i} className="text-2xl cursor-pointer hover:scale-110 transition-transform">
                ⭐
              </span>
            ))}
          </div>
        </div>
      );

    case "emoji_rating":
      return (
        <div className="text-center space-y-2">
          {content.label && <p className="text-sm text-white/70">{content.label}</p>}
          <div className="flex justify-center gap-3 text-3xl">
            {(content.emojis || ["😢", "😕", "😐", "🙂", "😄"]).map((emoji: string, i: number) => (
              <span key={i} className="cursor-pointer hover:scale-125 transition-transform">
                {emoji}
              </span>
            ))}
          </div>
        </div>
      );

    case "slider":
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/50">
            <span>{content.minLabel || content.min || 0}</span>
            <span>{content.maxLabel || content.max || 100}</span>
          </div>
          <input
            type="range"
            min={content.min || 0}
            max={content.max || 100}
            defaultValue={content.defaultValue || 50}
            className="w-full accent-purple-500"
            style={{ accentColor: primaryColor }}
          />
        </div>
      );

    case "progress":
      return (
        <div className="space-y-1">
          {content.showLabel && (
            <div className="text-xs text-right text-white/50">{content.value || 0}%</div>
          )}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${content.value || 0}%`,
                backgroundColor: primaryColor || "#8B5CF6",
              }}
            />
          </div>
        </div>
      );

    case "alert":
      return (
        <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-sm text-center">
          {content.text || "Alerta"}
        </div>
      );

    case "testimonial":
      return (
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-sm italic text-white/80 mb-2">"{content.text || "Depoimento"}"</p>
          <p className="font-medium text-sm">{content.name || "Nome"}</p>
          <p className="text-xs text-white/50">{content.role || "Cliente"}</p>
        </div>
      );

    case "divider":
      return <hr className="border-white/20 my-4" />;

    case "icon_list":
      return (
        <div className="space-y-2">
          {(content.items || []).map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm text-white/80">{item}</span>
            </div>
          ))}
        </div>
      );

    case "timer":
      return (
        <div className="text-center p-4 bg-white/10 rounded-lg">
          <div className="text-3xl font-bold font-mono">
            {Math.floor((content.duration || 60) / 60)}:
            {String((content.duration || 60) % 60).padStart(2, "0")}
          </div>
        </div>
      );

    case "countdown":
      return (
        <div className="text-center space-y-2">
          {content.text && <p className="text-sm text-white/70">{content.text}</p>}
          <div className="flex justify-center gap-2">
            {content.showDays && (
              <div className="bg-white/10 px-3 py-2 rounded">
                <span className="font-bold">00</span>
                <span className="text-xs block text-white/50">dias</span>
              </div>
            )}
            <div className="bg-white/10 px-3 py-2 rounded">
              <span className="font-bold">00</span>
              <span className="text-xs block text-white/50">horas</span>
            </div>
            <div className="bg-white/10 px-3 py-2 rounded">
              <span className="font-bold">00</span>
              <span className="text-xs block text-white/50">min</span>
            </div>
            <div className="bg-white/10 px-3 py-2 rounded">
              <span className="font-bold">00</span>
              <span className="text-xs block text-white/50">seg</span>
            </div>
          </div>
        </div>
      );

    case "image_options":
      return (
        <div className={cn("grid gap-2", `grid-cols-${content.columns || 2}`)}>
          {(content.options || []).map((option: any, i: number) => (
            <div
              key={option.id || i}
              className="p-2 border border-white/20 rounded-lg text-center cursor-pointer hover:border-white/40 transition-colors"
            >
              <div className="aspect-square bg-white/10 rounded mb-1 flex items-center justify-center">
                {option.imageUrl ? (
                  <img src={option.imageUrl} alt={option.text} className="w-full h-full object-cover rounded" />
                ) : (
                  <span className="text-white/30 text-xs">Imagem</span>
                )}
              </div>
              <span className="text-xs">{option.text}</span>
            </div>
          ))}
        </div>
      );

    case "date_picker":
      return (
        <div className="space-y-2">
          {content.label && <label className="text-sm text-white/70">{content.label}</label>}
          <div className="p-3 bg-white/10 border border-white/20 rounded-lg text-white/50 text-sm">
            {content.placeholder || "Selecione uma data"}
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-white/10 rounded text-sm text-white/50 text-center">
          {element.element_type}
        </div>
      );
  }
}
