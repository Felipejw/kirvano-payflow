import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Key, 
  Webhook, 
  AlertCircle, 
  Code2, 
  Zap,
  CreditCard,
  Search,
  List
} from "lucide-react";

interface DocsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: "introduction", label: "Introdução", icon: BookOpen },
  { id: "authentication", label: "Autenticação", icon: Key },
  { id: "create-charge", label: "Criar Cobrança", icon: CreditCard },
  { id: "check-status", label: "Consultar Status", icon: Search },
  { id: "list-charges", label: "Listar Cobranças", icon: List },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "errors", label: "Códigos de Erro", icon: AlertCircle },
  { id: "examples", label: "Exemplos Completos", icon: Code2 },
  { id: "sdk", label: "SDK JavaScript", icon: Zap },
];

export function DocsSidebar({ activeSection, onSectionChange }: DocsSidebarProps) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left",
              isActive 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
