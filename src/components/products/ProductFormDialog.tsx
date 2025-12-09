import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Link, X, Package, BarChart3 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  status: string;
  commission_rate: number;
  cover_url: string | null;
  content_url: string | null;
  allow_affiliates?: boolean;
  order_bumps?: string[];
  deliverable_url?: string | null;
  deliverable_type?: string | null;
  facebook_pixel?: string | null;
  tiktok_pixel?: string | null;
  google_analytics?: string | null;
  checkout_theme?: string | null;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductFormDialog({ open, onOpenChange, product, onSuccess }: ProductFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
  const [coverInputType, setCoverInputType] = useState<'url' | 'upload'>('url');
  const [deliverableInputType, setDeliverableInputType] = useState<'url' | 'upload'>('url');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    price: 0,
    type: "digital",
    status: "active",
    commission_rate: 10,
    cover_url: "",
    content_url: "",
    allow_affiliates: false,
    order_bumps: [],
    deliverable_url: "",
    deliverable_type: "file",
    facebook_pixel: "",
    tiktok_pixel: "",
    google_analytics: "",
    checkout_theme: "dark",
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploadingCover(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/products/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('checkout-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('checkout-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, cover_url: publicUrl });
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      toast.error(error.message || "Erro ao enviar imagem");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeliverableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 50MB.");
      return;
    }

    setUploadingDeliverable(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/deliverables/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('checkout-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('checkout-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, deliverable_url: publicUrl, deliverable_type: 'file' });
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      console.error('Error uploading deliverable:', error);
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setUploadingDeliverable(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAvailableProducts();
    }
    
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        type: product.type,
        status: product.status,
        commission_rate: product.commission_rate,
        cover_url: product.cover_url || "",
        content_url: product.content_url || "",
        allow_affiliates: product.allow_affiliates || false,
        order_bumps: product.order_bumps || [],
        deliverable_url: product.deliverable_url || "",
        deliverable_type: product.deliverable_type || "file",
        facebook_pixel: product.facebook_pixel || "",
        tiktok_pixel: product.tiktok_pixel || "",
        google_analytics: product.google_analytics || "",
        checkout_theme: product.checkout_theme || "dark",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        type: "digital",
        status: "active",
        commission_rate: 10,
        cover_url: "",
        content_url: "",
        allow_affiliates: false,
        order_bumps: [],
        deliverable_url: "",
        deliverable_type: "file",
        facebook_pixel: "",
        tiktok_pixel: "",
        google_analytics: "",
        checkout_theme: "dark",
      });
    }
  }, [product, open]);

  const fetchAvailableProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('seller_id', user.id)
      .eq('status', 'active');

    if (data) {
      setAvailableProducts(data as Product[]);
    }
  };

  const handleOrderBumpToggle = (productId: string) => {
    const currentBumps = formData.order_bumps || [];
    if (currentBumps.includes(productId)) {
      setFormData({
        ...formData,
        order_bumps: currentBumps.filter(id => id !== productId)
      });
    } else {
      setFormData({
        ...formData,
        order_bumps: [...currentBumps, productId]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      if (!formData.name || formData.price <= 0) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        type: formData.type,
        status: formData.status,
        commission_rate: formData.allow_affiliates ? formData.commission_rate : 0,
        cover_url: formData.cover_url || null,
        content_url: formData.content_url || null,
        seller_id: user.id,
        allow_affiliates: formData.allow_affiliates,
        order_bumps: formData.order_bumps || [],
        deliverable_url: formData.deliverable_url || null,
        deliverable_type: formData.deliverable_type || null,
        facebook_pixel: formData.facebook_pixel || null,
        tiktok_pixel: formData.tiktok_pixel || null,
        google_analytics: formData.google_analytics || null,
        checkout_theme: formData.checkout_theme || "dark",
      };

      if (product?.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success("Produto criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  // Filter out current product from order bumps list
  const orderBumpOptions = availableProducts.filter(p => p.id !== product?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do produto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Curso de Marketing Digital"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva seu produto..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="physical">Físico</SelectItem>
                      <SelectItem value="service">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkout Theme Section */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
              <div>
                <Label className="text-base">Tema do Checkout</Label>
                <p className="text-sm text-muted-foreground">Escolha o estilo visual do checkout deste produto</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setFormData({ ...formData, checkout_theme: "dark" })}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    formData.checkout_theme === "dark" 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="h-16 rounded bg-[#0a1628] mb-2 flex items-center justify-center">
                    <div className="w-12 h-3 rounded" style={{ backgroundColor: '#03c753' }} />
                  </div>
                  <p className="text-sm font-medium text-center">Escuro</p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, checkout_theme: "light" })}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    formData.checkout_theme === "light" 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="h-16 rounded bg-white mb-2 flex items-center justify-center border">
                    <div className="w-12 h-3 rounded" style={{ backgroundColor: '#03c753' }} />
                  </div>
                  <p className="text-sm font-medium text-center">Claro</p>
                </div>
              </div>
            </div>

            {/* Pixel Tracking Section */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
              <div>
                <Label className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Pixels de Rastreamento
                </Label>
                <p className="text-sm text-muted-foreground">Configure os pixels para rastrear conversões deste produto</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="facebook_pixel">Facebook Pixel ID</Label>
                  <Input
                    id="facebook_pixel"
                    value={formData.facebook_pixel || ""}
                    onChange={(e) => setFormData({ ...formData, facebook_pixel: e.target.value })}
                    placeholder="Ex: 123456789012345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok_pixel">TikTok Pixel ID</Label>
                  <Input
                    id="tiktok_pixel"
                    value={formData.tiktok_pixel || ""}
                    onChange={(e) => setFormData({ ...formData, tiktok_pixel: e.target.value })}
                    placeholder="Ex: CXXXXXXXXXXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_analytics">Google Analytics ID</Label>
                  <Input
                    id="google_analytics"
                    value={formData.google_analytics || ""}
                    onChange={(e) => setFormData({ ...formData, google_analytics: e.target.value })}
                    placeholder="Ex: G-XXXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Affiliates Section */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Permitir Afiliados</Label>
                  <p className="text-sm text-muted-foreground">Ative para permitir que afiliados promovam seu produto</p>
                </div>
                <Switch
                  checked={formData.allow_affiliates}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_affiliates: checked })}
                />
              </div>

              {formData.allow_affiliates && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="commission">Comissão do Afiliado (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>

            {/* Cover Image Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Imagem do Produto</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={coverInputType === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCoverInputType('url')}
                    className="gap-1"
                  >
                    <Link className="h-3 w-3" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={coverInputType === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCoverInputType('upload')}
                    className="gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Upload
                  </Button>
                </div>
              </div>

              {coverInputType === 'url' ? (
                <Input
                  type="url"
                  value={formData.cover_url || ""}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    {uploadingCover ? (
                      <p className="text-sm text-muted-foreground">Enviando...</p>
                    ) : formData.cover_url ? (
                      <div className="space-y-2">
                        <img src={formData.cover_url} alt="Preview" className="h-20 mx-auto object-contain rounded" />
                        <p className="text-xs text-muted-foreground">Clique para trocar a imagem</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Clique para selecionar uma imagem</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                  />
                </label>
              )}
            </div>

            {/* Deliverable Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Entregável (Opcional)</Label>
                  <p className="text-xs text-muted-foreground">Arquivo ou link entregue após a compra</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={deliverableInputType === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeliverableInputType('url')}
                    className="gap-1"
                  >
                    <Link className="h-3 w-3" />
                    URL
                  </Button>
                  <Button
                    type="button"
                    variant={deliverableInputType === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeliverableInputType('upload')}
                    className="gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Upload
                  </Button>
                </div>
              </div>

              {deliverableInputType === 'url' ? (
                <Input
                  type="url"
                  value={formData.deliverable_url || ""}
                  onChange={(e) => setFormData({ ...formData, deliverable_url: e.target.value })}
                  placeholder="https://exemplo.com/arquivo.pdf"
                />
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    {uploadingDeliverable ? (
                      <p className="text-sm text-muted-foreground">Enviando...</p>
                    ) : formData.deliverable_url ? (
                      <div className="space-y-2">
                        <p className="text-sm text-primary font-medium">Arquivo enviado ✓</p>
                        <p className="text-xs text-muted-foreground break-all">{formData.deliverable_url.split('/').pop()}</p>
                        <p className="text-xs text-muted-foreground">Clique para trocar o arquivo</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, ZIP, MP4 até 50MB</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleDeliverableUpload}
                    disabled={uploadingDeliverable}
                  />
                </label>
              )}
            </div>

            {/* Order Bumps Section */}
            <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
              <div>
                <Label className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Bumps
                </Label>
                <p className="text-sm text-muted-foreground">Selecione produtos para oferecer como upsell no checkout</p>
              </div>

              {orderBumpOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum outro produto disponível para order bump
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {orderBumpOptions.map((p) => (
                    <div 
                      key={p.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <Checkbox
                        checked={formData.order_bumps?.includes(p.id || '') || false}
                        onCheckedChange={() => handleOrderBumpToggle(p.id || '')}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{p.name}</p>
                      </div>
                      <Badge variant="secondary">
                        R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {(formData.order_bumps?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.order_bumps?.map(bumpId => {
                    const bumpProduct = orderBumpOptions.find(p => p.id === bumpId);
                    return bumpProduct ? (
                      <Badge key={bumpId} variant="info" className="gap-1">
                        {bumpProduct.name}
                        <button 
                          type="button" 
                          onClick={() => handleOrderBumpToggle(bumpId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="gradient" className="flex-1" disabled={loading}>
                {loading ? "Salvando..." : (product ? "Atualizar" : "Criar Produto")}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
