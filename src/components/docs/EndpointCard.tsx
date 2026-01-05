import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  children?: React.ReactNode;
}

const methodColors = {
  GET: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  DELETE: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  PATCH: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function EndpointCard({ method, path, description, children }: EndpointCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge 
            variant="outline" 
            className={cn("font-mono font-bold px-2.5 py-0.5", methodColors[method])}
          >
            {method}
          </Badge>
          <code className="text-sm font-mono font-medium">{path}</code>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {children && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
