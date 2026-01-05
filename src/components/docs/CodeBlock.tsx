import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

// Simple syntax highlighting for JSON and JavaScript
function highlightCode(code: string, language: string): string {
  if (language === "json") {
    return code
      .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-emerald-400">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="text-amber-400">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="text-rose-400">$1</span>');
  }
  
  if (language === "javascript" || language === "js") {
    return code
      .replace(/\/\/.*/g, '<span class="text-muted-foreground">$&</span>')
      .replace(/(['"`])([^'"`]*)\1/g, '<span class="text-emerald-400">$&</span>')
      .replace(/\b(const|let|var|function|async|await|return|if|else|try|catch|new|class|export|import|from)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-rose-400">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-amber-400">$1</span>');
  }
  
  if (language === "bash" || language === "curl") {
    return code
      .replace(/^(curl|POST|GET|DELETE)/gm, '<span class="text-emerald-400">$1</span>')
      .replace(/(-[HXd])\s/g, '<span class="text-purple-400">$1</span> ')
      .replace(/(['"])([^'"]*)\1/g, '<span class="text-amber-400">$&</span>');
  }
  
  if (language === "python") {
    return code
      .replace(/#.*/g, '<span class="text-muted-foreground">$&</span>')
      .replace(/(['"])([^'"]*)\1/g, '<span class="text-emerald-400">$&</span>')
      .replace(/\b(def|class|import|from|return|if|else|try|except|async|await|True|False|None)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-amber-400">$1</span>');
  }
  
  return code;
}

export function CodeBlock({ code, language = "javascript", showLineNumbers = true, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const lines = code.trim().split("\n");
  const highlightedCode = highlightCode(code.trim(), language);
  
  return (
    <div className={cn("relative group rounded-lg overflow-hidden border border-border bg-muted/30", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono">
          {showLineNumbers ? (
            <code className="flex">
              <span className="select-none text-muted-foreground pr-4 text-right" style={{ minWidth: "2rem" }}>
                {lines.map((_, i) => (
                  <span key={i} className="block">{i + 1}</span>
                ))}
              </span>
              <span 
                className="flex-1"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </code>
          ) : (
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          )}
        </pre>
      </div>
    </div>
  );
}
