import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LessonProgressProps {
  isCompleted: boolean;
  onClick: () => void;
  className?: string;
}

export function LessonCheckbox({ isCompleted, onClick, className }: LessonProgressProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
        isCompleted
          ? "bg-primary text-primary-foreground"
          : "bg-muted hover:bg-muted/80",
        className
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <Circle className="h-5 w-5" />
      )}
    </button>
  );
}

interface ModuleProgressProps {
  completedCount: number;
  totalCount: number;
}

export function ModuleProgress({ completedCount, totalCount }: ModuleProgressProps) {
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <Progress value={percentage} className="h-2 w-20" />
      <span className="text-xs text-muted-foreground">
        {completedCount}/{totalCount}
      </span>
    </div>
  );
}
