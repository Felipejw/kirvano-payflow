import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { FileQuestion, Info, FormInput, Trophy, ExternalLink, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StepNodeData {
  name: string;
  stepType: string;
  orderIndex: number;
  isStart?: boolean;
}

const stepTypeConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  question: { 
    icon: <FileQuestion className="h-4 w-4" />, 
    label: "Pergunta", 
    className: "border-blue-500/50 bg-blue-500/10" 
  },
  info: { 
    icon: <Info className="h-4 w-4" />, 
    label: "Info", 
    className: "border-cyan-500/50 bg-cyan-500/10" 
  },
  form: { 
    icon: <FormInput className="h-4 w-4" />, 
    label: "Formulário", 
    className: "border-purple-500/50 bg-purple-500/10" 
  },
  result: { 
    icon: <Trophy className="h-4 w-4" />, 
    label: "Resultado", 
    className: "border-emerald-500/50 bg-emerald-500/10" 
  },
  redirect: { 
    icon: <ExternalLink className="h-4 w-4" />, 
    label: "Redirect", 
    className: "border-amber-500/50 bg-amber-500/10" 
  },
};

function StepNode({ data, selected }: NodeProps<StepNodeData>) {
  const config = stepTypeConfig[data.stepType] || stepTypeConfig.question;

  return (
    <div
      className={cn(
        "relative min-w-[200px] rounded-lg border-2 bg-card shadow-lg transition-all",
        config.className,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Drag handle indicator */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-50">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Start badge */}
      {data.isStart && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-[10px] px-2">
            INÍCIO
          </Badge>
        </div>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
            {String(data.orderIndex + 1).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {config.icon}
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        </div>
        
        <h3 className="font-medium text-sm text-foreground leading-tight">
          {data.name}
        </h3>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
}

export default memo(StepNode);
