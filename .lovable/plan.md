
# Plano: Adicionar Seção "Área de Membros Estilo Netflix"

## Objetivo

Criar uma nova seção na landing page de vendas destacando a funcionalidade de Área de Membros com design estilo Netflix, seguindo o padrão visual e de código dos componentes existentes.

---

## Arquivos a Criar/Modificar

### 1. Criar: `src/components/sales/MembersAreaSection.tsx`

Novo componente React seguindo o padrão dos outros componentes de vendas (ex: `WhiteLabelSection.tsx`):

**Estrutura:**
- Layout em grid 2 colunas (texto à esquerda, imagem à direita)
- Animações com `framer-motion` e `useInView`
- Lista de features com ícones de check
- Imagem com efeito glass-card e blur de fundo
- Design responsivo mobile-first

**Features a exibir:**
- Player de vídeo HD
- Organização por módulos
- Progresso automático
- Design responsivo
- Gestor de Alunos completo

**Código do componente:**

```typescript
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

const features = [
  "Player de vídeo HD",
  "Organização por módulos",
  "Progresso automático",
  "Design responsivo",
  "Gestor de Alunos completo",
];

export const MembersAreaSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Área de Membros{" "}
              <span className="gradient-text">Estilo Netflix</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              Entregue conteúdo de forma profissional com uma área de membros
              moderna, responsiva e com experiência premium para seus alunos.
            </p>
            <ul className="space-y-3 sm:space-y-4 inline-flex flex-col items-start">
              {features.map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3 text-base sm:text-lg"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
            <div className="relative glass-card overflow-hidden rounded-2xl">
              <img
                src="/assets/members-area.png"
                alt="Área de Membros"
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
```

---

### 2. Modificar: `src/pages/SalesPage.tsx`

Importar e adicionar o novo componente na página de vendas.

**Posição sugerida:** Após `CompleteSystemSection` e antes de `WhiteLabelSection` (já que ambos tratam de funcionalidades do sistema).

**Alterações:**

```diff
+ import { MembersAreaSection } from "@/components/sales/MembersAreaSection";

  // Na renderização, adicionar após CompleteSystemSection:
  <CompleteSystemSection onBuyClick={handleBuyClick} />
  
+ {/* Section - Members Area Netflix Style */}
+ <MembersAreaSection />
  
  {/* Section 4 - White Label */}
  <WhiteLabelSection />
```

---

### 3. Imagem da Área de Membros

O HTML original referencia `/assets/members-area-Cp4roTKZ.png`. Precisamos de uma imagem para a área de membros.

**Opções:**
1. Se você já tem a imagem, adicionar em `public/assets/members-area.png`
2. Usar um screenshot existente do sistema (ex: dashboard ou outra tela)
3. Criar/solicitar uma imagem da área de membros

---

## Estrutura Visual

```text
┌─────────────────────────────────────────────────────────────┐
│                    SEÇÃO ÁREA DE MEMBROS                    │
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│  Área de Membros            │    ┌───────────────────────┐  │
│  Estilo Netflix             │    │  [blur background]     │ │
│                             │    │  ┌─────────────────┐   │ │
│  Entregue conteúdo de       │    │  │                 │   │ │
│  forma profissional...      │    │  │  [IMAGEM DA     │   │ │
│                             │    │  │   ÁREA DE       │   │ │
│  ✓ Player de vídeo HD       │    │  │   MEMBROS]      │   │ │
│  ✓ Organização por módulos  │    │  │                 │   │ │
│  ✓ Progresso automático     │    │  │                 │   │ │
│  ✓ Design responsivo        │    │  └─────────────────┘   │ │
│  ✓ Gestor de Alunos         │    └───────────────────────┘  │
│                             │                               │
└─────────────────────────────┴───────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Ação |
|---------|------|
| `src/components/sales/MembersAreaSection.tsx` | **Criar** - Novo componente |
| `src/pages/SalesPage.tsx` | **Modificar** - Importar e adicionar seção |
| `public/assets/members-area.png` | **Adicionar** - Imagem da área de membros (se disponível) |

---

## Comportamento Esperado

- Seção aparece entre "Sistema Completo" e "White Label"
- Layout responsivo: empilhado no mobile, 2 colunas no desktop
- Animações suaves ao entrar na viewport
- Lista de features com ícones de check verdes
- Imagem com efeito glass-card e blur de fundo
- Mantém consistência visual com outras seções da página
