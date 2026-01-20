import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Wallet,
  Clock,
  Check,
  X,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Withdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  pix_key: string;
  pix_key_type: string;
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
  affiliate?: {
    id: string;
    affiliate_code: string;
    user_id: string;
    products?: {
      name: string;
    };
  };
}

interface AffiliateData {
  id: string;
  affiliate_code: string;
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  pending_balance: number;
  available_balance: number;
  status: string;
  created_at: string;
  user_id: string;
  products?: {
    id: string;
    name: string;
    price: number;
  };
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const AdminAffiliates = () => {
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const { toast } = useToast();

  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter(a => a.status === 'active').length,
    totalPending: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0),
    totalPaid: withdrawals.filter(w => w.status === 'paid').reduce((sum, w) => sum + Number(w.amount), 0),
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchAffiliates(),
      fetchWithdrawals(),
    ]);
    setLoading(false);
  };

  const fetchAffiliates = async () => {
    // First get all affiliates for products owned by the admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get products owned by this user
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id);

    if (!products || products.length === 0) {
      setAffiliates([]);
      return;
    }

    const productIds = products.map(p => p.id);

    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        *,
        products (id, name, price)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar afiliados",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Get profile info for each affiliate
      const affiliatesWithProfiles = await Promise.all(
        (data || []).map(async (aff) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', aff.user_id)
            .maybeSingle();
          return {
            ...aff,
            profiles: profileData
          };
        })
      );
      setAffiliates(affiliatesWithProfiles);
    }
  };

  const fetchWithdrawals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get products owned by this user
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id);

    if (!products || products.length === 0) {
      setWithdrawals([]);
      return;
    }

    const productIds = products.map(p => p.id);

    // Get affiliates for these products
    const { data: affiliatesData } = await supabase
      .from('affiliates')
      .select('id, affiliate_code, user_id, products (name)')
      .in('product_id', productIds);

    if (!affiliatesData || affiliatesData.length === 0) {
      setWithdrawals([]);
      return;
    }

    const affiliateIds = affiliatesData.map(a => a.id);

    const { data, error } = await supabase
      .from('affiliate_withdrawals')
      .select('*')
      .in('affiliate_id', affiliateIds)
      .order('requested_at', { ascending: false });

    if (!error && data) {
      // Map affiliate info to withdrawals
      const withdrawalsWithAffiliates = data.map(w => ({
        ...w,
        affiliate: affiliatesData.find(a => a.id === w.affiliate_id)
      }));
      setWithdrawals(withdrawalsWithAffiliates);
    }
  };

  const handleUpdateWithdrawal = async (status: 'approved' | 'rejected' | 'paid') => {
    if (!selectedWithdrawal) return;

    const { error } = await supabase
      .from('affiliate_withdrawals')
      .update({
        status,
        processed_at: new Date().toISOString(),
        notes: actionNotes || null,
      })
      .eq('id', selectedWithdrawal.id);

    if (error) {
      toast({
        title: "Erro ao atualizar saque",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // If paid, deduct from available_balance
      if (status === 'paid') {
        const { data: currentAffiliate } = await supabase
          .from('affiliates')
          .select('available_balance')
          .eq('id', selectedWithdrawal.affiliate_id)
          .single();

        if (currentAffiliate) {
          await supabase
            .from('affiliates')
            .update({
              available_balance: Math.max(0, Number(currentAffiliate.available_balance) - Number(selectedWithdrawal.amount))
            })
            .eq('id', selectedWithdrawal.affiliate_id);
        }
      }

      toast({
        title: "Saque atualizado!",
        description: `Status alterado para ${status === 'approved' ? 'Aprovado' : status === 'rejected' ? 'Rejeitado' : 'Pago'}.`,
      });
      fetchData();
      setDialogOpen(false);
      setActionNotes("");
      setSelectedWithdrawal(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Rejeitado</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredWithdrawals = statusFilter === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === statusFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">Gestão de Afiliados</h1>
          <p className="text-muted-foreground">Gerencie afiliados e solicitações de saque</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Afiliados</p>
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
                  <p className="text-sm text-muted-foreground">Afiliados Ativos</p>
                  <h3 className="text-2xl font-bold">{stats.activeAffiliates}</h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                  <h3 className="text-2xl font-bold text-yellow-500">
                    R$ {stats.totalPending.toFixed(2)}
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
                  <p className="text-sm text-muted-foreground">Total Pago</p>
                  <h3 className="text-2xl font-bold gradient-success-text">
                    R$ {stats.totalPaid.toFixed(2)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="withdrawals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="withdrawals">
              <Wallet className="h-4 w-4 mr-2" />
              Solicitações de Saque
            </TabsTrigger>
            <TabsTrigger value="affiliates">
              <Users className="h-4 w-4 mr-2" />
              Lista de Afiliados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Solicitações de Saque</CardTitle>
                    <CardDescription>Aprovar ou rejeitar saques de afiliados</CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                      <SelectItem value="paid">Pagos</SelectItem>
                      <SelectItem value="rejected">Rejeitados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : filteredWithdrawals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação de saque encontrada.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>PIX</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            <span className="font-mono text-sm">{withdrawal.affiliate?.affiliate_code}</span>
                          </TableCell>
                          <TableCell>{withdrawal.affiliate?.products?.name || '-'}</TableCell>
                          <TableCell className="font-medium">
                            R$ {Number(withdrawal.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-muted-foreground uppercase">{withdrawal.pix_key_type}</p>
                              <p className="font-mono">{withdrawal.pix_key}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(withdrawal.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affiliates">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Lista de Afiliados</CardTitle>
                <CardDescription>Afiliados dos seus produtos</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : affiliates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum afiliado encontrado.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead>Vendas</TableHead>
                        <TableHead>Ganhos</TableHead>
                        <TableHead>Saldo Disponível</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates.map((affiliate) => (
                        <TableRow key={affiliate.id}>
                          <TableCell>
                            <span className="font-mono text-primary">{affiliate.affiliate_code}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{affiliate.profiles?.full_name || 'Não identificado'}</p>
                              <p className="text-xs text-muted-foreground">{affiliate.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{affiliate.products?.name}</TableCell>
                          <TableCell>{affiliate.commission_rate}%</TableCell>
                          <TableCell>{affiliate.total_sales}</TableCell>
                          <TableCell className="text-green-500 font-medium">
                            R$ {Number(affiliate.total_earnings).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            R$ {Number(affiliate.available_balance || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Withdrawal Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Detalhes do Saque</DialogTitle>
              <DialogDescription>
                Revisar e processar solicitação de saque
              </DialogDescription>
            </DialogHeader>
            {selectedWithdrawal && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Afiliado</Label>
                    <p className="font-mono">{selectedWithdrawal.affiliate?.affiliate_code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Produto</Label>
                    <p>{selectedWithdrawal.affiliate?.products?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Valor</Label>
                    <p className="text-xl font-bold text-green-500">
                      R$ {Number(selectedWithdrawal.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status Atual</Label>
                    <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Chave PIX</Label>
                    <p className="font-mono bg-secondary/50 p-2 rounded mt-1">
                      <span className="uppercase text-xs text-muted-foreground">{selectedWithdrawal.pix_key_type}: </span>
                      {selectedWithdrawal.pix_key}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    placeholder="Adicione uma observação sobre esta ação..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  />
                </div>

                {selectedWithdrawal.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleUpdateWithdrawal('rejected')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      className="flex-1 btn-success-gradient"
                      onClick={() => handleUpdateWithdrawal('approved')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </div>
                )}

                {selectedWithdrawal.status === 'approved' && (
                  <Button
                    className="w-full btn-primary-gradient"
                    onClick={() => handleUpdateWithdrawal('paid')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminAffiliates;