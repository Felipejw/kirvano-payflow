import { Settings, Globe, Code, Link2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Quiz {
  id: string;
  name: string;
  description: string | null;
  custom_slug: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  facebook_pixel: string | null;
  google_analytics: string | null;
  tiktok_pixel: string | null;
}

interface QuizSettingsTabProps {
  quiz: Quiz;
  onUpdate: (updates: Partial<Quiz>) => void;
}

export default function QuizSettingsTab({ quiz, onUpdate }: QuizSettingsTabProps) {
  const [copied, setCopied] = useState(false);

  const quizUrl = `${window.location.origin}/?page=quiz&s=${quiz.custom_slug || quiz.id}`;

  function copyLink() {
    navigator.clipboard.writeText(quizUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return (
    <div className="h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Quiz</Label>
                <Input
                  value={quiz.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="Nome do seu quiz"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={quiz.description || ""}
                  onChange={(e) => onUpdate({ description: e.target.value || null })}
                  placeholder="Descreva o objetivo do seu quiz..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* URL & Domain */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                URL e Domínio
              </CardTitle>
              <CardDescription>
                Configure o link de acesso ao seu quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Slug Personalizado</Label>
                <div className="flex gap-2">
                  <Input
                    value={quiz.custom_slug || ""}
                    onChange={(e) => onUpdate({ custom_slug: e.target.value || null })}
                    placeholder="meu-quiz"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => onUpdate({ custom_slug: generateSlug(quiz.name) })}
                  >
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use apenas letras, números e hífens
                </p>
              </div>

              <div className="space-y-2">
                <Label>Link do Quiz</Label>
                <div className="flex gap-2">
                  <Input
                    value={quizUrl}
                    readOnly
                    className="bg-muted"
                  />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Domínio Personalizado</Label>
                <Input
                  value={quiz.custom_domain || ""}
                  onChange={(e) => onUpdate({ custom_domain: e.target.value || null })}
                  placeholder="quiz.seusite.com"
                />
                <p className="text-xs text-muted-foreground">
                  Configure um CNAME apontando para nossa plataforma
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Pixels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Pixels de Rastreamento
              </CardTitle>
              <CardDescription>
                Integre ferramentas de análise e remarketing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={quiz.facebook_pixel || ""}
                  onChange={(e) => onUpdate({ facebook_pixel: e.target.value || null })}
                  placeholder="123456789012345"
                />
              </div>

              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={quiz.google_analytics || ""}
                  onChange={(e) => onUpdate({ google_analytics: e.target.value || null })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label>TikTok Pixel ID</Label>
                <Input
                  value={quiz.tiktok_pixel || ""}
                  onChange={(e) => onUpdate({ tiktok_pixel: e.target.value || null })}
                  placeholder="CXXXXXXXXXXXXXXXXX"
                />
              </div>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Código de Incorporação
              </CardTitle>
              <CardDescription>
                Incorpore o quiz em seu site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Iframe</Label>
                <Textarea
                  value={`<iframe src="${quizUrl}" width="100%" height="600" frameborder="0" allow="clipboard-write"></iframe>`}
                  readOnly
                  className="bg-muted font-mono text-xs"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Link Direto</Label>
                <Textarea
                  value={`<a href="${quizUrl}" target="_blank">Responder Quiz</a>`}
                  readOnly
                  className="bg-muted font-mono text-xs"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
