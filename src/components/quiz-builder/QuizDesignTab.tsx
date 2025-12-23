import { Palette, Type, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Quiz {
  id: string;
  name: string;
  primary_color: string;
  background_color: string;
  button_color: string;
  text_color: string;
  logo_url: string | null;
  show_logo: boolean;
  show_progress_bar: boolean;
  allow_back_navigation: boolean;
  font_family: string;
}

interface QuizDesignTabProps {
  quiz: Quiz;
  onUpdate: (updates: Partial<Quiz>) => void;
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Nunito", label: "Nunito" },
];

const PRESET_THEMES = [
  {
    name: "Padrão",
    primary: "#10b981",
    background: "#ffffff",
    button: "#10b981",
    text: "#1f2937",
  },
  {
    name: "Dark",
    primary: "#3b82f6",
    background: "#0f172a",
    button: "#3b82f6",
    text: "#f8fafc",
  },
  {
    name: "Sunset",
    primary: "#f97316",
    background: "#fffbeb",
    button: "#f97316",
    text: "#78350f",
  },
  {
    name: "Purple",
    primary: "#8b5cf6",
    background: "#faf5ff",
    button: "#8b5cf6",
    text: "#581c87",
  },
  {
    name: "Ocean",
    primary: "#0ea5e9",
    background: "#f0f9ff",
    button: "#0ea5e9",
    text: "#0c4a6e",
  },
  {
    name: "Rose",
    primary: "#f43f5e",
    background: "#fff1f2",
    button: "#f43f5e",
    text: "#881337",
  },
];

export default function QuizDesignTab({ quiz, onUpdate }: QuizDesignTabProps) {
  function applyTheme(theme: typeof PRESET_THEMES[0]) {
    onUpdate({
      primary_color: theme.primary,
      background_color: theme.background,
      button_color: theme.button,
      text_color: theme.text,
    });
  }

  return (
    <div className="h-full flex">
      {/* Settings Panel */}
      <ScrollArea className="w-80 border-r border-border bg-card/50 p-4">
        <div className="space-y-6">
          {/* Theme Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Temas Prontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => applyTheme(theme)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span className="text-xs">{theme.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={quiz.primary_color}
                    onChange={(e) => onUpdate({ primary_color: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={quiz.primary_color}
                    onChange={(e) => onUpdate({ primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={quiz.background_color}
                    onChange={(e) => onUpdate({ background_color: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={quiz.background_color}
                    onChange={(e) => onUpdate({ background_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Cor dos Botões</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={quiz.button_color}
                    onChange={(e) => onUpdate({ button_color: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={quiz.button_color}
                    onChange={(e) => onUpdate({ button_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={quiz.text_color}
                    onChange={(e) => onUpdate({ text_color: e.target.value })}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={quiz.text_color}
                    onChange={(e) => onUpdate({ text_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                Tipografia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs">Fonte</Label>
                <Select 
                  value={quiz.font_family} 
                  onValueChange={(value) => onUpdate({ font_family: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">URL do Logo</Label>
                <Input
                  placeholder="https://..."
                  value={quiz.logo_url || ""}
                  onChange={(e) => onUpdate({ logo_url: e.target.value || null })}
                />
              </div>
              
              {quiz.logo_url && (
                <div className="relative inline-block">
                  <img 
                    src={quiz.logo_url} 
                    alt="Logo preview" 
                    className="h-12 object-contain rounded"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5"
                    onClick={() => onUpdate({ logo_url: null })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs">Mostrar Logo</Label>
                <Switch
                  checked={quiz.show_logo}
                  onCheckedChange={(checked) => onUpdate({ show_logo: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Opções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Barra de Progresso</Label>
                  <p className="text-xs text-muted-foreground">Mostra o progresso do quiz</p>
                </div>
                <Switch
                  checked={quiz.show_progress_bar}
                  onCheckedChange={(checked) => onUpdate({ show_progress_bar: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Permitir Voltar</Label>
                  <p className="text-xs text-muted-foreground">Usuário pode voltar nas etapas</p>
                </div>
                <Switch
                  checked={quiz.allow_back_navigation}
                  onCheckedChange={(checked) => onUpdate({ allow_back_navigation: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Preview */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold mb-4 text-center text-muted-foreground">
            Preview do Design
          </h3>
          <div
            className="rounded-xl overflow-hidden shadow-lg border"
            style={{ 
              backgroundColor: quiz.background_color,
              fontFamily: quiz.font_family,
            }}
          >
            {/* Header */}
            {quiz.show_logo && quiz.logo_url && (
              <div className="p-4 flex justify-center border-b" style={{ borderColor: `${quiz.primary_color}20` }}>
                <img src={quiz.logo_url} alt="Logo" className="h-8 object-contain" />
              </div>
            )}

            {/* Progress Bar */}
            {quiz.show_progress_bar && (
              <div className="px-4 pt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: "40%", backgroundColor: quiz.primary_color }}
                  />
                </div>
                <p className="text-xs text-center mt-1" style={{ color: `${quiz.text_color}80` }}>
                  Etapa 2 de 5
                </p>
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-6">
              <h2 
                className="text-xl font-bold text-center"
                style={{ color: quiz.text_color }}
              >
                Qual o seu objetivo principal?
              </h2>

              <div className="space-y-3">
                {["Emagrecer", "Ganhar massa muscular", "Melhorar condicionamento"].map((option) => (
                  <div
                    key={option}
                    className="p-4 rounded-lg border-2 cursor-pointer transition-colors hover:shadow-md"
                    style={{ 
                      borderColor: `${quiz.primary_color}30`,
                      color: quiz.text_color,
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>

              <button
                className="w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: quiz.button_color,
                  color: quiz.background_color,
                }}
              >
                Continuar
              </button>

              {quiz.allow_back_navigation && (
                <button
                  className="w-full text-sm"
                  style={{ color: `${quiz.text_color}60` }}
                >
                  ← Voltar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
