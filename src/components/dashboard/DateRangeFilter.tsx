import { useState } from "react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DateRangeOption = 
  | "today" 
  | "yesterday" 
  | "currentMonth" 
  | "lastMonth" 
  | "year" 
  | "custom";

const dateRangeLabels: Record<DateRangeOption, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  currentMonth: "Mês Atual",
  lastMonth: "Mês Passado",
  year: "Ano",
  custom: "Personalizado",
};

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange, option: DateRangeOption) => void;
  selectedOption: DateRangeOption;
}

export function DateRangeFilter({ onRangeChange, selectedOption }: DateRangeFilterProps) {
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const getDateRangeForOption = (option: DateRangeOption): DateRange => {
    const now = new Date();
    
    switch (option) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case "currentMonth":
        return { from: startOfMonth(now), to: endOfDay(now) };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case "year":
        return { from: startOfYear(now), to: endOfDay(now) };
      case "custom":
        return customRange || { from: startOfDay(now), to: endOfDay(now) };
      default:
        return { from: startOfDay(now), to: endOfDay(now) };
    }
  };

  const handleOptionClick = (option: DateRangeOption) => {
    if (option === "custom") {
      setPopoverOpen(true);
    } else {
      const range = getDateRangeForOption(option);
      onRangeChange(range, option);
    }
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setCustomRange(range);
      onRangeChange({ from: startOfDay(range.from), to: endOfDay(range.to) }, "custom");
      setPopoverOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["today", "yesterday", "currentMonth", "lastMonth", "year"] as DateRangeOption[]).map((option) => (
        <Button
          key={option}
          variant={selectedOption === option ? "default" : "outline"}
          size="sm"
          onClick={() => handleOptionClick(option)}
          className={cn(
            "text-xs",
            selectedOption === option && "btn-primary-gradient"
          )}
        >
          {dateRangeLabels[option]}
        </Button>
      ))}
      
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedOption === "custom" ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs gap-1",
              selectedOption === "custom" && "btn-primary-gradient"
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {selectedOption === "custom" && customRange?.from && customRange?.to
              ? `${format(customRange.from, "dd/MM", { locale: ptBR })} - ${format(customRange.to, "dd/MM", { locale: ptBR })}`
              : "Personalizado"
            }
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={customRange}
            onSelect={(range) => handleCustomRangeSelect(range as DateRange | undefined)}
            numberOfMonths={2}
            locale={ptBR}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
