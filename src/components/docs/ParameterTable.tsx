import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface ParameterTableProps {
  title?: string;
  parameters: Parameter[];
  className?: string;
}

export function ParameterTable({ title, parameters, className }: ParameterTableProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      )}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Parâmetro</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((param, index) => (
              <tr key={param.name} className={cn(index !== parameters.length - 1 && "border-b border-border")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{param.name}</code>
                    {param.required && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rose-500 border-rose-500/20">
                        obrigatório
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-purple-400 font-mono">{param.type}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {param.description}
                  {param.example && (
                    <span className="block mt-1 text-xs text-muted-foreground/70">
                      Ex: <code className="bg-muted px-1 rounded">{param.example}</code>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
