
# Plano: Conceder Acesso Manual a Produtos para Clientes

## Resumo
Adicionar funcionalidade para que o vendedor possa conceder acesso manual a qualquer produto da área de membros para um cliente existente. Isso será útil para:
- Dar bônus de outros produtos
- Corrigir acessos perdidos
- Conceder produtos adicionais sem nova compra

---

## Arquitetura da Solução

A funcionalidade será implementada em duas partes:

1. **Frontend** - Adicionar UI na página de Clientes (`ClientDetailDialog`) para selecionar produto e conceder acesso
2. **Edge Function** - Reutilizar a lógica existente no `mark-as-paid` ou criar endpoint dedicado para conceder acesso

Como o AdminUsers.tsx já tem essa lógica funcionando para Super Admins, vamos adaptar para vendedores normais, com a diferença de que:
- Vendedores só podem conceder acesso aos **seus próprios produtos**
- Usaremos uma Edge Function para garantir segurança e criar o usuário se necessário

---

## Componentes a Serem Modificados

### 1. Nova Edge Function: `grant-member-access`

**Arquivo:** `supabase/functions/grant-member-access/index.ts`

Esta função:
- Recebe `email`, `name` (opcional), e `productId`
- Valida se o produto pertence ao vendedor autenticado
- Cria usuário se não existir (senha padrão 123456)
- Atribui role `member` se necessário
- Cria membership
- Opcionalmente envia email de acesso

```text
Flow:
┌──────────────────────┐
│   Frontend           │
│  (ClientDetailDialog)│
└──────────┬───────────┘
           │ POST /grant-member-access
           │ { email, name, productId, sendEmail }
           ▼
┌──────────────────────┐
│   Edge Function      │
│  grant-member-access │
├──────────────────────┤
│ 1. Validate JWT      │
│ 2. Check product owner│
│ 3. Create/get user   │
│ 4. Assign member role│
│ 5. Create membership │
│ 6. Send email (opt)  │
└──────────────────────┘
```

### 2. Atualizar Configuração: `supabase/config.toml`

Adicionar a nova função:
```toml
[functions.grant-member-access]
verify_jwt = true
```

### 3. Modificar ClientDetailDialog: `src/components/clients/ClientDetailDialog.tsx`

Adicionar:
- Botão "Conceder Acesso" no dialog de detalhes do cliente
- Dialog secundário para selecionar o produto
- Opção de enviar email de acesso
- Loading state e feedback

---

## Detalhes Técnicos

### Edge Function `grant-member-access`

```typescript
// Principais passos:

// 1. Validar JWT e obter user_id do vendedor
const authHeader = req.headers.get('Authorization');
const { data: { user } } = await supabase.auth.getUser(token);

// 2. Buscar produto e validar propriedade
const { data: product } = await supabase
  .from('products')
  .select('id, name, seller_id')
  .eq('id', productId)
  .single();

if (product.seller_id !== user.id) {
  return error("Você só pode conceder acesso aos seus próprios produtos");
}

// 3. Criar ou obter usuário existente
// (reutiliza lógica do mark-as-paid)

// 4. Criar membership

// 5. Enviar email de acesso (opcional)
```

### Modificações no Frontend (ClientDetailDialog)

1. **Novos estados:**
```typescript
const [grantAccessDialogOpen, setGrantAccessDialogOpen] = useState(false);
const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
const [selectedProductId, setSelectedProductId] = useState("");
const [sendAccessEmail, setSendAccessEmail] = useState(true);
const [grantingAccess, setGrantingAccess] = useState(false);
```

2. **Função para buscar produtos do vendedor:**
```typescript
const fetchSellerProducts = async () => {
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("seller_id", user.id)
    .eq("status", "active");
  
  setSellerProducts(products || []);
};
```

3. **Função para conceder acesso:**
```typescript
const handleGrantAccess = async () => {
  const response = await supabase.functions.invoke('grant-member-access', {
    body: {
      email: client.buyer_email,
      name: client.buyer_name,
      productId: selectedProductId,
      sendEmail: sendAccessEmail
    }
  });
  
  if (!response.error) {
    toast.success("Acesso concedido com sucesso!");
    setGrantAccessDialogOpen(false);
  }
};
```

4. **UI - Botão no dialog de cliente:**
```tsx
<Button 
  onClick={() => {
    fetchSellerProducts();
    setGrantAccessDialogOpen(true);
  }}
  className="w-full"
>
  <UserPlus className="mr-2 h-4 w-4" />
  Conceder Acesso a Produto
</Button>
```

5. **UI - Dialog de seleção de produto:**
```tsx
<Dialog open={grantAccessDialogOpen} onOpenChange={setGrantAccessDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Conceder Acesso</DialogTitle>
      <DialogDescription>
        Dar acesso a {client.buyer_email} à área de membros
      </DialogDescription>
    </DialogHeader>
    
    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um produto..." />
      </SelectTrigger>
      <SelectContent>
        {sellerProducts.map(product => (
          <SelectItem key={product.id} value={product.id}>
            {product.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    
    <div className="flex items-center space-x-2">
      <Switch checked={sendAccessEmail} onCheckedChange={setSendAccessEmail} />
      <Label>Enviar email com dados de acesso</Label>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setGrantAccessDialogOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleGrantAccess} disabled={!selectedProductId || grantingAccess}>
        {grantingAccess ? "Concedendo..." : "Conceder Acesso"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Fluxo Completo

Quando o vendedor clicar em "Conceder Acesso":

1. **Seleção de Produto**
   - Lista apenas os produtos ativos do próprio vendedor
   - Opção de enviar email de acesso

2. **Validação de Segurança (Edge Function)**
   - JWT verificado
   - Produto deve pertencer ao vendedor

3. **Criação de Usuário (se necessário)**
   - Se email não existe: cria usuário com senha 123456
   - Atribui role `member`

4. **Criação de Membership**
   - Verifica se já existe acesso ao produto
   - Se não existir, cria novo membership

5. **Notificação (opcional)**
   - Envia email via `send-member-access-email` se solicitado

---

## Arquivos a Serem Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/grant-member-access/index.ts` | **Criar** - Nova Edge Function |
| `supabase/config.toml` | **Modificar** - Adicionar configuração da função |
| `src/components/clients/ClientDetailDialog.tsx` | **Modificar** - Adicionar botão e dialog de concessão de acesso |

---

## Considerações de Segurança

- A função requer autenticação JWT obrigatória
- Vendedor só pode conceder acesso a produtos onde ele é o `seller_id`
- Usa `service_role` internamente para operações privilegiadas (criar usuários)
- Valida se membership já existe para evitar duplicatas
- Logs de operação são mantidos para auditoria

---

## Resultado Esperado

Após a implementação:
- Na página de **Clientes**, ao clicar em um cliente e abrir os detalhes
- Haverá um botão "Conceder Acesso a Produto"
- Ao clicar, abre dialog para selecionar o produto
- O cliente receberá acesso à área de membros do produto selecionado
- Opcionalmente, um email com as credenciais será enviado
