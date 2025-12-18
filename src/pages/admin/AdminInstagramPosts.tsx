import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Instagram, 
  Sparkles, 
  Download, 
  Copy, 
  RefreshCw,
  Image as ImageIcon,
  Type,
  Hash,
  Palette,
  Square,
  RectangleVertical,
  Loader2,
  Check,
  Wand2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const postTemplates = [
  { id: "feature", name: "Nova Funcionalidade", emoji: "🚀", prompt: "Create a modern social media post announcing a new feature for a digital payment platform called GateFlow. Use green (#10b981) as the primary color. Clean design, professional look, fintech style." },
  { id: "promo", name: "Promoção", emoji: "🔥", prompt: "Create an eye-catching promotional social media post for a digital payment platform called GateFlow. Highlight special offer or discount. Use green (#10b981) and orange accents. Bold typography, attention-grabbing." },
  { id: "tip", name: "Dica do Dia", emoji: "💡", prompt: "Create an educational social media post with a tip for digital entrepreneurs. Clean design for GateFlow platform. Use green (#10b981) color palette. Informative and professional style." },
  { id: "testimonial", name: "Depoimento", emoji: "⭐", prompt: "Create a testimonial/review style social media post for GateFlow payment platform. Use green (#10b981) as accent. Include quote marks design element. Professional and trustworthy look." },
  { id: "stats", name: "Estatísticas", emoji: "📊", prompt: "Create an infographic-style social media post showing impressive statistics for GateFlow digital payment platform. Use green (#10b981) color. Data visualization, modern design." },
];

const suggestedHashtags = [
  "#gateflow", "#pagamentosdigitais", "#infoprodutos", "#vendasonline", 
  "#empreendedorismo", "#marketingdigital", "#pix", "#fintech",
  "#ecommerce", "#negociosonline", "#vendas", "#checkout"
];

const aspectRatios = [
  { id: "square", name: "Quadrado (1:1)", icon: Square, width: 1024, height: 1024 },
  { id: "portrait", name: "Portrait (4:5)", icon: RectangleVertical, width: 1024, height: 1280 },
];

export default function AdminInstagramPosts() {
  const [selectedTemplate, setSelectedTemplate] = useState(postTemplates[0]);
  const [customText, setCustomText] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(["#gateflow", "#pagamentosdigitais"]);
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const generateImage = async () => {
    if (!customText.trim()) {
      toast.error("Digite o texto principal do post");
      return;
    }

    setIsGenerating(true);
    
    try {
      const fullPrompt = `${selectedTemplate.prompt} 
Main text on the image: "${customText}"
Aspect ratio: ${aspectRatio.name}
Make sure the text is readable and prominent. Ultra high resolution. Instagram post style.`;

      const { data, error } = await supabase.functions.invoke('generate-instagram-post', {
        body: { 
          prompt: fullPrompt,
          width: aspectRatio.width,
          height: aspectRatio.height
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("Imagem gerada com sucesso!");
      } else {
        throw new Error("Falha ao gerar imagem");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast.error(error.message || "Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCaption = () => {
    const fullCaption = `${caption}\n\n${selectedHashtags.join(" ")}`;
    navigator.clipboard.writeText(fullCaption);
    setCopied(true);
    toast.success("Legenda copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `gateflow-post-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagem baixada!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Instagram className="h-8 w-8 text-pink-500" />
              Criador de Posts Instagram
            </h1>
            <p className="text-muted-foreground">Crie posts profissionais com IA para divulgar a plataforma</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5" />
                  Tipo de Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {postTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate.id === template.id ? "default" : "outline"}
                      className="h-auto py-3 flex flex-col gap-1"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <span className="text-xl">{template.emoji}</span>
                      <span className="text-xs">{template.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5" />
                  Formato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {aspectRatios.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                      <Button
                        key={ratio.id}
                        variant={aspectRatio.id === ratio.id ? "default" : "outline"}
                        className="flex-1 h-auto py-3 flex flex-col gap-1"
                        onClick={() => setAspectRatio(ratio)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{ratio.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Main Text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Type className="h-5 w-5" />
                  Texto Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Texto que aparecerá na imagem</Label>
                  <Textarea
                    placeholder="Ex: Taxas a partir de 4,99% + R$1,00 por venda!"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Legenda do Post</Label>
                  <Textarea
                    placeholder="Escreva a legenda que acompanhará o post..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hashtags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hash className="h-5 w-5" />
                  Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {suggestedHashtags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedHashtags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleHashtag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {selectedHashtags.length} hashtags selecionadas
                </p>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button 
              className="w-full h-14 text-lg gap-3" 
              variant="gradient"
              onClick={generateImage}
              disabled={isGenerating || !customText.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Gerar Imagem com IA
                </>
              )}
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  Preview do Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview */}
                <div 
                  className={`relative bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center ${
                    aspectRatio.id === 'square' ? 'aspect-square' : 'aspect-[4/5]'
                  }`}
                >
                  {generatedImage ? (
                    <img 
                      src={generatedImage} 
                      alt="Generated post" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        Sua imagem aparecerá aqui
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        Clique em "Gerar Imagem com IA" para criar
                      </p>
                    </div>
                  )}
                  
                  {isGenerating && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-3" />
                        <p className="text-sm text-muted-foreground">Gerando imagem...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Caption Preview */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {caption || "Sua legenda aparecerá aqui..."}
                  </p>
                  {selectedHashtags.length > 0 && (
                    <p className="text-sm text-primary mt-2">
                      {selectedHashtags.join(" ")}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={copyCaption}
                    disabled={!caption && selectedHashtags.length === 0}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado!" : "Copiar Legenda"}
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1 gap-2"
                    onClick={downloadImage}
                    disabled={!generatedImage}
                  >
                    <Download className="h-4 w-4" />
                    Baixar Imagem
                  </Button>
                </div>

                {/* Tips */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <p className="text-sm font-medium mb-2">💡 Dicas para um bom post:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Use textos curtos e diretos na imagem</li>
                    <li>• Poste entre 18h e 21h para maior alcance</li>
                    <li>• Use entre 5-10 hashtags relevantes</li>
                    <li>• Interaja com comentários rapidamente</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
