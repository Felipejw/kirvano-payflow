import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp, formatAnimatedValue } from "@/hooks/useCountUp";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatsCardProps {
  title: string;
  value: string;
  numericValue?: number;
  valueType?: "currency" | "number" | "percent";
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  tooltip?: string;
}

export function StatsCard({ 
  title, 
  value, 
  numericValue,
  valueType = "number",
  change, 
  changeType = "neutral", 
  icon: Icon,
  iconColor = "text-primary",
  tooltip
}: StatsCardProps) {
  // Use count-up animation if numeric value is provided
  const animatedValue = useCountUp(numericValue ?? 0, { duration: 1200 });
  const displayValue = numericValue !== undefined 
    ? formatAnimatedValue(animatedValue, valueType)
    : value;

  const cardContent = (
    <div className="stat-card group hover:border-primary/30 transition-all duration-300 cursor-default">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tabular-nums">{displayValue}</p>
          {change && (
            <p className={cn(
              "text-sm font-medium flex items-center gap-1",
              changeType === "positive" && "text-accent",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {changeType === "positive" && "↑"}
              {changeType === "negative" && "↓"}
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl bg-secondary/50 group-hover:scale-110 transition-transform duration-300",
          iconColor
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className="max-w-xs bg-popover border border-border shadow-lg"
          >
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}