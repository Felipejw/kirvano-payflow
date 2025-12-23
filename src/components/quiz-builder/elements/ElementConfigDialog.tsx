import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizElement {
  id: string;
  step_id: string;
  element_type: string;
  order_index: number;
  content: any;
  styles: any;
  created_at: string;
}

interface ElementConfigDialogProps {
  element: QuizElement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<QuizElement>) => void;
}

const ELEMENT_LABELS: Record<string, string> = {
  title: "Título",
  text: "Texto",
  image: "Imagem",
  video: "Vídeo",
  options: "Opções",
  button: "Botão",
  input: "Campo de Entrada",
  timer: "Timer",
  testimonial: "Depoimento",
  alert: "Alerta",
  progress: "Barra de Progresso",
  confetti: "Confetti",
  loading: "Loading",
  rating: "Avaliação",
  slider: "Slider",
  image_options: "Opções com Imagem",
  date_picker: "Seletor de Data",
  emoji_rating: "Avaliação Emoji",
  divider: "Divisor",
  icon_list: "Lista com Ícones",
  countdown: "Countdown",
};

const FONT_SIZES = [
  { value: "sm", label: "Pequeno" },
  { value: "base", label: "Normal" },
  { value: "lg", label: "Grande" },
  { value: "xl", label: "Extra Grande" },
  { value: "2xl", label: "2x Grande" },
  { value: "3xl", label: "3x Grande" },
];

const ALIGNMENTS = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Direita" },
];

