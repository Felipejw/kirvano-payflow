import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, Video, FileText, Link as LinkIcon, File } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleForm } from "@/components/members/ModuleForm";
import { LessonForm } from "@/components/members/LessonForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface Product {
  id: string;
  name: string;
  cover_url: string | null;
}

interface Module {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  order_index: number;
}

interface Lesson {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_free: boolean;
}

const getContentTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'pdf':
      return <FileText className="h-4 w-4" />;
    case 'link':
      return <LinkIcon className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
};

export default function MembersConfig() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  
  // Delete states
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (user && productId) {
      fetchData();
    }
  }, [user, productId]);

  const fetchData = async () => {
    try {
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, name, cover_url")
        .eq("id", productId)
        .eq("seller_id", user?.id)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("product_modules")
        .select("*")
        .eq("product_id", productId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      // Fetch lessons for all modules
      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map(m => m.id);
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("module_lessons")
          .select("*")
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true });

        if (lessonsError) throw lessonsError;

        // Group lessons by module_id
        const groupedLessons: Record<string, Lesson[]> = {};
        lessonsData?.forEach(lesson => {
          if (!groupedLessons[lesson.module_id]) {
            groupedLessons[lesson.module_id] = [];
          }
          groupedLessons[lesson.module_id].push(lesson);
        });
        setLessons(groupedLessons);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModule = async (data: { name: string; description: string }) => {
    try {
      if (editingModule) {
        const { error } = await supabase
          .from("product_modules")
          .update({ name: data.name, description: data.description })
          .eq("id", editingModule.id);

        if (error) throw error;
        toast.success("Módulo atualizado!");
      } else {
        const maxOrder = modules.reduce((max, m) => Math.max(max, m.order_index), -1);
        const { error } = await supabase
          .from("product_modules")
          .insert({
            product_id: productId,
            name: data.name,
            description: data.description,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Módulo criado!");
      }
      setModuleFormOpen(false);
      setEditingModule(null);
      fetchData();
    } catch (error: any) {
      console.error("Error saving module:", error);
      toast.error("Erro ao salvar módulo");
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModuleId) return;
    try {
      const { error } = await supabase
        .from("product_modules")
        .delete()
        .eq("id", deleteModuleId);

      if (error) throw error;
      toast.success("Módulo excluído!");
      setDeleteModuleId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting module:", error);
      toast.error("Erro ao excluir módulo");
    }
  };

  const handleSaveLesson = async (data: {
    name: string;
    description: string;
    content_type: string;
    content_url: string;
    duration_minutes: number | null;
    is_free: boolean;
  }) => {
    try {
      if (editingLesson) {
        const { error } = await supabase
          .from("module_lessons")
          .update(data)
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast.success("Aula atualizada!");
      } else {
        const moduleLessons = lessons[selectedModuleId!] || [];
        const maxOrder = moduleLessons.reduce((max, l) => Math.max(max, l.order_index), -1);
        const { error } = await supabase
          .from("module_lessons")
          .insert({
            module_id: selectedModuleId,
            ...data,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Aula criada!");
      }
      setLessonFormOpen(false);
      setEditingLesson(null);
      setSelectedModuleId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      toast.error("Erro ao salvar aula");
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    try {
      const { error } = await supabase
        .from("module_lessons")
        .delete()
        .eq("id", deleteLessonId);

      if (error) throw error;
      toast.success("Aula excluída!");
      setDeleteLessonId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      toast.error("Erro ao excluir aula");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Produto não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/members")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/members")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configurar Área de Membros</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      {/* Add Module Button */}
      <Button onClick={() => { setEditingModule(null); setModuleFormOpen(true); }}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Módulo
      </Button>

      {/* Modules List */}
      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum módulo criado ainda</p>
            <Button variant="outline" onClick={() => { setEditingModule(null); setModuleFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="text-left flex-1">
                    <p className="font-medium">{module.name}</p>
                    {module.description && (
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingModule(module); setModuleFormOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteModuleId(module.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 ml-8">
                  {(lessons[module.id] || []).map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      {getContentTypeIcon(lesson.content_type)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{lesson.name}</p>
                        {lesson.duration_minutes && (
                          <p className="text-xs text-muted-foreground">{lesson.duration_minutes} min</p>
                        )}
                      </div>
                      {lesson.is_free && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Grátis
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingLesson(lesson); setSelectedModuleId(module.id); setLessonFormOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteLessonId(lesson.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-7 mt-2"
                    onClick={() => { setEditingLesson(null); setSelectedModuleId(module.id); setLessonFormOpen(true); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Aula
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Module Form Dialog */}
      <ModuleForm
        open={moduleFormOpen}
        onOpenChange={setModuleFormOpen}
        module={editingModule}
        onSave={handleSaveModule}
      />

      {/* Lesson Form Dialog */}
      <LessonForm
        open={lessonFormOpen}
        onOpenChange={setLessonFormOpen}
        lesson={editingLesson}
        onSave={handleSaveLesson}
      />

      {/* Delete Module Confirmation */}
      <AlertDialog open={!!deleteModuleId} onOpenChange={() => setDeleteModuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Módulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as aulas deste módulo também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Confirmation */}
      <AlertDialog open={!!deleteLessonId} onOpenChange={() => setDeleteLessonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aula?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
