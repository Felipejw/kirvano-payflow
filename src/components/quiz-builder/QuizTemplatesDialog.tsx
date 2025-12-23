import { useState } from "react";
import { Sparkles, Scale, Heart, Briefcase, GraduationCap, TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuizTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onQuizCreated: (quizId: string) => void;
}

interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  steps: TemplateStep[];
  settings: {
    primary_color: string;
    background_color: string;
    button_color: string;
  };
}

interface TemplateStep {
  name: string;
  step_type: string;
  order_index: number;
  elements: TemplateElement[];
}

interface TemplateElement {
  element_type: string;
  order_index: number;
  content: any;
}

const TEMPLATES: QuizTemplate[] = [
  {
    id: "weight-loss",
    name: "Quiz de Emagrecimento",
    description: "Qualifique leads interessados em perder peso e recomende o melhor programa",
    category: "Saúde",
    icon: <Scale className="h-6 w-6" />,
    color: "from-emerald-500 to-teal-500",
    settings: {
      primary_color: "#10b981",
      background_color: "#0f172a",
      button_color: "#10b981",
    },
    steps: [
      {
        name: "Boas-vindas",
        step_type: "info",
        order_index: 0,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "🎯 Descubra o Método Ideal Para Você" } },
          { element_type: "text", order_index: 1, content: { text: "Responda algumas perguntas rápidas e descubra qual programa de emagrecimento é perfeito para seu perfil." } },
          { element_type: "button", order_index: 2, content: { text: "Começar Agora", action: "next" } },
        ],
      },
      {
        name: "Objetivo",
        step_type: "question",
        order_index: 1,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual seu principal objetivo?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Perder até 5kg", value: "light" },
              { id: "2", text: "Perder de 5 a 15kg", value: "medium" },
              { id: "3", text: "Perder mais de 15kg", value: "heavy" },
              { id: "4", text: "Manter o peso e ganhar definição", value: "maintain" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Histórico",
        step_type: "question",
        order_index: 2,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Você já tentou alguma dieta antes?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Nunca tentei", value: "never" },
              { id: "2", text: "Sim, mas não funcionou", value: "failed" },
              { id: "3", text: "Sim, funcionou mas voltei a engordar", value: "yoyo" },
              { id: "4", text: "Sim, tive bons resultados", value: "success" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Rotina",
        step_type: "question",
        order_index: 3,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Quanto tempo você tem disponível por dia?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Menos de 30 minutos", value: "30min" },
              { id: "2", text: "30 minutos a 1 hora", value: "1h" },
              { id: "3", text: "1 a 2 horas", value: "2h" },
              { id: "4", text: "Mais de 2 horas", value: "2h+" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Captura de Lead",
        step_type: "form",
        order_index: 4,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Quase lá! 🎉" } },
          { element_type: "text", order_index: 1, content: { text: "Preencha seus dados para receber seu resultado personalizado:" } },
          { element_type: "input", order_index: 2, content: { label: "Seu nome", placeholder: "Digite seu nome", type: "text", required: true } },
          { element_type: "input", order_index: 3, content: { label: "Seu melhor e-mail", placeholder: "seu@email.com", type: "email", required: true } },
          { element_type: "input", order_index: 4, content: { label: "WhatsApp", placeholder: "(00) 00000-0000", type: "tel", required: true } },
          { element_type: "button", order_index: 5, content: { text: "Ver Meu Resultado", action: "next" } },
        ],
      },
      {
        name: "Resultado",
        step_type: "result",
        order_index: 5,
        elements: [
          { element_type: "confetti", order_index: 0, content: { trigger: "onLoad", duration: 3000 } },
          { element_type: "title", order_index: 1, content: { text: "Parabéns! 🏆" } },
          { element_type: "text", order_index: 2, content: { text: "Baseado nas suas respostas, identificamos o programa perfeito para você!" } },
          { element_type: "alert", order_index: 3, content: { type: "success", text: "Você tem grande potencial para alcançar seus objetivos!" } },
          { element_type: "button", order_index: 4, content: { text: "Conhecer o Programa", action: "redirect", url: "" } },
        ],
      },
    ],
  },
  {
    id: "financial",
    name: "Quiz Financeiro",
    description: "Identifique o perfil financeiro do lead e recomende a melhor solução",
    category: "Finanças",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "from-blue-500 to-indigo-500",
    settings: {
      primary_color: "#3b82f6",
      background_color: "#0f172a",
      button_color: "#3b82f6",
    },
    steps: [
      {
        name: "Boas-vindas",
        step_type: "info",
        order_index: 0,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "💰 Descubra Seu Perfil Financeiro" } },
          { element_type: "text", order_index: 1, content: { text: "Em apenas 2 minutos, você vai descobrir como organizar suas finanças e multiplicar seu dinheiro." } },
          { element_type: "button", order_index: 2, content: { text: "Descobrir Agora", action: "next" } },
        ],
      },
      {
        name: "Situação Atual",
        step_type: "question",
        order_index: 1,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Como está sua situação financeira hoje?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Endividado(a)", value: "debt" },
              { id: "2", text: "Vivendo no limite", value: "tight" },
              { id: "3", text: "Conseguindo guardar um pouco", value: "saving" },
              { id: "4", text: "Investindo regularmente", value: "investing" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Objetivo Financeiro",
        step_type: "question",
        order_index: 2,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual seu principal objetivo financeiro?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Sair das dívidas", value: "debt_free" },
              { id: "2", text: "Criar uma reserva de emergência", value: "emergency" },
              { id: "3", text: "Investir para o futuro", value: "invest" },
              { id: "4", text: "Conquistar independência financeira", value: "fire" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Renda",
        step_type: "question",
        order_index: 3,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual sua faixa de renda mensal?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Até R$ 3.000", value: "3k" },
              { id: "2", text: "R$ 3.000 a R$ 7.000", value: "7k" },
              { id: "3", text: "R$ 7.000 a R$ 15.000", value: "15k" },
              { id: "4", text: "Acima de R$ 15.000", value: "15k+" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Captura de Lead",
        step_type: "form",
        order_index: 4,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Seu diagnóstico está pronto! 📊" } },
          { element_type: "text", order_index: 1, content: { text: "Deixe seus dados para receber o resultado completo:" } },
          { element_type: "input", order_index: 2, content: { label: "Nome completo", placeholder: "Seu nome", type: "text", required: true } },
          { element_type: "input", order_index: 3, content: { label: "E-mail", placeholder: "seu@email.com", type: "email", required: true } },
          { element_type: "input", order_index: 4, content: { label: "WhatsApp", placeholder: "(00) 00000-0000", type: "tel", required: true } },
          { element_type: "button", order_index: 5, content: { text: "Ver Diagnóstico", action: "next" } },
        ],
      },
      {
        name: "Resultado",
        step_type: "result",
        order_index: 5,
        elements: [
          { element_type: "confetti", order_index: 0, content: { trigger: "onLoad", duration: 3000 } },
          { element_type: "title", order_index: 1, content: { text: "Seu Perfil Financeiro 📈" } },
          { element_type: "text", order_index: 2, content: { text: "Analisamos suas respostas e preparamos um plano personalizado para você!" } },
          { element_type: "testimonial", order_index: 3, content: { name: "Carlos M.", role: "Empresário", text: "Com esse método, saí das dívidas e hoje invisto todo mês!" } },
          { element_type: "button", order_index: 4, content: { text: "Acessar Meu Plano", action: "redirect", url: "" } },
        ],
      },
    ],
  },
  {
    id: "coaching",
    name: "Quiz de Coaching",
    description: "Avalie o perfil do cliente e ofereça a mentoria adequada",
    category: "Desenvolvimento",
    icon: <GraduationCap className="h-6 w-6" />,
    color: "from-purple-500 to-pink-500",
    settings: {
      primary_color: "#a855f7",
      background_color: "#0f172a",
      button_color: "#a855f7",
    },
    steps: [
      {
        name: "Boas-vindas",
        step_type: "info",
        order_index: 0,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "🚀 Descubra Seu Potencial" } },
          { element_type: "text", order_index: 1, content: { text: "Faça este quiz e descubra qual área da sua vida precisa de mais atenção para você alcançar resultados extraordinários." } },
          { element_type: "button", order_index: 2, content: { text: "Iniciar Autoavaliação", action: "next" } },
        ],
      },
      {
        name: "Área de Foco",
        step_type: "question",
        order_index: 1,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual área você mais deseja desenvolver?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Carreira e negócios", value: "career" },
              { id: "2", text: "Relacionamentos", value: "relationships" },
              { id: "3", text: "Saúde e bem-estar", value: "health" },
              { id: "4", text: "Autoconhecimento", value: "self" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Desafio Atual",
        step_type: "question",
        order_index: 2,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual seu maior desafio atualmente?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Falta de clareza sobre o que quero", value: "clarity" },
              { id: "2", text: "Procrastinação e falta de foco", value: "procrastination" },
              { id: "3", text: "Medo de fracassar", value: "fear" },
              { id: "4", text: "Dificuldade em manter a consistência", value: "consistency" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Comprometimento",
        step_type: "question",
        order_index: 3,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Quanto você está disposto(a) a investir em você?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Estou 100% comprometido(a)", value: "100" },
              { id: "2", text: "Estou motivado(a), mas tenho dúvidas", value: "75" },
              { id: "3", text: "Quero entender melhor antes de decidir", value: "50" },
              { id: "4", text: "Estou apenas explorando opções", value: "25" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Captura de Lead",
        step_type: "form",
        order_index: 4,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Seu perfil está pronto! ✨" } },
          { element_type: "text", order_index: 1, content: { text: "Preencha para receber seu diagnóstico personalizado:" } },
          { element_type: "input", order_index: 2, content: { label: "Como posso te chamar?", placeholder: "Seu nome", type: "text", required: true } },
          { element_type: "input", order_index: 3, content: { label: "Seu melhor e-mail", placeholder: "seu@email.com", type: "email", required: true } },
          { element_type: "input", order_index: 4, content: { label: "WhatsApp para contato", placeholder: "(00) 00000-0000", type: "tel", required: true } },
          { element_type: "button", order_index: 5, content: { text: "Descobrir Meu Perfil", action: "next" } },
        ],
      },
      {
        name: "Resultado",
        step_type: "result",
        order_index: 5,
        elements: [
          { element_type: "confetti", order_index: 0, content: { trigger: "onLoad", duration: 3000 } },
          { element_type: "title", order_index: 1, content: { text: "Seu Perfil de Desenvolvimento 🌟" } },
          { element_type: "text", order_index: 2, content: { text: "Com base nas suas respostas, identificamos exatamente o que você precisa para dar o próximo passo!" } },
          { element_type: "alert", order_index: 3, content: { type: "info", text: "Um de nossos especialistas entrará em contato para uma sessão gratuita de estratégia." } },
          { element_type: "button", order_index: 4, content: { text: "Agendar Sessão Gratuita", action: "redirect", url: "" } },
        ],
      },
    ],
  },
  {
    id: "relationship",
    name: "Quiz de Relacionamentos",
    description: "Identifique o perfil amoroso e ofereça conteúdo personalizado",
    category: "Relacionamentos",
    icon: <Heart className="h-6 w-6" />,
    color: "from-rose-500 to-pink-500",
    settings: {
      primary_color: "#f43f5e",
      background_color: "#0f172a",
      button_color: "#f43f5e",
    },
    steps: [
      {
        name: "Boas-vindas",
        step_type: "info",
        order_index: 0,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "💕 Descubra Seu Perfil Amoroso" } },
          { element_type: "text", order_index: 1, content: { text: "Entenda seus padrões de relacionamento e descubra como atrair e manter o amor da sua vida." } },
          { element_type: "button", order_index: 2, content: { text: "Fazer o Quiz", action: "next" } },
        ],
      },
      {
        name: "Status Atual",
        step_type: "question",
        order_index: 1,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual sua situação amorosa atual?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Solteiro(a) há muito tempo", value: "long_single" },
              { id: "2", text: "Solteiro(a) recentemente", value: "recent_single" },
              { id: "3", text: "Em um relacionamento complicado", value: "complicated" },
              { id: "4", text: "Em um relacionamento, mas quer melhorar", value: "improve" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Objetivo",
        step_type: "question",
        order_index: 2,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "O que você mais busca em um relacionamento?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Encontrar um amor verdadeiro", value: "true_love" },
              { id: "2", text: "Reconquistar um ex", value: "ex_back" },
              { id: "3", text: "Melhorar a comunicação", value: "communication" },
              { id: "4", text: "Reacender a paixão", value: "passion" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Captura de Lead",
        step_type: "form",
        order_index: 3,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Seu perfil está quase pronto! 💖" } },
          { element_type: "text", order_index: 1, content: { text: "Deixe seus dados para receber seu resultado:" } },
          { element_type: "input", order_index: 2, content: { label: "Seu nome", placeholder: "Como posso te chamar?", type: "text", required: true } },
          { element_type: "input", order_index: 3, content: { label: "E-mail", placeholder: "seu@email.com", type: "email", required: true } },
          { element_type: "button", order_index: 4, content: { text: "Ver Meu Perfil", action: "next" } },
        ],
      },
      {
        name: "Resultado",
        step_type: "result",
        order_index: 4,
        elements: [
          { element_type: "confetti", order_index: 0, content: { trigger: "onLoad", duration: 3000 } },
          { element_type: "title", order_index: 1, content: { text: "Seu Perfil Amoroso 💕" } },
          { element_type: "text", order_index: 2, content: { text: "Descobrimos padrões importantes sobre como você se relaciona. Confira seu resultado completo!" } },
          { element_type: "button", order_index: 3, content: { text: "Acessar Resultado Completo", action: "redirect", url: "" } },
        ],
      },
    ],
  },
  {
    id: "business",
    name: "Quiz para Negócios",
    description: "Qualifique leads B2B e identifique oportunidades de venda",
    category: "Negócios",
    icon: <Briefcase className="h-6 w-6" />,
    color: "from-amber-500 to-orange-500",
    settings: {
      primary_color: "#f59e0b",
      background_color: "#0f172a",
      button_color: "#f59e0b",
    },
    steps: [
      {
        name: "Boas-vindas",
        step_type: "info",
        order_index: 0,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "📈 Diagnóstico Empresarial Gratuito" } },
          { element_type: "text", order_index: 1, content: { text: "Descubra em 2 minutos quais são os principais gargalos do seu negócio e como resolvê-los." } },
          { element_type: "button", order_index: 2, content: { text: "Iniciar Diagnóstico", action: "next" } },
        ],
      },
      {
        name: "Segmento",
        step_type: "question",
        order_index: 1,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual o segmento do seu negócio?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Serviços", value: "services" },
              { id: "2", text: "Comércio/E-commerce", value: "ecommerce" },
              { id: "3", text: "Indústria", value: "industry" },
              { id: "4", text: "Infoprodutos/Digital", value: "digital" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Faturamento",
        step_type: "question",
        order_index: 2,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual o faturamento mensal da sua empresa?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Até R$ 50 mil", value: "50k" },
              { id: "2", text: "R$ 50 mil a R$ 200 mil", value: "200k" },
              { id: "3", text: "R$ 200 mil a R$ 1 milhão", value: "1m" },
              { id: "4", text: "Acima de R$ 1 milhão", value: "1m+" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Desafio",
        step_type: "question",
        order_index: 3,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Qual seu maior desafio hoje?" } },
          { element_type: "options", order_index: 1, content: { 
            multiple: false,
            options: [
              { id: "1", text: "Atrair mais clientes", value: "acquisition" },
              { id: "2", text: "Aumentar a conversão de vendas", value: "conversion" },
              { id: "3", text: "Reter clientes e aumentar recorrência", value: "retention" },
              { id: "4", text: "Escalar operações", value: "scale" },
            ]
          }},
          { element_type: "button", order_index: 2, content: { text: "Próximo", action: "next" } },
        ],
      },
      {
        name: "Captura de Lead",
        step_type: "form",
        order_index: 4,
        elements: [
          { element_type: "title", order_index: 0, content: { text: "Seu diagnóstico está pronto! 🎯" } },
          { element_type: "text", order_index: 1, content: { text: "Preencha para receber o relatório completo:" } },
          { element_type: "input", order_index: 2, content: { label: "Nome", placeholder: "Seu nome", type: "text", required: true } },
          { element_type: "input", order_index: 3, content: { label: "E-mail corporativo", placeholder: "seu@empresa.com", type: "email", required: true } },
          { element_type: "input", order_index: 4, content: { label: "WhatsApp", placeholder: "(00) 00000-0000", type: "tel", required: true } },
          { element_type: "input", order_index: 5, content: { label: "Empresa", placeholder: "Nome da empresa", type: "text", required: true } },
          { element_type: "button", order_index: 6, content: { text: "Receber Diagnóstico", action: "next" } },
        ],
      },
      {
        name: "Resultado",
        step_type: "result",
        order_index: 5,
        elements: [
          { element_type: "confetti", order_index: 0, content: { trigger: "onLoad", duration: 3000 } },
          { element_type: "title", order_index: 1, content: { text: "Diagnóstico Concluído! ✅" } },
          { element_type: "text", order_index: 2, content: { text: "Identificamos os principais pontos de melhoria para o seu negócio." } },
          { element_type: "alert", order_index: 3, content: { type: "success", text: "Um consultor especialista entrará em contato em até 24h." } },
          { element_type: "button", order_index: 4, content: { text: "Agendar Reunião", action: "redirect", url: "" } },
        ],
      },
    ],
  },
];

