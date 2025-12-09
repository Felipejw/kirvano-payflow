import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Plus, 
  Palette, 
  Edit2, 
  Trash2, 
  Copy,
  Globe,
  Loader2,
  MoreVertical,
  CheckCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckoutTemplateDialog } from "@/components/checkout/CheckoutTemplateDialog";

interface CheckoutTemplate {
  id: string;
  name: string;
  description: string | null;
  primary_color: string;
  background_color: string;
  custom_domain: string | null;
  domain_verified: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional fields from the dialog
}

const CheckoutTemplates = () => {
  const [templates, setTemplates] = useState<CheckoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CheckoutTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('checkout_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar templates");
      console.error(error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = (template: CheckoutTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDuplicate = async (template: CheckoutTemplate) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { id, created_at, updated_at, ...templateData } = template;
    
    const { error } = await supabase
      .from('checkout_templates')
      .insert({
        ...templateData,
        name: `${template.name} (Cópia)`,
        user_id: user.id,
        custom_domain: null,
        domain_verified: false,
      });

    if (error) {
      toast.error("Erro ao duplicar template");
    } else {
      toast.success("Template duplicado com sucesso!");
      fetchTemplates();
    }
  };

  const confirmDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    const { error } = await supabase
      .from('checkout_templates')
      .delete()
      .eq('id', templateToDelete);

    if (error) {
      toast.error("Erro ao excluir template");
    } else {
      toast.success("Template excluído com sucesso!");
      fetchTemplates();
    }
    
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">Templates de Checkout</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Crie e gerencie templates personalizados para seus checkouts
            </p>
          </div>
          <Button onClick={handleCreate} className="btn-primary-gradient w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Palette className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Crie templates personalizados para usar em seus produtos e oferecer uma experiência única aos seus clientes.
              </p>
              <Button onClick={handleCreate} className="btn-primary-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="glass-card group hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: template.primary_color }}
                      >
                        <Palette className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="text-xs line-clamp-1">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmDelete(template.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Color Preview */}
                  <div className="flex gap-2 mb-3">
                    <div 
                      className="w-6 h-6 rounded border border-border" 
                      style={{ backgroundColor: template.background_color }}
                      title="Cor de fundo"
                    />
                    <div 
                      className="w-6 h-6 rounded border border-border" 
                      style={{ backgroundColor: template.primary_color }}
                      title="Cor principal"
                    />
                  </div>

                  {/* Domain Status */}
                  {template.custom_domain ? (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate flex-1">
                        {template.custom_domain}
                      </span>
                      {template.domain_verified ? (
                        <Badge variant="success" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">
                          Pendente
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sem domínio personalizado
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Template Dialog */}
      <CheckoutTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSuccess={fetchTemplates}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
              Produtos que usam este template voltarão para as configurações padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CheckoutTemplates;
