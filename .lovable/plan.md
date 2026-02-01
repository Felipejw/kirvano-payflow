
# Plano: Reduzir Espaçamentos entre Seções da Landing Page

## Problema Identificado

Os componentes da landing page possuem paddings verticais (`py-`) muito grandes, criando espaços excessivos entre as seções. Vou padronizar os espaçamentos para valores menores e mais consistentes.

---

## Análise dos Espaçamentos Atuais

| Componente | Padding Atual | Padding Proposto |
|------------|---------------|------------------|
| SalesHero | `py-8 md:py-12` | **Manter** (hero tem espaço adequado) |
| UseOwnSection | `py-12 md:py-16` | `py-10 md:py-12` |
| SystemShowcaseSection | `py-16 md:py-24` | `py-10 md:py-14` |
| IntegratedGatewaysSection | `py-12 md:py-16` | `py-10 md:py-12` |
| CompleteSystemSection | `py-12 md:py-16` | `py-10 md:py-12` |
| MembersAreaSection | `py-16 sm:py-24` | `py-10 sm:py-14` |
| PWANotificationsSection | `py-16 sm:py-24` | `py-10 sm:py-14` |
| WhiteLabelSection | `py-16 md:py-24` | `py-10 md:py-14` |
| EarningModelsSection | `py-12 md:py-16` | `py-10 md:py-12` |
| SalesTestimonials | `py-16 md:py-24` | `py-10 md:py-14` |
| ClosingOffer | `py-12 md:py-16` | `py-10 md:py-12` |
| SalesFAQ | `py-12 md:py-16` | `py-10 md:py-12` |

---

## Alterações a Realizar

### 1. `src/components/sales/UseOwnSection.tsx`
**Linha 39**: Alterar padding de `py-12 md:py-16` para `py-10 md:py-12`

### 2. `src/components/sales/SystemShowcaseSection.tsx`
**Linha 170**: Alterar padding de `py-16 md:py-24` para `py-10 md:py-14`

### 3. `src/components/sales/IntegratedGatewaysSection.tsx`
**Linha 34**: Alterar padding de `py-12 md:py-16` para `py-10 md:py-12`

### 4. `src/components/sales/CompleteSystemSection.tsx`
**Linha 133**: Alterar padding de `py-12 md:py-16` para `py-10 md:py-12`

### 5. `src/components/sales/MembersAreaSection.tsx`
**Linha 15**: Alterar padding de `py-16 sm:py-24` para `py-10 sm:py-14`

### 6. `src/components/sales/PWANotificationsSection.tsx`
**Linha 20**: Alterar padding de `py-16 sm:py-24` para `py-10 sm:py-14`

### 7. `src/components/sales/WhiteLabelSection.tsx`
**Linha 21**: Alterar padding de `py-16 md:py-24` para `py-10 md:py-14`

### 8. `src/components/sales/EarningModelsSection.tsx`
**Linha 44**: Alterar padding de `py-12 md:py-16` para `py-10 md:py-12`

### 9. `src/components/sales/SalesTestimonials.tsx`
**Linha 81**: Alterar padding de `py-16 md:py-24` para `py-10 md:py-14`

### 10. `src/components/sales/ClosingOffer.tsx`
**Linha 31**: Alterar padding de `py-12 md:py-16` para `py-10 md:py-12`

### 11. `src/components/sales/SalesFAQ.tsx`
**Linha 48**: Alterar padding de `py-12 md:py-16` para `py-10 md:py-12`

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `UseOwnSection.tsx` | `py-12 md:py-16` → `py-10 md:py-12` |
| `SystemShowcaseSection.tsx` | `py-16 md:py-24` → `py-10 md:py-14` |
| `IntegratedGatewaysSection.tsx` | `py-12 md:py-16` → `py-10 md:py-12` |
| `CompleteSystemSection.tsx` | `py-12 md:py-16` → `py-10 md:py-12` |
| `MembersAreaSection.tsx` | `py-16 sm:py-24` → `py-10 sm:py-14` |
| `PWANotificationsSection.tsx` | `py-16 sm:py-24` → `py-10 sm:py-14` |
| `WhiteLabelSection.tsx` | `py-16 md:py-24` → `py-10 md:py-14` |
| `EarningModelsSection.tsx` | `py-12 md:py-16` → `py-10 md:py-12` |
| `SalesTestimonials.tsx` | `py-16 md:py-24` → `py-10 md:py-14` |
| `ClosingOffer.tsx` | `py-12 md:py-16` → `py-10 md:py-12` |
| `SalesFAQ.tsx` | `py-12 md:py-16` → `py-10 md:py-12` |

---

## Resultado Esperado

- Espaçamento mais compacto e consistente entre todas as seções
- Redução de aproximadamente 30-40% no espaçamento vertical total
- Melhor fluxo de leitura na página de vendas
- Página mais objetiva e com menos "scrolling" desnecessário
