import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Ticket, Pencil, Trash2, Copy, Check, Loader2, Search, Calendar, Percent, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  enable_coupons: boolean;
}

interface Coupon {
  id: string;
  product_id: string;
  seller_id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  product?: Product;
}

interface CouponFormData {
  product_id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

const defaultFormData: CouponFormData = {
  product_id: "",
  code: "",
  discount_type: "percentage",
  discount_value: 10,
  max_uses: null,
  min_purchase_amount: 0,
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: null,
  is_active: true,
};

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch products with coupons enabled
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, price, enable_coupons")
      .eq("seller_id", user.id)
      .eq("status", "active")
      .order("name");

    if (productsData) {
      setProducts(productsData);
    }

    // Fetch coupons
    const { data: couponsData, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (couponsData) {
      // Map product names to coupons
      const couponsWithProducts = couponsData.map(coupon => ({
        ...coupon,
        product: productsData?.find(p => p.id === coupon.product_id),
      }));
      setCoupons(couponsWithProducts as Coupon[]);
    }

    setLoading(false);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        product_id: coupon.product_id,
        code: coupon.code,
        discount_type: coupon.discount_type as "percentage" | "fixed",
        discount_value: coupon.discount_value,
        max_uses: coupon.max_uses,
        min_purchase_amount: coupon.min_purchase_amount,
        valid_from: coupon.valid_from?.split("T")[0] || "",
        valid_until: coupon.valid_until?.split("T")[0] || null,
        is_active: coupon.is_active,
      });
    } else {
      setEditingCoupon(null);
      setFormData(defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.product_id) {
      toast.error("Selecione um produto");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Digite o código do cupom");
      return;
    }
    if (formData.discount_value <= 0) {
      toast.error("O valor do desconto deve ser maior que zero");
      return;
    }
    if (formData.discount_type === "percentage" && formData.discount_value > 100) {
      toast.error("O desconto percentual não pode exceder 100%");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const couponData = {
      product_id: formData.product_id,
      seller_id: user.id,
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      max_uses: formData.max_uses || null,
      min_purchase_amount: formData.min_purchase_amount || 0,
      valid_from: formData.valid_from || new Date().toISOString(),
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
    };

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);

        if (error) throw error;
        toast.success("Cupom atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("coupons")
          .insert(couponData);

        if (error) {
          if (error.code === "23505") {
            toast.error("Já existe um cupom com este código para este produto");
          } else {
            throw error;
          }
          setSaving(false);
          return;
        }
        toast.success("Cupom criado com sucesso!");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      toast.error(error.message || "Erro ao salvar cupom");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    if (error) {
      toast.error("Erro ao atualizar cupom");
      return;
    }

    toast.success(coupon.is_active ? "Cupom desativado" : "Cupom ativado");
    fetchData();
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom "${coupon.code}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", coupon.id);

    if (error) {
      toast.error("Erro ao excluir cupom");
      return;
    }

    toast.success("Cupom excluído com sucesso!");
    fetchData();
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productsWithCoupons = products.filter(p => p.enable_coupons);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="h-6 w-6 text-primary" />
              Cupons de Desconto
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie cupons promocionais para seus produtos
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} disabled={productsWithCoupons.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cupom
          </Button>
        </div>

        {/* Warning if no products with coupons enabled */}
        {productsWithCoupons.length === 0 && !loading && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <p className="text-amber-500">
                ⚠️ Nenhum produto com cupons habilitados. Habilite cupons nas configurações de um produto para criar cupons.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cupom ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Cupons</CardTitle>
            <CardDescription>
              {coupons.length} cupom(ns) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum cupom encontrado" : "Nenhum cupom cadastrado ainda"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold bg-secondary px-2 py-1 rounded">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopyCode(coupon.code)}
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{coupon.product?.name || "Produto removido"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            {coupon.discount_type === "percentage" ? (
                              <>
                                <Percent className="h-3 w-3" />
                                {coupon.discount_value}%
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(coupon.discount_value)}
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {coupon.used_count}
                            {coupon.max_uses ? ` / ${coupon.max_uses}` : " / ∞"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {coupon.valid_until
                              ? new Date(coupon.valid_until).toLocaleDateString("pt-BR")
                              : "Sem expiração"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={coupon.is_active ? "default" : "secondary"}>
                            {coupon.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Switch
                              checked={coupon.is_active}
                              onCheckedChange={() => handleToggleActive(coupon)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(coupon)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(coupon)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Product Select */}
              <div className="space-y-2">
                <Label>Produto *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  disabled={!!editingCoupon}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsWithCoupons.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Coupon Code */}
              <div className="space-y-2">
                <Label>Código do Cupom *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: DESCONTO10"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo 20 caracteres, letras e números
                </p>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    min="0"
                    max={formData.discount_type === "percentage" ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {/* Max Uses */}
              <div className="space-y-2">
                <Label>Limite de Usos (opcional)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.max_uses || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_uses: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Ilimitado"
                />
              </div>

              {/* Min Purchase */}
              <div className="space-y-2">
                <Label>Valor Mínimo da Compra (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_purchase_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Válido a partir de</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Válido até (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.valid_until || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value || null })
                    }
                  />
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between">
                <Label>Cupom Ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCoupon ? "Salvar" : "Criar Cupom"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Coupons;
