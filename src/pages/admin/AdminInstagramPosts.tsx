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

// Post content types
const postCategories = [
  { id: "feed", name: "Feed", description: "Posts para o feed principal" },
  { id: "stories", name: "Stories", description: "Stories verticais de 24h" },
  { id: "reels", name: "Reels", description: "Vídeos curtos verticais" },
  { id: "carousel", name: "Carrossel", description: "Múltiplas imagens em sequência" },
];

const postTemplates = [
  // Feed Templates
  { id: "feature", name: "Nova Funcionalidade", emoji: "🚀", category: "feed", prompt: "Crie um post moderno para redes sociais anunciando uma nova funcionalidade para a plataforma de pagamentos digitais GateFlow. Use verde (#10b981) como cor principal. Design limpo, visual profissional, estilo fintech. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "promo", name: "Promoção", emoji: "🔥", category: "feed", prompt: "Crie um post promocional chamativo para redes sociais da plataforma GateFlow. Destaque oferta especial ou desconto. Use verde (#10b981) com detalhes em laranja. Tipografia bold, chamativo. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "tip", name: "Dica do Dia", emoji: "💡", category: "feed", prompt: "Crie um post educativo para redes sociais com uma dica para empreendedores digitais. Design limpo para a plataforma GateFlow. Use paleta de cores verde (#10b981). Estilo informativo e profissional. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "testimonial", name: "Depoimento", emoji: "⭐", category: "feed", prompt: "Crie um post estilo depoimento/avaliação para a plataforma GateFlow. Use verde (#10b981) como destaque. Inclua elemento visual de aspas. Visual profissional e confiável. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "stats", name: "Estatísticas", emoji: "📊", category: "feed", prompt: "Crie um post estilo infográfico mostrando estatísticas impressionantes para a plataforma GateFlow. Use cor verde (#10b981). Visualização de dados, design moderno. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  
  // Stories Templates
  { id: "story-cta", name: "Call to Action", emoji: "👆", category: "stories", prompt: "Crie um Story vertical do Instagram com forte chamada para ação para a plataforma GateFlow. Inclua visual de 'Arraste para cima' ou swipe up. Tema verde (#10b981). Design moderno, chamativo, mobile-first. Proporção 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "story-countdown", name: "Countdown", emoji: "⏰", category: "stories", prompt: "Crie um Story vertical do Instagram com tema de contagem regressiva/urgência para lançamento ou promoção da GateFlow. Design empolgante com visual de timer. Detalhes em verde (#10b981). Formato vertical 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "story-poll", name: "Enquete", emoji: "📊", category: "stories", prompt: "Crie um template de Story vertical do Instagram com área para enquete/pergunta para a GateFlow. Design interativo incentivando engajamento. Tema verde (#10b981). Espaço limpo para opções de votação. Formato 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "story-quiz", name: "Quiz", emoji: "🧠", category: "stories", prompt: "Crie um template de Story vertical do Instagram de quiz para a GateFlow. Design divertido e educativo sobre pagamentos digitais. Cores da marca verde (#10b981). Espaço para pergunta e opções de resposta. Proporção 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "story-behind", name: "Bastidores", emoji: "🎬", category: "stories", prompt: "Crie um template de Story vertical do Instagram estilo bastidores para a GateFlow. Visual casual e autêntico. Detalhes sutis em verde (#10b981). Design de overlay moderno. Formato 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  
  // Reels Templates
  { id: "reels-hook", name: "Hook/Gancho", emoji: "🪝", category: "reels", prompt: "Crie uma capa/thumbnail vertical de Reels com um gancho forte para a GateFlow. Texto bold que captura atenção nos primeiros 3 segundos. Tema verde (#10b981). Visual cinematográfico e impactante. Formato vertical 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "reels-tutorial", name: "Tutorial", emoji: "📱", category: "reels", prompt: "Crie uma capa vertical de Reels tutorial para a GateFlow mostrando tema de passo a passo. Design educativo e limpo. Visual de passos numerados. Destaque verde (#10b981). Formato 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "reels-before-after", name: "Antes e Depois", emoji: "✨", category: "reels", prompt: "Crie uma capa vertical de Reels de comparação antes/depois para a GateFlow com tema de transformação. Conceito visual de tela dividida. Verde (#10b981) para o lado 'depois'. Contraste impactante. Proporção 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "reels-tips", name: "3 Dicas", emoji: "🎯", category: "reels", prompt: "Crie uma capa vertical de Reels mostrando formato '3 dicas' para a GateFlow. Visual de dicas numeradas, tipografia engajante. Tema verde (#10b981). Design moderno e trending. Formato vertical 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "reels-trending", name: "Trend", emoji: "📈", category: "reels", prompt: "Crie uma capa vertical de Reels trending para a GateFlow seguindo estética atual de redes sociais. Bold, moderno, energia jovem. Detalhes verde (#10b981). Alto contraste. Formato 9:16. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  
  // Carousel Templates  
  { id: "carousel-steps", name: "Passo a Passo", emoji: "1️⃣", category: "carousel", prompt: "Crie o slide 1 de um carrossel do Instagram tutorial para a GateFlow. Slide de título com tema 'Passo a Passo'. Design limpo e educativo. Cores da marca verde (#10b981). Indique que faz parte de uma série. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "carousel-myths", name: "Mitos vs Verdades", emoji: "❌", category: "carousel", prompt: "Crie o slide 1 de um carrossel do Instagram 'Mitos vs Verdades' para a GateFlow. Design bold com elementos visuais de X e ✓. Verde (#10b981) para verdade. Estilo engajante e informativo. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "carousel-list", name: "Top 5", emoji: "🏆", category: "carousel", prompt: "Crie o slide 1 de um carrossel do Instagram 'Top 5' para a GateFlow. Tema de lista numerada, visual de troféu/ranking. Detalhes verde (#10b981). Design moderno e compartilhável. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "carousel-compare", name: "Comparativo", emoji: "⚖️", category: "carousel", prompt: "Crie o slide 1 de um carrossel do Instagram comparativo GateFlow vs concorrentes. Design profissional de gráfico comparativo. Verde (#10b981) destacando benefícios da GateFlow. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
  { id: "carousel-story", name: "Storytelling", emoji: "📖", category: "carousel", prompt: "Crie o slide 1 de um carrossel do Instagram com formato storytelling para a GateFlow. Gancho narrativo, sensação de capítulo 1. Tema verde (#10b981). Início engajante que faz você deslizar. TODO TEXTO DEVE ESTAR EM PORTUGUÊS DO BRASIL CORRETO." },
];

const suggestedHashtags = [
  "#gateflow", "#pagamentosdigitais", "#infoprodutos", "#vendasonline", 
  "#empreendedorismo", "#marketingdigital", "#pix", "#fintech",
  "#ecommerce", "#negociosonline", "#vendas", "#checkout",
  "#reels", "#reelsbrasil", "#instagramreels", "#dicasdevendas"
];

const aspectRatios = [
  { id: "square", name: "Quadrado (1:1)", icon: Square, width: 1024, height: 1024, categories: ["feed", "carousel"] },
  { id: "portrait", name: "Portrait (4:5)", icon: RectangleVertical, width: 1024, height: 1280, categories: ["feed"] },
  { id: "story", name: "Stories/Reels (9:16)", icon: RectangleVertical, width: 1080, height: 1920, categories: ["stories", "reels"] },
];

export default function AdminInstagramPosts() {
  const [selectedCategory, setSelectedCategory] = useState(postCategories[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(postTemplates[0]);
  const [customText, setCustomText] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(["#gateflow", "#pagamentosdigitais"]);
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter templates and aspect ratios based on selected category
  const filteredTemplates = postTemplates.filter(t => t.category === selectedCategory.id);
  const filteredAspectRatios = aspectRatios.filter(r => r.categories.includes(selectedCategory.id));

  // Update aspect ratio when category changes
  const handleCategoryChange = (category: typeof postCategories[0]) => {
    setSelectedCategory(category);
    const newFilteredTemplates = postTemplates.filter(t => t.category === category.id);
    if (newFilteredTemplates.length > 0) {
      setSelectedTemplate(newFilteredTemplates[0]);
    }
    const newFilteredRatios = aspectRatios.filter(r => r.categories.includes(category.id));
    if (newFilteredRatios.length > 0) {
      setAspectRatio(newFilteredRatios[0]);
    }
  };

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

OBRIGATÓRIO - IDIOMA: Todo o texto na imagem DEVE estar em Português do Brasil (pt-BR) com ortografia CORRETA.
- NÃO use espanhol (palavras como: disponible, accesar, venedores, conversçon, aora, conór)
- NÃO use inglês
- Use ortografia correta do português brasileiro:
  * disponível (NÃO disponible)
  * acessar (NÃO accesar)  
  * vendedores (NÃO venedores)
  * conversão (NÃO conversçon)
  * conhecer (NÃO conór)
  * agora (NÃO aora)
  * receber (NÃO receiver)
  * começar (NÃO comezar)
  * pagamento (NÃO pagamiento)

Texto principal da imagem: "${customText}"
Proporção: ${aspectRatio.name}
Certifique-se de que o texto está legível e em destaque. Ultra alta resolução. Estilo post do Instagram.`;

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
            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  Formato do Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {postCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory.id === category.id ? "default" : "outline"}
                      className="h-auto py-3 flex flex-col gap-1"
                      onClick={() => handleCategoryChange(category)}
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground">{category.description}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                  {filteredTemplates.map((template) => (
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
                  Formato da Imagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {filteredAspectRatios.map((ratio) => {
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
                    aspectRatio.id === 'square' ? 'aspect-square' : 
                    aspectRatio.id === 'story' ? 'aspect-[9/16] max-h-[500px]' : 'aspect-[4/5]'
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
