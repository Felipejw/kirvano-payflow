import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuizStep {
  id: string;
  quiz_id: string;
  name: string;
  order_index: number;
  step_type: string;
  settings: any;
  created_at: string;
}

interface SortableStepProps {
  step: QuizStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function SortableStep({
  step,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStepTypeBadge = (stepType: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      question: { label: "Pergunta", className: "bg-blue-500/20 text-blue-400" },
      info: { label: "Info", className: "bg-cyan-500/20 text-cyan-400" },
      form: { label: "Formulário", className: "bg-purple-500/20 text-purple-400" },
      result: { label: "Resultado", className: "bg-emerald-500/20 text-emerald-400" },
      redirect: { label: "Redirect", className: "bg-amber-500/20 text-amber-400" },
    };
    const config = typeConfig[stepType] || { label: stepType, className: "bg-muted" };
    return <Badge className={cn("text-xs", config.className)}>{config.label}</Badge>;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/50",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium truncate">{step.name}</span>
        </div>
        <div className="mt-1">{getStepTypeBadge(step.step_type)}</div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
