import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Link as LinkIcon, 
  Copy, 
  Check,
  Plus,
  ExternalLink,
  Wallet,
  Clock,
  ArrowUpRight,
  History
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Affiliate {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  pending_balance: number;
  available_balance: number;
  pix_key: string | null;
  pix_key_type: string | null;
  status: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    seller_id: string;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  commission_rate: number;
  seller_id: string;
  allow_affiliates: boolean;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
  available_at: string | null;
  created_at: string;
  transaction_id: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  pix_key: string;
  pix_key_type: string;
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
}

const Affiliates = () => {
  const [affiliations, setAffiliations] = useState<Affiliate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [selectedAffiliateId, setSelectedAffiliateId] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const totalPendingBalance = affiliations.reduce((sum, a) => sum + Number(a.pending_balance || 0), 0);
  const totalAvailableBalance = affiliations.reduce((sum, a) => sum + Number(a.available_balance || 0), 0);

  const stats = {
    totalAffiliates: affiliations.length,
    totalSales: affiliations.reduce((sum, a) => sum + a.total_sales, 0),
    totalEarnings: affiliations.reduce((sum, a) => sum + Number(a.total_earnings), 0),
    pendingBalance: totalPendingBalance,
    availableBalance: totalAvailableBalance,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    await Promise.all([
      fetchAffiliations(user.id),
      fetchProducts(user.id),
      fetchCommissions(user.id),
      fetchWithdrawals(user.id),
    ]);
    setLoading(false);
  };

  const fetchAffiliations = async (userId: string) => {
    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        *,
        products (id, name, price, seller_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar afiliações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAffiliations(data || []);
    }
  };

  const fetchProducts = async (userId: string) => {
    // Fetch products that allow affiliates and are not owned by current user
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, commission_rate, seller_id, allow_affiliates')
      .eq('status', 'active')
      .eq('allow_affiliates', true)
      .neq('seller_id', userId);

    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchCommissions = async (userId: string) => {
    // Get affiliate IDs first
    const { data: affiliatesData } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', userId);

    if (!affiliatesData || affiliatesData.length === 0) return;

    const affiliateIds = affiliatesData.map(a => a.id);

    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select('*')
      .in('affiliate_id', affiliateIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setCommissions(data);
    }
  };

  const fetchWithdrawals = async (userId: string) => {
    const { data: affiliatesData } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', userId);

    if (!affiliatesData || affiliatesData.length === 0) return;

    const affiliateIds = affiliatesData.map(a => a.id);

    const { data, error } = await supabase
      .from('affiliate_withdrawals')
      .select('*')
      .in('affiliate_id', affiliateIds)
      .order('requested_at', { ascending: false });

    if (!error && data) {
      setWithdrawals(data);
    }
  };

  const generateAffiliateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleBecomeAffiliate = async () => {
    if (!selectedProduct) {
      toast({
        title: "Selecione um produto",
        description: "Escolha um produto para se afiliar.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const product = products.find(p => p.id === selectedProduct);
    const affiliateCode = generateAffiliateCode();

    const { error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        product_id: selectedProduct,
        affiliate_code: affiliateCode,
        commission_rate: product?.commission_rate || 10,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Já afiliado",
          description: "Você já está afiliado a este produto.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar afiliação",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Afiliação criada!",
        description: "Seu link de afiliado está pronto.",
      });
      fetchData();
      setDialogOpen(false);
      setSelectedProduct("");
    }
  };

  const copyAffiliateLink = async (code: string, productId: string) => {
    const link = `${window.location.origin}/?page=checkout&productId=${productId}&ref=${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedCode(code);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus contatos.",
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleWithdrawalRequest = async () => {
    if (!selectedAffiliateId || !withdrawalAmount || !pixKey) {
      toast({
        title: "Preencha todos os campos",
        description: "Informe o valor e a chave PIX.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    const affiliate = affiliations.find(a => a.id === selectedAffiliateId);

    if (!affiliate || amount > Number(affiliate.available_balance)) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor solicitado é maior que o saldo disponível.",
        variant: "destructive",
      });
      return;
    }

    if (amount < 50) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para saque é R$ 50,00.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('affiliate_withdrawals')
      .insert({
        affiliate_id: selectedAffiliateId,
        amount,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
      });

    if (error) {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saque solicitado!",
        description: "Aguarde a aprovação do administrador.",
      });
      fetchData();
      setWithdrawalDialogOpen(false);
      setWithdrawalAmount("");
      setPixKey("");
      setSelectedAffiliateId("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      case 'available':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Disponível</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Pago</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Afiliados</h1>
            <p className="text-muted-foreground">Gerencie suas afiliações, comissões e saques</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={totalAvailableBalance < 50}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Solicitar Saque
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>Solicitar Saque</DialogTitle>
                  <DialogDescription>
                    Informe o valor e a chave PIX para receber sua comissão.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Afiliação</Label>
                    <Select value={selectedAffiliateId} onValueChange={setSelectedAffiliateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a afiliação" />
                      </SelectTrigger>
                      <SelectContent>
                        {affiliations.filter(a => Number(a.available_balance) >= 50).map((aff) => (
                          <SelectItem key={aff.id} value={aff.id}>
                            {aff.products?.name} - R$ {Number(aff.available_balance).toFixed(2)} disponível
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do Saque</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo: R$ 50,00</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Chave PIX</Label>
                    <Select value={pixKeyType} onValueChange={setPixKeyType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      placeholder="Digite sua chave PIX"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleWithdrawalRequest} 
                    className="w-full btn-success-gradient"
                  >
                    Solicitar Saque
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary-gradient">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Afiliação
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>Tornar-se Afiliado</DialogTitle>
                  <DialogDescription>
                    Escolha um produto para promover e ganhar comissões.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Selecione o Produto</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nenhum produto disponível
                          </SelectItem>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - R$ {product.price.toFixed(2)} ({product.commission_rate}% comissão)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleBecomeAffiliate} 
                    className="w-full btn-success-gradient"
                    disabled={products.length === 0}
                  >
                    Gerar Link de Afiliado
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produtos Afiliados</p>
                  <h3 className="text-2xl font-bold">{stats.totalAffiliates}</h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
                  <h3 className="text-2xl font-bold">{stats.totalSales}</h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ganhos Totais</p>
                  <h3 className="text-2xl font-bold gradient-success-text">
                    R$ {stats.totalEarnings.toFixed(2)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Pendente</p>
                  <h3 className="text-2xl font-bold text-yellow-500">
                    R$ {stats.pendingBalance.toFixed(2)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <h3 className="text-2xl font-bold text-green-500">
                    R$ {stats.availableBalance.toFixed(2)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="affiliations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="affiliations">
              <LinkIcon className="h-4 w-4 mr-2" />
              Minhas Afiliações
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <History className="h-4 w-4 mr-2" />
              Histórico de Comissões
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Saques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="affiliations">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Minhas Afiliações</CardTitle>
                <CardDescription>Produtos que você está promovendo</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : affiliations.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma afiliação ainda</h3>
                    <p className="text-muted-foreground mb-4">
                      Torne-se afiliado de um produto e comece a ganhar comissões.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {affiliations.map((affiliation) => (
                      <div 
                        key={affiliation.id} 
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{affiliation.products?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Código: <span className="font-mono text-primary">{affiliation.affiliate_code}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              Comissão: <span className="text-foreground">{affiliation.commission_rate}%</span>
                            </span>
                            <span className="text-muted-foreground">
                              Vendas: <span className="text-foreground">{affiliation.total_sales}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Pendente: <span className="text-yellow-500 font-medium">R$ {Number(affiliation.pending_balance || 0).toFixed(2)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Disponível: <span className="text-green-500 font-medium">R$ {Number(affiliation.available_balance || 0).toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyAffiliateLink(affiliation.affiliate_code, affiliation.products?.id)}
                          >
                            {copiedCode === affiliation.affiliate_code ? (
                              <Check className="h-4 w-4 text-accent" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/?page=checkout&productId=${affiliation.products?.id}&ref=${affiliation.affiliate_code}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Histórico de Comissões</CardTitle>
                <CardDescription>Suas comissões por venda</CardDescription>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma comissão registrada ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commissions.map((commission) => (
                      <div 
                        key={commission.id}
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-green-500">+ R$ {Number(commission.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(commission.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                          {commission.available_at && commission.status === 'pending' && (
                            <p className="text-xs text-yellow-500">
                              Disponível em: {format(new Date(commission.available_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div>
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Histórico de Saques</CardTitle>
                <CardDescription>Seus pedidos de saque</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum saque solicitado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((withdrawal) => (
                      <div 
                        key={withdrawal.id}
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">R$ {Number(withdrawal.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            PIX: {withdrawal.pix_key}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Solicitado em: {format(new Date(withdrawal.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                          {withdrawal.processed_at && (
                            <p className="text-xs text-muted-foreground">
                              Processado em: {format(new Date(withdrawal.processed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          )}
                          {withdrawal.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Obs: {withdrawal.notes}
                            </p>
                          )}
                        </div>
                        <div>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Affiliates;