export default function QuizTemplatesDialog({ open, onClose, userId, onQuizCreated }: QuizTemplatesDialogProps) {
  const [creating, setCreating] = useState<string | null>(null);

  async function handleUseTemplate(template: QuizTemplate) {
    try {
      setCreating(template.id);

      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          user_id: userId,
          name: template.name,
          description: template.description,
          status: "draft",
          primary_color: template.settings.primary_color,
          background_color: template.settings.background_color,
          button_color: template.settings.button_color,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create steps
      for (const step of template.steps) {
        const { data: createdStep, error: stepError } = await supabase
          .from("quiz_steps")
          .insert({
            quiz_id: quiz.id,
            name: step.name,
            step_type: step.step_type,
            order_index: step.order_index,
          })
          .select()
          .single();

        if (stepError) throw stepError;

        // Create elements for this step
        for (const element of step.elements) {
          const { error: elementError } = await supabase
            .from("quiz_elements")
            .insert({
              step_id: createdStep.id,
              element_type: element.element_type,
              order_index: element.order_index,
              content: element.content,
              styles: {},
            });

          if (elementError) throw elementError;
        }

        // Create connection to next step (if not last step)
        const nextStep = template.steps[step.order_index + 1];
        if (nextStep) {
          // We'll need to create connections after all steps are created
        }
      }

      // Create linear connections between steps
      const { data: createdSteps } = await supabase
        .from("quiz_steps")
        .select("id, order_index")
        .eq("quiz_id", quiz.id)
        .order("order_index");

      if (createdSteps && createdSteps.length > 1) {
        for (let i = 0; i < createdSteps.length - 1; i++) {
          await supabase.from("quiz_connections").insert({
            quiz_id: quiz.id,
            source_step_id: createdSteps[i].id,
            target_step_id: createdSteps[i + 1].id,
            is_default: true,
          });
        }
      }

      toast.success("Quiz criado a partir do template!");
      onQuizCreated(quiz.id);
      onClose();
    } catch (error: any) {
      console.error("Error creating quiz from template:", error);
      toast.error("Erro ao criar quiz");
    } finally {
      setCreating(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Templates de Quiz
          </DialogTitle>
          <DialogDescription>
            Escolha um template pronto e personalize para seu negócio
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "relative overflow-hidden transition-all hover:border-primary/50 cursor-pointer group",
                  creating === template.id && "opacity-70 pointer-events-none"
                )}
                onClick={() => handleUseTemplate(template)}
              >
                {/* Gradient header */}
                <div className={cn("h-2 bg-gradient-to-r", template.color)} />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br", template.color, "text-white")}>
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.name}
                        {creating === template.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="mb-3">
                    {template.description}
                  </CardDescription>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {template.steps.length} etapas
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Pronto para usar
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    disabled={creating !== null}
                  >
                    {creating === template.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Usar Este Template"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