export default function ElementConfigDialog({
  element,
  open,
  onOpenChange,
  onSave,
}: ElementConfigDialogProps) {
  const [content, setContent] = useState<Record<string, any>>({});
  const [styles, setStyles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (element) {
      setContent(element.content || {});
      setStyles(element.styles || {});
    }
  }, [element]);

  if (!element) return null;

  const handleSave = () => {
    onSave({ content, styles });
    onOpenChange(false);
  };

  const updateContent = (key: string, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const updateStyles = (key: string, value: any) => {
    setStyles(prev => ({ ...prev, [key]: value }));
  };

  const renderContentTab = () => {
    switch (element.element_type) {
      case "title":
      case "text":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texto</Label>
              <Textarea
                value={content.text || ""}
                onChange={(e) => updateContent("text", e.target.value)}
                placeholder="Digite o texto..."
                rows={element.element_type === "text" ? 4 : 2}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={content.url || ""}
                onChange={(e) => updateContent("url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto Alternativo</Label>
              <Input
                value={content.alt || ""}
                onChange={(e) => updateContent("alt", e.target.value)}
                placeholder="Descrição da imagem"
              />
            </div>
            <div className="space-y-2">
              <Label>Largura Máxima (px)</Label>
              <Input
                type="number"
                value={content.maxWidth || ""}
                onChange={(e) => updateContent("maxWidth", e.target.value)}
                placeholder="400"
              />
            </div>
          </div>
        );

      case "video":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Vídeo</Label>
              <Input
                value={content.url || ""}
                onChange={(e) => updateContent("url", e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoplay</Label>
              <Switch
                checked={content.autoplay || false}
                onCheckedChange={(checked) => updateContent("autoplay", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mudo</Label>
              <Switch
                checked={content.muted || false}
                onCheckedChange={(checked) => updateContent("muted", checked)}
              />
            </div>
          </div>
        );

      case "options":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Permitir Múltiplas Escolhas</Label>
              <Switch
                checked={content.multiple || false}
                onCheckedChange={(checked) => updateContent("multiple", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={content.layout || "vertical"}
                onValueChange={(value) => updateContent("layout", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="grid">Grade (2 colunas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opções</Label>
              <div className="space-y-2">
                {(content.options || []).map((option: any, index: number) => (
                  <div key={option.id || index} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...(content.options || [])];
                        newOptions[index] = { ...option, text: e.target.value };
                        updateContent("options", newOptions);
                      }}
                      placeholder={`Opção ${index + 1}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const newOptions = (content.options || []).filter((_: any, i: number) => i !== index);
                        updateContent("options", newOptions);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOption = {
                      id: String(Date.now()),
                      text: `Opção ${(content.options || []).length + 1}`,
                      value: String((content.options || []).length + 1),
                    };
                    updateContent("options", [...(content.options || []), newOption]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                value={content.text || ""}
                onChange={(e) => updateContent("text", e.target.value)}
                placeholder="Continuar"
              />
            </div>
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select
                value={content.action || "next"}
                onValueChange={(value) => updateContent("action", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Próxima Etapa</SelectItem>
                  <SelectItem value="redirect">Redirecionar</SelectItem>
                  <SelectItem value="submit">Enviar Formulário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {content.action === "redirect" && (
              <div className="space-y-2">
                <Label>URL de Redirecionamento</Label>
                <Input
                  value={content.url || ""}
                  onChange={(e) => updateContent("url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        );

      case "input":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={content.label || ""}
                onChange={(e) => updateContent("label", e.target.value)}
                placeholder="Nome do campo"
              />
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={content.placeholder || ""}
                onChange={(e) => updateContent("placeholder", e.target.value)}
                placeholder="Texto de exemplo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Campo</Label>
              <Select
                value={content.type || "text"}
                onValueChange={(value) => updateContent("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Telefone</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="textarea">Área de Texto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Obrigatório</Label>
              <Switch
                checked={content.required ?? true}
                onCheckedChange={(checked) => updateContent("required", checked)}
              />
            </div>
          </div>
        );

      case "timer":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duração (segundos)</Label>
              <Input
                type="number"
                value={content.duration || 60}
                onChange={(e) => updateContent("duration", parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Avançar automaticamente</Label>
              <Switch
                checked={content.autoAdvance || false}
                onCheckedChange={(checked) => updateContent("autoAdvance", checked)}
              />
            </div>
          </div>
        );

      case "testimonial":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={content.name || ""}
                onChange={(e) => updateContent("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo/Função</Label>
              <Input
                value={content.role || ""}
                onChange={(e) => updateContent("role", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Depoimento</Label>
              <Textarea
                value={content.text || ""}
                onChange={(e) => updateContent("text", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Avatar</Label>
              <Input
                value={content.avatar || ""}
                onChange={(e) => updateContent("avatar", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        );

      case "alert":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Alerta</Label>
              <Select
                value={content.type || "info"}
                onValueChange={(value) => updateContent("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={content.text || ""}
                onChange={(e) => updateContent("text", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        );

      case "progress":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor (%)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[content.value || 0]}
                  onValueChange={([value]) => updateContent("value", value)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">{content.value || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar Label</Label>
              <Switch
                checked={content.showLabel || false}
                onCheckedChange={(checked) => updateContent("showLabel", checked)}
              />
            </div>
          </div>
        );

      case "confetti":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gatilho</Label>
              <Select
                value={content.trigger || "onLoad"}
                onValueChange={(value) => updateContent("trigger", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onLoad">Ao Carregar</SelectItem>
                  <SelectItem value="onClick">Ao Clicar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duração (ms)</Label>
              <Input
                type="number"
                value={content.duration || 3000}
                onChange={(e) => updateContent("duration", parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case "loading":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input
                value={content.text || ""}
                onChange={(e) => updateContent("text", e.target.value)}
                placeholder="Carregando..."
              />
            </div>
            <div className="space-y-2">
              <Label>Duração (ms)</Label>
              <Input
                type="number"
                value={content.duration || 2000}
                onChange={(e) => updateContent("duration", parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Avaliação</Label>
              <Select
                value={content.ratingType || "stars"}
                onValueChange={(value) => updateContent("ratingType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stars">Estrelas</SelectItem>
                  <SelectItem value="numbers">Números</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Select
                value={String(content.count || 5)}
                onValueChange={(value) => updateContent("count", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={content.label || ""}
                onChange={(e) => updateContent("label", e.target.value)}
                placeholder="Como você avalia?"
              />
            </div>
          </div>
        );

      case "slider":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor Mínimo</Label>
              <Input
                type="number"
                value={content.min ?? 0}
                onChange={(e) => updateContent("min", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Máximo</Label>
              <Input
                type="number"
                value={content.max ?? 100}
                onChange={(e) => updateContent("max", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Passo</Label>
              <Input
                type="number"
                value={content.step ?? 1}
                onChange={(e) => updateContent("step", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Padrão</Label>
              <Input
                type="number"
                value={content.defaultValue ?? 50}
                onChange={(e) => updateContent("defaultValue", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Label Mínimo</Label>
              <Input
                value={content.minLabel || ""}
                onChange={(e) => updateContent("minLabel", e.target.value)}
                placeholder="Pouco"
              />
            </div>
            <div className="space-y-2">
              <Label>Label Máximo</Label>
              <Input
                value={content.maxLabel || ""}
                onChange={(e) => updateContent("maxLabel", e.target.value)}
                placeholder="Muito"
              />
            </div>
          </div>
        );

      case "image_options":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Múltipla Escolha</Label>
              <Switch
                checked={content.multiple || false}
                onCheckedChange={(checked) => updateContent("multiple", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Colunas</Label>
              <Select
                value={String(content.columns || 2)}
                onValueChange={(value) => updateContent("columns", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 colunas</SelectItem>
                  <SelectItem value="3">3 colunas</SelectItem>
                  <SelectItem value="4">4 colunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opções</Label>
              <div className="space-y-3">
                {(content.options || []).map((option: any, index: number) => (
                  <div key={option.id || index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Opção {index + 1}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const newOptions = (content.options || []).filter((_: any, i: number) => i !== index);
                          updateContent("options", newOptions);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = [...(content.options || [])];
                        newOptions[index] = { ...option, text: e.target.value };
                        updateContent("options", newOptions);
                      }}
                      placeholder="Texto"
                    />
                    <Input
                      value={option.imageUrl || ""}
                      onChange={(e) => {
                        const newOptions = [...(content.options || [])];
                        newOptions[index] = { ...option, imageUrl: e.target.value };
                        updateContent("options", newOptions);
                      }}
                      placeholder="URL da imagem"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOption = {
                      id: String(Date.now()),
                      text: `Opção ${(content.options || []).length + 1}`,
                      value: String((content.options || []).length + 1),
                      imageUrl: "",
                    };
                    updateContent("options", [...(content.options || []), newOption]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          </div>
        );

      case "date_picker":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={content.label || ""}
                onChange={(e) => updateContent("label", e.target.value)}
                placeholder="Data de nascimento"
              />
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={content.placeholder || ""}
                onChange={(e) => updateContent("placeholder", e.target.value)}
                placeholder="Selecione uma data"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Obrigatório</Label>
              <Switch
                checked={content.required ?? true}
                onCheckedChange={(checked) => updateContent("required", checked)}
              />
            </div>
          </div>
        );

      case "emoji_rating":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={content.label || ""}
                onChange={(e) => updateContent("label", e.target.value)}
                placeholder="Como você está se sentindo?"
              />
            </div>
            <div className="space-y-2">
              <Label>Emojis (separados por vírgula)</Label>
              <Input
                value={content.emojis?.join(",") || "😢,😕,😐,🙂,😄"}
                onChange={(e) => updateContent("emojis", e.target.value.split(","))}
              />
            </div>
          </div>
        );

      case "divider":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estilo</Label>
              <Select
                value={content.style || "solid"}
                onValueChange={(value) => updateContent("style", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólida</SelectItem>
                  <SelectItem value="dashed">Tracejada</SelectItem>
                  <SelectItem value="dotted">Pontilhada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Margem Vertical</Label>
              <Select
                value={content.spacing || "md"}
                onValueChange={(value) => updateContent("spacing", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequena</SelectItem>
                  <SelectItem value="md">Média</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "icon_list":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Ícone</Label>
              <Select
                value={content.iconType || "check"}
                onValueChange={(value) => updateContent("iconType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="star">Estrela</SelectItem>
                  <SelectItem value="arrow">Seta</SelectItem>
                  <SelectItem value="bullet">Bolinha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Itens</Label>
              <div className="space-y-2">
                {(content.items || []).map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newItems = [...(content.items || [])];
                        newItems[index] = e.target.value;
                        updateContent("items", newItems);
                      }}
                      placeholder={`Item ${index + 1}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const newItems = (content.items || []).filter((_: string, i: number) => i !== index);
                        updateContent("items", newItems);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateContent("items", [...(content.items || []), ""]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          </div>
        );

      case "countdown":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data Alvo</Label>
              <Input
                type="datetime-local"
                value={content.targetDate || ""}
                onChange={(e) => updateContent("targetDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto (opcional)</Label>
              <Input
                value={content.text || ""}
                onChange={(e) => updateContent("text", e.target.value)}
                placeholder="Oferta termina em:"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar Dias</Label>
              <Switch
                checked={content.showDays ?? true}
                onCheckedChange={(checked) => updateContent("showDays", checked)}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            Este elemento não possui configurações de conteúdo.
          </div>
        );
    }
  };

  const renderStylesTab = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Alinhamento</Label>
          <Select
            value={styles.alignment || "center"}
            onValueChange={(value) => updateStyles("alignment", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALIGNMENTS.map(align => (
                <SelectItem key={align.value} value={align.value}>{align.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tamanho da Fonte</Label>
          <Select
            value={styles.fontSize || "base"}
            onValueChange={(value) => updateStyles("fontSize", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map(size => (
                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={styles.textColor || "#000000"}
              onChange={(e) => updateStyles("textColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={styles.textColor || ""}
              onChange={(e) => updateStyles("textColor", e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={styles.backgroundColor || "#ffffff"}
              onChange={(e) => updateStyles("backgroundColor", e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={styles.backgroundColor || ""}
              onChange={(e) => updateStyles("backgroundColor", e.target.value)}
              placeholder="transparent"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Margem Superior</Label>
          <Select
            value={styles.marginTop || "0"}
            onValueChange={(value) => updateStyles("marginTop", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Nenhuma</SelectItem>
              <SelectItem value="2">Pequena</SelectItem>
              <SelectItem value="4">Média</SelectItem>
              <SelectItem value="6">Grande</SelectItem>
              <SelectItem value="8">Extra Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Margem Inferior</Label>
          <Select
            value={styles.marginBottom || "0"}
            onValueChange={(value) => updateStyles("marginBottom", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Nenhuma</SelectItem>
              <SelectItem value="2">Pequena</SelectItem>
              <SelectItem value="4">Média</SelectItem>
              <SelectItem value="6">Grande</SelectItem>
              <SelectItem value="8">Extra Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Raio da Borda</Label>
          <Select
            value={styles.borderRadius || "none"}
            onValueChange={(value) => updateStyles("borderRadius", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              <SelectItem value="sm">Pequeno</SelectItem>
              <SelectItem value="md">Médio</SelectItem>
              <SelectItem value="lg">Grande</SelectItem>
              <SelectItem value="full">Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Peso da Fonte</Label>
          <Select
            value={styles.fontWeight || "normal"}
            onValueChange={(value) => updateStyles("fontWeight", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="semibold">Semi-Bold</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderLogicTab = () => {
    const hasLogic = ["options", "rating", "slider", "emoji_rating", "image_options"].includes(element.element_type);

    if (!hasLogic) {
      return (
        <div className="text-center text-muted-foreground py-8">
          Este elemento não suporta configurações de lógica.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Configure a lógica condicional para este elemento. Você pode definir para qual etapa o quiz 
            deve ir baseado na resposta selecionada.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label>Salvar resposta como pontuação</Label>
          <Switch
            checked={content.saveAsScore || false}
            onCheckedChange={(checked) => updateContent("saveAsScore", checked)}
          />
        </div>

        {element.element_type === "options" && (
          <div className="space-y-3">
            <Label>Pontuação por Opção</Label>
            {(content.options || []).map((option: any, index: number) => (
              <div key={option.id || index} className="flex items-center gap-2">
                <span className="text-sm flex-1 truncate">{option.text}</span>
                <Input
                  type="number"
                  value={option.score ?? 0}
                  onChange={(e) => {
                    const newOptions = [...(content.options || [])];
                    newOptions[index] = { ...option, score: parseInt(e.target.value) || 0 };
                    updateContent("options", newOptions);
                  }}
                  className="w-20"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configurar {ELEMENT_LABELS[element.element_type] || element.element_type}</DialogTitle>
          <DialogDescription>
            Personalize o conteúdo, estilo e lógica deste elemento
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="styles">Estilos</TabsTrigger>
            <TabsTrigger value="logic">Lógica</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="content" className="mt-0 pr-4">
              {renderContentTab()}
            </TabsContent>
            <TabsContent value="styles" className="mt-0 pr-4">
              {renderStylesTab()}
            </TabsContent>
            <TabsContent value="logic" className="mt-0 pr-4">
              {renderLogicTab()}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
